const { Sequelize } = require('sequelize');
const config = require('./config');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connectee avec succes');
  } catch (error) {
    console.error('Erreur connexion database:', error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };