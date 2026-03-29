/**
 * server/services/approvalEngine.js
 * ─────────────────────────────────────────────────────────────────────
 * Called whenever an expense is submitted OR an approver acts on it.
 *
 * FLOW:
 * On submit:
 *   if employee.is_manager_approver → route to direct manager first
 *   else → go to chain step 1
 *
 * On approve:
 *   if is_at_manager_stage → move to chain step 1
 *   else if sequential → move to next step (or final approve)
 *   if conditional rule fires → auto-approve entire expense
 *
 * On reject (at any stage) → expense.status = 'rejected', chain stops
 */
const { v4: uuidv4 } = require('uuid');
const db = require('../db');

// ── Check if a conditional rule fires after approverId acts ──────────
async function checkConditionalRule(chain, expenseId, approvedCount, totalSteps) {
  // percentage rule
  if (chain.condition_type === 'percentage' || chain.condition_type === 'hybrid') {
    const pct = chain.percentage_threshold;
    if (pct && totalSteps > 0 && (approvedCount / totalSteps) * 100 >= pct) {
      return true;
    }
  }

  // specific approver rule — check if the auto_approver is in the log already
  if (chain.condition_type === 'specific_approver' || chain.condition_type === 'hybrid') {
    if (chain.auto_approver_id) {
      const { rows } = await db.query(
        `SELECT id FROM expense_approval_log
         WHERE expense_id = $1 AND actor_id = $2 AND action = 'step_approved'`,
        [expenseId, chain.auto_approver_id]
      );
      if (rows.length > 0) return true;
    }
  }

  return false;
}

// ── Route expense after submission ───────────────────────────────────
async function routeOnSubmit(expenseId, employeeId, companyId) {
  // Get employee info
  const { rows: empRows } = await db.query(
    'SELECT manager_id, is_manager_approver FROM users WHERE id = $1',
    [employeeId]
  );
  const employee = empRows[0];

  // Get active chain for this company
  const { rows: chainRows } = await db.query(
    'SELECT * FROM approval_chains WHERE company_id = $1 AND is_active = TRUE LIMIT 1',
    [companyId]
  );
  const chain = chainRows[0] || null;
  const chainId = chain?.id || null;

  if (employee.is_manager_approver && employee.manager_id) {
    // Route to direct manager FIRST
    await db.query(
      `UPDATE expenses
       SET status = 'pending', chain_id = $1, current_approver_id = $2,
           current_step_index = 0, is_at_manager_stage = TRUE, updated_at = NOW()
       WHERE id = $3`,
      [chainId, employee.manager_id, expenseId]
    );

    await db.query(
      `INSERT INTO expense_approval_log (id, expense_id, actor_id, action, step_label, step_index)
       VALUES ($1, $2, $3, 'submitted', 'Manager Pre-Approval', 0)`,
      [uuidv4(), expenseId, employeeId]
    );
  } else if (chain) {
    // Skip manager, go straight to step 1 of chain
    const { rows: steps } = await db.query(
      'SELECT * FROM approval_steps WHERE chain_id = $1 ORDER BY step_order ASC LIMIT 1',
      [chainId]
    );

    if (steps.length === 0) {
      // No steps configured — auto approve
      await db.query(
        `UPDATE expenses SET status = 'approved', updated_at = NOW() WHERE id = $1`,
        [expenseId]
      );
    } else {
      const firstStep = steps[0];
      await db.query(
        `UPDATE expenses
         SET status = 'pending', chain_id = $1, current_approver_id = $2,
             current_step_index = 1, is_at_manager_stage = FALSE, updated_at = NOW()
         WHERE id = $3`,
        [chainId, firstStep.approver_id, expenseId]
      );
    }

    await db.query(
      `INSERT INTO expense_approval_log (id, expense_id, actor_id, action, step_label, step_index)
       VALUES ($1, $2, $3, 'submitted', 'Submitted', 0)`,
      [uuidv4(), expenseId, employeeId]
    );
  } else {
    // No chain exists — just mark pending with no approver (admin can handle)
    await db.query(
      `UPDATE expenses SET status = 'pending', updated_at = NOW() WHERE id = $1`,
      [expenseId]
    );
    await db.query(
      `INSERT INTO expense_approval_log (id, expense_id, actor_id, action, step_label, step_index)
       VALUES ($1, $2, $3, 'submitted', 'Submitted', 0)`,
      [uuidv4(), expenseId, employeeId]
    );
  }
}

// ── Process approve action ───────────────────────────────────────────
async function processApprove(expenseId, actorId, comment) {
  const { rows: expRows } = await db.query('SELECT * FROM expenses WHERE id = $1', [expenseId]);
  const expense = expRows[0];
  if (!expense) throw new Error('Expense not found');

  const stepLabel = expense.is_at_manager_stage
    ? 'Manager Pre-Approval'
    : `Step ${expense.current_step_index}`;

  // Log this approval
  await db.query(
    `INSERT INTO expense_approval_log (id, expense_id, actor_id, action, step_label, step_index, comment)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      uuidv4(),
      expenseId,
      actorId,
      expense.is_at_manager_stage ? 'manager_approved' : 'step_approved',
      stepLabel,
      expense.current_step_index,
      comment || null,
    ]
  );

  if (expense.is_at_manager_stage) {
    // Manager pre-approved → go to chain step 1
    if (!expense.chain_id) {
      // No chain, final approve
      await db.query(
        `UPDATE expenses SET status = 'approved', is_at_manager_stage = FALSE, current_approver_id = NULL, updated_at = NOW() WHERE id = $1`,
        [expenseId]
      );
      await _logFinal(expenseId, actorId, 'final_approved', 'Final Approval');
      return;
    }

    const { rows: steps } = await db.query(
      'SELECT * FROM approval_steps WHERE chain_id = $1 ORDER BY step_order ASC LIMIT 1',
      [expense.chain_id]
    );

    if (steps.length === 0) {
      await db.query(
        `UPDATE expenses SET status = 'approved', is_at_manager_stage = FALSE, current_approver_id = NULL, updated_at = NOW() WHERE id = $1`,
        [expenseId]
      );
      await _logFinal(expenseId, actorId, 'final_approved', 'Final Approval');
    } else {
      const firstStep = steps[0];
      await db.query(
        `UPDATE expenses
         SET is_at_manager_stage = FALSE, current_approver_id = $1, current_step_index = 1, updated_at = NOW()
         WHERE id = $2`,
        [firstStep.approver_id, expenseId]
      );
    }
  } else {
    // Sequential chain step approved
    const chainId = expense.chain_id;
    const currentStep = expense.current_step_index;

    // Count total approvals so far for conditional checks
    const { rows: logRows } = await db.query(
      `SELECT COUNT(*) as cnt FROM expense_approval_log WHERE expense_id = $1 AND action = 'step_approved'`,
      [expenseId]
    );
    const approvedCount = parseInt(logRows[0].cnt);

    // Get chain + total steps
    const { rows: chainRows } = await db.query('SELECT * FROM approval_chains WHERE id = $1', [chainId]);
    const chain = chainRows[0];
    const { rows: allSteps } = await db.query(
      'SELECT COUNT(*) as total FROM approval_steps WHERE chain_id = $1',
      [chainId]
    );
    const totalSteps = parseInt(allSteps[0].total);

    // Check conditional rule
    const autoApprove = await checkConditionalRule(chain, expenseId, approvedCount, totalSteps);
    if (autoApprove) {
      await db.query(
        `UPDATE expenses SET status = 'approved', current_approver_id = NULL, updated_at = NOW() WHERE id = $1`,
        [expenseId]
      );
      await _logFinal(expenseId, actorId, 'auto_approved', 'Auto-Approved');
      return;
    }

    // Try to advance to next step
    const { rows: nextSteps } = await db.query(
      'SELECT * FROM approval_steps WHERE chain_id = $1 AND step_order = $2',
      [chainId, currentStep + 1]
    );

    if (nextSteps.length === 0) {
      // No more steps — final approval
      await db.query(
        `UPDATE expenses SET status = 'approved', current_approver_id = NULL, updated_at = NOW() WHERE id = $1`,
        [expenseId]
      );
      await _logFinal(expenseId, actorId, 'final_approved', 'Final Approval');
    } else {
      const nextStep = nextSteps[0];
      await db.query(
        `UPDATE expenses SET current_approver_id = $1, current_step_index = $2, updated_at = NOW() WHERE id = $3`,
        [nextStep.approver_id, currentStep + 1, expenseId]
      );
    }
  }
}

// ── Process reject action ────────────────────────────────────────────
async function processReject(expenseId, actorId, comment) {
  const { rows: expRows } = await db.query('SELECT * FROM expenses WHERE id = $1', [expenseId]);
  const expense = expRows[0];
  if (!expense) throw new Error('Expense not found');

  const stepLabel = expense.is_at_manager_stage ? 'Manager Pre-Approval' : `Step ${expense.current_step_index}`;
  const action = expense.is_at_manager_stage ? 'manager_rejected' : 'step_rejected';

  await db.query(
    `INSERT INTO expense_approval_log (id, expense_id, actor_id, action, step_label, step_index, comment)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [uuidv4(), expenseId, actorId, action, stepLabel, expense.current_step_index, comment || null]
  );

  await db.query(
    `UPDATE expenses
     SET status = 'rejected', current_approver_id = NULL, is_at_manager_stage = FALSE, updated_at = NOW()
     WHERE id = $1`,
    [expenseId]
  );

  await _logFinal(expenseId, actorId, 'final_rejected', stepLabel);
}

async function _logFinal(expenseId, actorId, action, stepLabel) {
  await db.query(
    `INSERT INTO expense_approval_log (id, expense_id, actor_id, action, step_label)
     VALUES ($1, $2, $3, $4, $5)`,
    [uuidv4(), expenseId, actorId, action, stepLabel]
  );
}

module.exports = { routeOnSubmit, processApprove, processReject };
