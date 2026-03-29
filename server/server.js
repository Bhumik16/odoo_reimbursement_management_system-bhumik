const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes Placeholder
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Admin Routes
app.get('/api/admin/users', (req, res) => {
  res.json({ message: 'List of users' });
});

app.get('/api/admin/rules', (req, res) => {
  res.json({ message: 'List of rules' });
});

// Manager Routes
app.get('/api/manager/approvals', (req, res) => {
  res.json({ message: 'List of approvals' });
});

// Employee Routes
app.get('/api/employee/expenses', (req, res) => {
  res.json({ message: 'List of expenses' });
});

app.post('/api/employee/expenses', (req, res) => {
  res.status(201).json({ message: 'Expense created successfully', data: req.body });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
