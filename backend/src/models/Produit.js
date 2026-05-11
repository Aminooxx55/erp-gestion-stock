const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Produit = sequelize.define('Produit', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    nom: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    unite: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    quantite: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    seuil_min: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    categorie_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  }, {
    tableName: 'produits',
    timestamps: true,
  });

  return Produit;
};
