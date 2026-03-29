const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const { getDb } = require('../../db');
const { sendUserCredentials } = require('../../utils/mailer');

function generatePassword(length = 10) {
  return crypto.randomBytes(16)
    .toString("base64")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, length);
}

const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['manager', 'employee']),
  manager_id: z.string().optional()
});

async function createUser(req, res) {
  try {
    const data = userSchema.parse(req.body);
    const db = await getDb();
    const companyId = req.user.companyId;

    const existingUser = await db.get(`SELECT id FROM users WHERE email = ?`, [data.email]);
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const tempPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    const result = await db.run(
      `INSERT INTO users (company_id, name, email, password, role, manager_id) VALUES (?, ?, ?, ?, ?, ?)`,
      [companyId, data.name, data.email, hashedPassword, data.role, data.manager_id || null]
    );

    const userId = result.lastID;

    await db.run(
      `INSERT INTO audit_logs (company_id, user_id, action) VALUES (?, ?, ?)`,
      [companyId, userId, 'USER_CREATED']
    );

    const newUser = await db.get(`SELECT id, company_id, name, email, role, manager_id FROM users WHERE id = ?`, [userId]);

    // Send the email without throwing away the user process on error
    await sendUserCredentials(newUser.email, tempPassword);

    res.status(201).json({
      user: newUser,
      message: "User created and credentials sent via email"
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function listUsers(req, res) {
  try {
    const db = await getDb();
    const companyId = req.user.companyId;
    const users = await db.all(`
      SELECT u.id, u.name, u.email, u.role, u.manager_id, m.name as manager_name 
      FROM users u
      LEFT JOIN users m ON u.manager_id = m.id
      WHERE u.company_id = ?
      ORDER BY u.id DESC
    `, [companyId]);
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function updateUser(req, res) {
  try {
    const db = await getDb();
    const { id } = req.params;
    const { role, manager_id } = req.body;
    const companyId = req.user.companyId;

    // Ensure user belongs to same company and isn't admin
    const userToUpdate = await db.get(`SELECT * FROM users WHERE id = ? AND company_id = ?`, [id, companyId]);
    if (!userToUpdate) return res.status(404).json({ message: 'User not found' });
    if (userToUpdate.role === 'admin') return res.status(403).json({ message: 'Cannot modify admin' });

    const newRole = role !== undefined ? role : userToUpdate.role;
    const newManager = manager_id !== undefined ? manager_id : userToUpdate.manager_id;

    await db.run(
      `UPDATE users SET role = ?, manager_id = ? WHERE id = ?`,
      [newRole, newManager, id]
    );

    res.json({ message: 'User updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Internal error' });
  }
}

async function sendPassword(req, res) {
  try {
    const db = await getDb();
    const { id } = req.params;
    const companyId = req.user.companyId;

    const user = await db.get(`SELECT * FROM users WHERE id = ? AND company_id = ?`, [id, companyId]);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const plainPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(plainPassword, 12);

    await db.run(
      `UPDATE users SET password = ? WHERE id = ?`,
      [hashedPassword, id]
    );

    await sendUserCredentials(user.email, plainPassword);

    res.json({ message: 'Password sent successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { createUser, listUsers, updateUser, sendPassword };
