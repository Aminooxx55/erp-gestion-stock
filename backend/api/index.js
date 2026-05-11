require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { connectDB } = require('../src/config/db');
const db = require('../src/models');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use(rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  message: { message: 'Trop de requetes, reessayez plus tard' }
}));

// Routes
app.use('/api/auth', require('../src/routes/authRoutes'));
app.use('/api/produits', require('../src/routes/produitRoutes'));
app.use('/api/categories', require('../src/routes/categorieRoutes'));
app.use('/api/mouvements', require('../src/routes/mouvementRoutes'));
app.use('/api/utilisateurs', require('../src/routes/userRoutes'));
app.use('/api/chat', require('../src/routes/chatRoutes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ message: 'ERP Gestion Stock API - Welcome' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// Initialize database and export for Vercel
if (process.env.NODE_ENV !== 'production') {
  connectDB();
}

module.exports = app;
