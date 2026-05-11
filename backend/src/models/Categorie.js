const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Categorie = sequelize.define('Categorie', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    nom: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName: 'categories',
    timestamps: true,
  });

  return Categorie;
};
