require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { connectDB } = require('./config/db');
const db = require('./models');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use(rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  message: { message: 'Trop de requetes, reessayez plus tard' }
}));

app.get('/', (req, res) => {
  res.json({ message: 'ERP Gestion Stock API is running' });
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/categories', require('./routes/categorieRoutes'));
app.use('/api/produits', require('./routes/produitRoutes'));
app.use('/api/mouvements', require('./routes/mouvementRoutes'));
app.use('/api/chatbot', require('./routes/chatRoutes'));

const start = async () => {
  await connectDB();
  await db.sequelize.sync();
  console.log('Tables synchronisees');
  app.listen(PORT, () => {
    console.log('Serveur lance sur le port ' + PORT);
  });
};

start();