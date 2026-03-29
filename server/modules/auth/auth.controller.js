const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const { getDb } = require('../../db');
const { JWT_SECRET } = require('../../middleware/auth.middleware');

const registerSchema = z.object({
  companyName: z.string().min(1),
  country: z.string().min(1),
  adminName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const getCurrencyByCountry = (country) => {
  const map = {
    'US': 'USD',
    'GB': 'GBP',
    'IN': 'INR',
    'EU': 'EUR'
  };
  return map[country] || 'USD';
};

async function registerCompany(req, res) {
  try {
    const data = registerSchema.parse(req.body);
    const db = await getDb();
    
    // Check if email already exists
    const existingUser = await db.get(`SELECT id FROM users WHERE email = ?`, [data.email]);
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const currency = getCurrencyByCountry(data.country);

    // Using transaction
    await db.exec('BEGIN TRANSACTION');
    try {
      const companyResult = await db.run(
        `INSERT INTO companies (name, country, currency) VALUES (?, ?, ?)`,
        [data.companyName, data.country, currency]
      );
      const companyId = companyResult.lastID;

      const hashedPassword = await bcrypt.hash(data.password, 12);

      const userResult = await db.run(
        `INSERT INTO users (company_id, name, email, password, role) VALUES (?, ?, ?, ?, ?)`,
        [companyId, data.adminName, data.email, hashedPassword, 'admin']
      );
      const userId = userResult.lastID;

      await db.run(
        `INSERT INTO audit_logs (company_id, user_id, action) VALUES (?, ?, ?)`,
        [companyId, userId, 'COMPANY_CREATED']
      );

      await db.run(
        `INSERT INTO audit_logs (company_id, user_id, action) VALUES (?, ?, ?)`,
        [companyId, userId, 'ADMIN_CREATED']
      );

      await db.exec('COMMIT');

      // Tokens
      const accessToken = jwt.sign({ userId, role: 'admin', companyId }, JWT_SECRET, { expiresIn: '7d' });
      const refreshToken = jwt.sign({ userId }, JWT_SECRET + '_refresh', { expiresIn: '7d' });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: 'lax'
      });

      res.status(201).json({
        user: { id: userId, name: data.adminName, email: data.email, role: 'admin', companyId },
        accessToken
      });

    } catch (err) {
      await db.exec('ROLLBACK');
      throw err;
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function login(req, res) {
  try {
    const data = loginSchema.parse(req.body);
    const db = await getDb();

    const user = await db.get(`SELECT * FROM users WHERE email = ?`, [data.email]);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(data.password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const accessToken = jwt.sign({ userId: user.id, role: user.role, companyId: user.company_id }, JWT_SECRET, { expiresIn: '7d' });
    const refreshToken = jwt.sign({ userId: user.id }, JWT_SECRET + '_refresh', { expiresIn: '7d' });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax'
    });

    const { password: _, ...userWithoutPass } = user;
    res.json({
      user: userWithoutPass,
      accessToken
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function refresh(req, res) {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.status(401).json({ message: 'Refresh token not found' });
  
  try {
    const payload = jwt.verify(refreshToken, JWT_SECRET + '_refresh');
    const db = await getDb();
    const user = await db.get(`SELECT * FROM users WHERE id = ?`, [payload.userId]);
    if (!user) return res.status(401).json({ message: 'User not found' });
    
    const accessToken = jwt.sign({ userId: user.id, role: user.role, companyId: user.company_id }, JWT_SECRET, { expiresIn: '15m' });
    res.json({ accessToken });
  } catch (error) {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
}

module.exports = { registerCompany, login, refresh };
