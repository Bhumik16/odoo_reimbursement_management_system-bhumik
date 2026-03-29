-- ============================================================
--  REIMBURSEMENT MANAGEMENT SYSTEM — Full Database Schema
--  PostgreSQL 17 · Neon DB
--  Multi-tenant: every row that belongs to a company carries
--  company_id so data is fully isolated per workspace.
-- ============================================================

-- ── Extensions ───────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";   -- uuid_generate_v4()

-- ── ENUMs ────────────────────────────────────────────────

CREATE TYPE user_role AS ENUM ('admin', 'manager', 'employee');

-- Overall status of an expense
CREATE TYPE expense_status AS ENUM ('draft', 'pending', 'approved', 'rejected');

-- Approval action recorded in the audit log
CREATE TYPE approval_action AS ENUM (
  'submitted',
  'manager_approved',
  'manager_rejected',
  'step_approved',
  'step_rejected',
  'auto_approved',
  'final_approved',
  'final_rejected'
);

-- How a chain resolves (can be combined with sequential steps)
CREATE TYPE chain_condition AS ENUM (
  'sequential',         -- all steps must approve in order
  'percentage',         -- X% of approvers approve → auto-approve
  'specific_approver',  -- one particular person approves → auto-approve
  'hybrid'              -- percentage OR specific_approver, whichever first
);

-- ============================================================
--  TABLE: companies
--  One row per company that signs up.
--  The Admin user is created in the same transaction as signup.
-- ============================================================
CREATE TABLE companies (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         VARCHAR(255) NOT NULL,        -- company name (from signup form)
  country      VARCHAR(100) NOT NULL,
  currency     VARCHAR(10)  NOT NULL,        -- ISO 4217: 'INR', 'USD', 'EUR' …
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
--  TABLE: users
--  All three roles live here. Role is hardcoded to 'admin' on
--  signup; only admin can create 'manager' or 'employee' users.
-- ============================================================
CREATE TABLE users (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id           UUID         NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name                 VARCHAR(255) NOT NULL,
  email                VARCHAR(255) NOT NULL UNIQUE,  -- globally unique
  password_hash        VARCHAR(255) NOT NULL,
  role                 user_role    NOT NULL,

  -- For employees: which manager they report to (nullable for admin/manager)
  manager_id           UUID REFERENCES users(id) ON DELETE SET NULL,

  -- If TRUE and role = 'employee':
  --   expense flow → direct manager FIRST → then approval chain steps
  -- If FALSE:
  --   expense flow → straight into approval chain step 1
  is_manager_approver  BOOLEAN      NOT NULL DEFAULT FALSE,

  created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  -- Employees can only have a manager_id if they are employees
  CONSTRAINT only_employees_have_manager CHECK (
    role = 'employee' OR manager_id IS NULL
  ),
  -- Only employees use the is_manager_approver flag
  CONSTRAINT only_employees_have_flag CHECK (
    role = 'employee' OR is_manager_approver = FALSE
  )
);

-- ============================================================
--  TABLE: approval_chains
--  Admin configures one or more chains per company.
--  Only ONE chain should be active at a time (enforced in app).
--
--  condition_type drives how the chain resolves:
--    sequential         → all steps in order, all must approve
--    percentage         → X % of approvers approve → auto-approved
--    specific_approver  → if auto_approver_id approves → auto-approved
--    hybrid             → percentage OR specific_approver, first wins
-- ============================================================
CREATE TABLE approval_chains (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id           UUID          NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name                 VARCHAR(255)  NOT NULL,
  condition_type       chain_condition NOT NULL DEFAULT 'sequential',

  -- Used when condition_type IN ('percentage', 'hybrid')
  percentage_threshold INTEGER CHECK (percentage_threshold BETWEEN 1 AND 100),

  -- Used when condition_type IN ('specific_approver', 'hybrid')
  auto_approver_id     UUID REFERENCES users(id) ON DELETE SET NULL,

  is_active            BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
--  TABLE: approval_steps
--  Ordered steps within a chain.
--  step_order 1 → first approver, 2 → second, etc.
--  These are regular users with role='manager'.
-- ============================================================
CREATE TABLE approval_steps (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chain_id     UUID         NOT NULL REFERENCES approval_chains(id) ON DELETE CASCADE,
  step_order   INTEGER      NOT NULL,  -- 1-based
  approver_id  UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  step_label   VARCHAR(100),           -- optional display label e.g. "Finance Dept"

  UNIQUE (chain_id, step_order)        -- no duplicate positions in a chain
);

-- ============================================================
--  TABLE: expenses
--  Core fact table. One row per expense submission.
--
--  Approval flow state machine:
--    draft   → employee saved but not submitted
--    pending → submitted; waiting for approval actions
--    approved / rejected → terminal states
--
--  current_approver_id  → who must act right now
--  current_step_index   → which step in the chain we are at
--                         (0 = at manager pre-approval stage,
--                          1+ = at chain step N)
--  is_at_manager_stage  → TRUE while waiting for the direct
--                          manager to pre-approve (is_manager_approver=TRUE)
-- ============================================================
CREATE TABLE expenses (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id           UUID           NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id          UUID           NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Amount as submitted (in original currency)
  amount               NUMERIC(12,2)  NOT NULL CHECK (amount > 0),
  currency             VARCHAR(10)    NOT NULL,  -- currency the employee spent in

  category             VARCHAR(100)   NOT NULL,  -- Travel | Food | Accommodation | Equipment | Other
  description          TEXT           NOT NULL,
  expense_date         DATE           NOT NULL,  -- when the expense was incurred
  receipt_url          TEXT,                     -- optional, uploaded file URL

  -- Status & Workflow state
  status               expense_status NOT NULL DEFAULT 'draft',
  chain_id             UUID           REFERENCES approval_chains(id) ON DELETE SET NULL,
  current_approver_id  UUID           REFERENCES users(id) ON DELETE SET NULL,
  current_step_index   INTEGER        NOT NULL DEFAULT 0,
  is_at_manager_stage  BOOLEAN        NOT NULL DEFAULT FALSE,

  -- OCR-extracted fields (filled after receipt upload)
  ocr_merchant        VARCHAR(255),
  ocr_amount          NUMERIC(12,2),
  ocr_date            DATE,
  ocr_raw             JSONB,           -- full raw OCR response for debugging

  created_at           TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- ============================================================
--  TABLE: expense_approval_log
--  Append-only audit trail. Every action on every expense is
--  recorded here — drives the "Approval History" timeline UI.
-- ============================================================
CREATE TABLE expense_approval_log (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id   UUID           NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  actor_id     UUID           NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  action       approval_action NOT NULL,

  -- Snapshot of which step this action was taken at
  step_index   INTEGER,
  step_label   VARCHAR(100),

  comment      TEXT,           -- optional comment from manager on approve/reject

  created_at   TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- ============================================================
--  INDEXES
--  All FK columns + common filter/sort columns
-- ============================================================

-- users
CREATE INDEX idx_users_company    ON users(company_id);
CREATE INDEX idx_users_email      ON users(email);
CREATE INDEX idx_users_manager    ON users(manager_id);
CREATE INDEX idx_users_role       ON users(company_id, role);

-- approval_chains
CREATE INDEX idx_chains_company   ON approval_chains(company_id);
CREATE INDEX idx_chains_active    ON approval_chains(company_id, is_active);

-- approval_steps
CREATE INDEX idx_steps_chain      ON approval_steps(chain_id, step_order);
CREATE INDEX idx_steps_approver   ON approval_steps(approver_id);

-- expenses
CREATE INDEX idx_expenses_company    ON expenses(company_id);
CREATE INDEX idx_expenses_employee   ON expenses(employee_id);
CREATE INDEX idx_expenses_approver   ON expenses(current_approver_id);
CREATE INDEX idx_expenses_status     ON expenses(company_id, status);
CREATE INDEX idx_expenses_date       ON expenses(company_id, expense_date DESC);

-- expense_approval_log
CREATE INDEX idx_log_expense     ON expense_approval_log(expense_id);
CREATE INDEX idx_log_actor       ON expense_approval_log(actor_id);
CREATE INDEX idx_log_created     ON expense_approval_log(expense_id, created_at);

-- ============================================================
--  TRIGGER: auto-update updated_at on users + expenses
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
--  VIEWS (convenience — optional, use or skip)
-- ============================================================

-- Pending expenses for a given approver (used by manager queue)
CREATE OR REPLACE VIEW v_pending_for_approver AS
SELECT
  e.*,
  u.name          AS employee_name,
  u.email         AS employee_email,
  c.currency      AS company_currency,
  c.name          AS company_name
FROM expenses e
JOIN users   u ON u.id = e.employee_id
JOIN companies c ON c.id = e.company_id
WHERE e.status = 'pending';

-- Full expense detail with employee + company info
CREATE OR REPLACE VIEW v_expense_detail AS
SELECT
  e.*,
  u.name          AS employee_name,
  u.email         AS employee_email,
  c.currency      AS company_currency,
  c.name          AS company_name,
  c.country       AS company_country
FROM expenses   e
JOIN users      u ON u.id = e.employee_id
JOIN companies  c ON c.id = e.company_id;
