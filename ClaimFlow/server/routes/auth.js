/**
 * server/routes/auth.js
 * POST /api/auth/signup  — create company + admin user
 * POST /api/auth/login   — return JWT
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// ── Signup ──────────────────────────────────────────────────────────
// Creates company + admin user in one transaction
router.post('/signup', async (req, res) => {
  const { companyName, email, password, country, currency } = req.body;

  if (!companyName || !email || !password || !country || !currency) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // Check email uniqueness
    const exists = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (exists.rows.length > 0) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const companyId = uuidv4();
    const userId = uuidv4();

    // Wrap in transaction
    await db.query('BEGIN');

    await db.query(
      `INSERT INTO companies (id, name, country, currency) VALUES ($1, $2, $3, $4)`,
      [companyId, companyName, country, currency]
    );

    await db.query(
      `INSERT INTO users (id, company_id, name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, $5, 'admin')`,
      [userId, companyId, companyName, email, passwordHash]
    );

    await db.query('COMMIT');

    const token = jwt.sign(
      { id: userId, email, role: 'admin', companyId, name: companyName },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.status(201).json({
      token,
      user: { id: userId, name: companyName, email, role: 'admin', companyId },
      company: { id: companyId, name: companyName, country, currency },
    });
  } catch (err) {
    await db.query('ROLLBACK').catch(() => {});
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Signup failed' });
  }
});

// ── Login ────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const result = await db.query(
      `SELECT u.*, c.name as company_name, c.currency as company_currency
       FROM users u
       JOIN companies c ON c.id = u.company_id
       WHERE u.email = $1`,
      [email]
    );

    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, companyId: user.company_id, name: user.name },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.company_id,
        companyName: user.company_name,
        companyCurrency: user.company_currency,
        managerId: user.manager_id,
        isManagerApprover: user.is_manager_approver,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;
