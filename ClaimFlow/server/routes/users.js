/**
 * server/routes/users.js
 * Admin-only: create, list, update users within a company
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/users — list all users in the same company
router.get('/', requireRole('admin'), async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT u.id, u.name, u.email, u.role, u.manager_id, u.is_manager_approver, u.created_at,
              m.name as manager_name
       FROM users u
       LEFT JOIN users m ON m.id = u.manager_id
       WHERE u.company_id = $1
       ORDER BY u.created_at ASC`,
      [req.user.companyId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/users/managers — list all managers in company (for employee assignment dropdown)
router.get('/managers', requireRole('admin'), async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, name, email FROM users WHERE company_id = $1 AND role = 'manager' ORDER BY name`,
      [req.user.companyId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch managers' });
  }
});

// POST /api/users — admin creates employee or manager
router.post('/', requireRole('admin'), async (req, res) => {
  const { name, email, password, role, managerId, isManagerApprover } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'name, email, password, role are required' });
  }
  if (role === 'admin') {
    return res.status(400).json({ error: 'Cannot create admin users via this endpoint' });
  }

  try {
    const exists = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (exists.rows.length > 0) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    const { rows } = await db.query(
      `INSERT INTO users (id, company_id, name, email, password_hash, role, manager_id, is_manager_approver)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, name, email, role, manager_id, is_manager_approver, created_at`,
      [
        userId,
        req.user.companyId,
        name,
        email,
        passwordHash,
        role,
        managerId || null,
        isManagerApprover || false,
      ]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// PATCH /api/users/:id — admin updates role, manager, isManagerApprover
router.patch('/:id', requireRole('admin'), async (req, res) => {
  const { role, managerId, isManagerApprover } = req.body;
  try {
    const { rows } = await db.query(
      `UPDATE users
       SET role = COALESCE($1, role),
           manager_id = COALESCE($2, manager_id),
           is_manager_approver = COALESCE($3, is_manager_approver),
           updated_at = NOW()
       WHERE id = $4 AND company_id = $5
       RETURNING id, name, email, role, manager_id, is_manager_approver`,
      [role, managerId, isManagerApprover, req.params.id, req.user.companyId]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// GET /api/users/me — current logged-in user info
router.get('/me', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT u.id, u.name, u.email, u.role, u.manager_id, u.is_manager_approver,
              c.name as company_name, c.currency as company_currency, c.country
       FROM users u JOIN companies c ON c.id = u.company_id
       WHERE u.id = $1`,
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

module.exports = router;
