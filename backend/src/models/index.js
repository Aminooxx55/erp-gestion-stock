const { sequelize } = require('../config/db');

const db = {};

db.sequelize = sequelize;
db.User = require('./User')(sequelize);
db.Categorie = require('./Categorie')(sequelize);
db.Produit = require('./Produit')(sequelize);
db.MouvementStock = require('./MouvementStock')(sequelize);

db.Categorie.hasMany(db.Produit, { foreignKey: 'categorie_id' });
db.Produit.belongsTo(db.Categorie, { foreignKey: 'categorie_id' });

db.Produit.hasMany(db.MouvementStock, { foreignKey: 'produit_id' });
db.MouvementStock.belongsTo(db.Produit, { foreignKey: 'produit_id' });

db.User.hasMany(db.MouvementStock, { foreignKey: 'effectue_par' });
db.MouvementStock.belongsTo(db.User, { foreignKey: 'effectue_par' });

module.exports = db;