/**
 * server/routes/rules.js
 * Admin manages approval chains and steps
 */
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate, requireRole('admin'));

// GET /api/rules — list all chains with their steps
router.get('/', async (req, res) => {
  try {
    const chains = await db.query(
      `SELECT ac.*, u.name as auto_approver_name
       FROM approval_chains ac
       LEFT JOIN users u ON u.id = ac.auto_approver_id
       WHERE ac.company_id = $1
       ORDER BY ac.created_at ASC`,
      [req.user.companyId]
    );

    // Attach steps to each chain
    const result = await Promise.all(
      chains.rows.map(async (chain) => {
        const steps = await db.query(
          `SELECT s.*, u.name as approver_name, u.email as approver_email
           FROM approval_steps s
           JOIN users u ON u.id = s.approver_id
           WHERE s.chain_id = $1
           ORDER BY s.step_order ASC`,
          [chain.id]
        );
        return { ...chain, steps: steps.rows };
      })
    );

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch rules' });
  }
});

// POST /api/rules — create new chain with steps
router.post('/', async (req, res) => {
  const { name, conditionType, percentageThreshold, autoApproverId, steps } = req.body;

  if (!name || !conditionType) {
    return res.status(400).json({ error: 'name and conditionType are required' });
  }

  try {
    await db.query('BEGIN');

    const chainId = uuidv4();
    const { rows } = await db.query(
      `INSERT INTO approval_chains (id, company_id, name, condition_type, percentage_threshold, auto_approver_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [chainId, req.user.companyId, name, conditionType, percentageThreshold || null, autoApproverId || null]
    );

    const chain = rows[0];

    // Insert steps
    if (Array.isArray(steps) && steps.length > 0) {
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        await db.query(
          `INSERT INTO approval_steps (id, chain_id, step_order, approver_id, step_label)
           VALUES ($1, $2, $3, $4, $5)`,
          [uuidv4(), chainId, i + 1, step.approverId, step.stepLabel || null]
        );
      }
    }

    await db.query('COMMIT');
    res.status(201).json({ ...chain, steps: steps || [] });
  } catch (err) {
    await db.query('ROLLBACK').catch(() => {});
    console.error(err);
    res.status(500).json({ error: 'Failed to create rule' });
  }
});

// PATCH /api/rules/:id — update chain (replaces steps entirely)
router.patch('/:id', async (req, res) => {
  const { name, conditionType, percentageThreshold, autoApproverId, isActive, steps } = req.body;

  try {
    await db.query('BEGIN');

    const { rows } = await db.query(
      `UPDATE approval_chains
       SET name = COALESCE($1, name),
           condition_type = COALESCE($2, condition_type),
           percentage_threshold = COALESCE($3, percentage_threshold),
           auto_approver_id = COALESCE($4, auto_approver_id),
           is_active = COALESCE($5, is_active)
       WHERE id = $6 AND company_id = $7
       RETURNING *`,
      [name, conditionType, percentageThreshold, autoApproverId, isActive, req.params.id, req.user.companyId]
    );

    if (!rows.length) {
      await db.query('ROLLBACK');
      return res.status(404).json({ error: 'Chain not found' });
    }

    // Replace steps if provided
    if (Array.isArray(steps)) {
      await db.query('DELETE FROM approval_steps WHERE chain_id = $1', [req.params.id]);
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        await db.query(
          `INSERT INTO approval_steps (id, chain_id, step_order, approver_id, step_label)
           VALUES ($1, $2, $3, $4, $5)`,
          [uuidv4(), req.params.id, i + 1, step.approverId, step.stepLabel || null]
        );
      }
    }

    await db.query('COMMIT');
    res.json(rows[0]);
  } catch (err) {
    await db.query('ROLLBACK').catch(() => {});
    console.error(err);
    res.status(500).json({ error: 'Failed to update rule' });
  }
});

// DELETE /api/rules/:id
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM approval_chains WHERE id = $1 AND company_id = $2', [
      req.params.id,
      req.user.companyId,
    ]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete rule' });
  }
});

module.exports = router;
