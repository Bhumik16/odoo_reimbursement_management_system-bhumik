/**
 * server/routes/expenses.js
 * Employee submits expenses, managers approve/reject
 */
const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');
const { routeOnSubmit, processApprove, processReject } = require('../services/approvalEngine');

const router = express.Router();
router.use(authenticate);

// Multer config for receipt upload (memory store — swap for S3/Cloudinary on prod)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (_, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only image or PDF receipts allowed'));
  },
});

// ── GET /api/expenses ─────────────────────────────────────────────────
// Admin: all company expenses | Employee: own | Manager: own queue
router.get('/', async (req, res) => {
  try {
    let query, params;
    const { role, companyId, id } = req.user;
    const { status, category, startDate, endDate } = req.query;

    const filters = [];
    const vals = [companyId];

    if (role === 'admin') {
      query = `SELECT e.*, u.name as employee_name FROM expenses e
               JOIN users u ON u.id = e.employee_id
               WHERE e.company_id = $1`;
    } else if (role === 'manager') {
      query = `SELECT e.*, u.name as employee_name FROM expenses e
               JOIN users u ON u.id = e.employee_id
               WHERE e.company_id = $1 AND e.current_approver_id = $2`;
      vals.push(id);
    } else {
      query = `SELECT e.*, u.name as employee_name FROM expenses e
               JOIN users u ON u.id = e.employee_id
               WHERE e.company_id = $1 AND e.employee_id = $2`;
      vals.push(id);
    }

    // Dynamic filters
    if (status) {
      vals.push(status);
      filters.push(`e.status = $${vals.length}`);
    }
    if (category) {
      vals.push(category);
      filters.push(`e.category = $${vals.length}`);
    }
    if (startDate) {
      vals.push(startDate);
      filters.push(`e.expense_date >= $${vals.length}`);
    }
    if (endDate) {
      vals.push(endDate);
      filters.push(`e.expense_date <= $${vals.length}`);
    }

    if (filters.length) query += ` AND ${filters.join(' AND ')}`;
    query += ` ORDER BY e.created_at DESC`;

    const { rows } = await db.query(query, vals);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// ── GET /api/expenses/:id — full detail with approval history ─────────
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT e.*, u.name as employee_name, u.email as employee_email,
              c.currency as company_currency, c.name as company_name
       FROM expenses e
       JOIN users u ON u.id = e.employee_id
       JOIN companies c ON c.id = e.company_id
       WHERE e.id = $1 AND e.company_id = $2`,
      [req.params.id, req.user.companyId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Expense not found' });

    // Approval log / history
    const { rows: logs } = await db.query(
      `SELECT l.*, u.name as actor_name, u.role as actor_role
       FROM expense_approval_log l
       JOIN users u ON u.id = l.actor_id
       WHERE l.expense_id = $1
       ORDER BY l.created_at ASC`,
      [req.params.id]
    );

    // Chain + steps for UI step tracker
    let chainSteps = [];
    if (rows[0].chain_id) {
      const { rows: steps } = await db.query(
        `SELECT s.*, u.name as approver_name FROM approval_steps s
         JOIN users u ON u.id = s.approver_id
         WHERE s.chain_id = $1 ORDER BY s.step_order ASC`,
        [rows[0].chain_id]
      );
      chainSteps = steps;
    }

    res.json({ ...rows[0], approvalLog: logs, chainSteps });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch expense' });
  }
});

// ── POST /api/expenses — employee submits expense ─────────────────────
router.post('/', requireRole('employee'), async (req, res) => {
  const { amount, currency, category, description, date, receiptUrl } = req.body;

  if (!amount || !currency || !category || !description || !date) {
    return res.status(400).json({ error: 'amount, currency, category, description, date are required' });
  }

  try {
    const expenseId = uuidv4();
    const { rows } = await db.query(
      `INSERT INTO expenses (id, company_id, employee_id, amount, currency, category, description, expense_date, receipt_url, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'draft')
       RETURNING *`,
      [expenseId, req.user.companyId, req.user.id, amount, currency, category, description, date, receiptUrl || null]
    );

    let expense = rows[0];

    // If action=submit, route immediately; otherwise stays as draft
    if (req.body.submit === true || req.body.submit === 'true') {
      await routeOnSubmit(expenseId, req.user.id, req.user.companyId);
      const { rows: updated } = await db.query('SELECT * FROM expenses WHERE id = $1', [expenseId]);
      expense = updated[0];
    }

    res.status(201).json(expense);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// ── PATCH /api/expenses/:id/submit — submit a draft expense ──────────
router.patch('/:id/submit', requireRole('employee'), async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM expenses WHERE id = $1 AND employee_id = $2 AND status = 'draft'`,
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Draft expense not found' });

    await routeOnSubmit(req.params.id, req.user.id, req.user.companyId);
    const { rows: updated } = await db.query('SELECT * FROM expenses WHERE id = $1', [req.params.id]);
    res.json(updated[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit expense' });
  }
});

// ── POST /api/expenses/:id/approve ────────────────────────────────────
router.post('/:id/approve', requireRole('manager', 'admin'), async (req, res) => {
  const { comment } = req.body;
  try {
    // Verify this approver is the current_approver
    const { rows } = await db.query(
      `SELECT * FROM expenses WHERE id = $1 AND current_approver_id = $2 AND status = 'pending'`,
      [req.params.id, req.user.id]
    );
    if (!rows.length) {
      return res.status(403).json({ error: 'Not authorized to approve this expense or it is not pending' });
    }

    await processApprove(req.params.id, req.user.id, comment);
    const { rows: updated } = await db.query('SELECT * FROM expenses WHERE id = $1', [req.params.id]);
    res.json(updated[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to approve expense' });
  }
});

// ── POST /api/expenses/:id/reject ─────────────────────────────────────
router.post('/:id/reject', requireRole('manager', 'admin'), async (req, res) => {
  const { comment } = req.body;
  try {
    const { rows } = await db.query(
      `SELECT * FROM expenses WHERE id = $1 AND current_approver_id = $2 AND status = 'pending'`,
      [req.params.id, req.user.id]
    );
    if (!rows.length) {
      return res.status(403).json({ error: 'Not authorized to reject this expense or it is not pending' });
    }

    await processReject(req.params.id, req.user.id, comment);
    const { rows: updated } = await db.query('SELECT * FROM expenses WHERE id = $1', [req.params.id]);
    res.json(updated[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to reject expense' });
  }
});

// ── POST /api/expenses/ocr — receipt OCR (mock for now) ──────────────
router.post('/ocr', requireRole('employee'), upload.single('receipt'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    // TODO: Replace with actual OCR API call (forward to FastAPI)
    // For now returns mock auto-fill data
    res.json({
      merchant: 'Auto-detected Merchant',
      amount: null,
      date: null,
      description: null,
      category: null,
      receiptUrl: null, // URL after upload to storage
    });
  } catch (err) {
    res.status(500).json({ error: 'OCR failed' });
  }
});

// ── GET /api/expenses/stats/summary — dashboard stats ────────────────
router.get('/stats/summary', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT
         COUNT(*) filter (WHERE status = 'pending') as pending,
         COUNT(*) filter (WHERE status = 'approved') as approved,
         COUNT(*) filter (WHERE status = 'rejected') as rejected,
         COUNT(*) filter (WHERE status = 'draft') as draft,
         COALESCE(SUM(amount) filter (WHERE status = 'approved'), 0) as total_approved_amount
       FROM expenses
       WHERE company_id = $1`,
      [req.user.companyId]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;
