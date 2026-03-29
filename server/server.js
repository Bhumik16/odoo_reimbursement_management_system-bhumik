const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./modules/auth/auth.routes');
const userRoutes = require('./modules/user/user.routes');
const { getDb } = require('./db');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Initialize DB
getDb().then(() => console.log('Database initialized')).catch(console.error);

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Placeholder routes
app.get('/api/health', (req, res) => res.json({ status: 'healthy', timestamp: new Date() }));

// Error handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Something went wrong!' });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
