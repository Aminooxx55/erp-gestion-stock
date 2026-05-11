const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const MouvementStock = sequelize.define('MouvementStock', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    produit_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('entree', 'sortie'),
      allowNull: false,
    },
    quantite: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1, // On ne peut pas bouger 0 ou une quantité negative
      },
    },
    motif: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    reference: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    effectue_par: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    date_mouvement: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'mouvements_stock',
    timestamps: true,
  });

  return MouvementStock;
};
