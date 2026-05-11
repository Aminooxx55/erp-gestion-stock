const { Categorie, Produit } = require('../models');

// GET /api/categories — includes product count per category
const getAll = async (req, res) => {
  try {
    const categories = await Categorie.findAll({
      include: [{
        model: Produit,
        attributes: [],
      }],
      attributes: {
        include: [
          [
            require('sequelize').fn('COUNT', require('sequelize').col('Produits.id')),
            'produit_count'
          ]
        ],
      },
      group: ['Categorie.id'],
      order: [['nom', 'ASC']],
    });
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// POST /api/categories
const create = async (req, res) => {
  try {
    const { nom, description } = req.body;

    if (!nom)
      return res.status(400).json({ message: 'Le nom est obligatoire' });

    const existing = await Categorie.findOne({ where: { nom } });
    if (existing)
      return res.status(400).json({ message: 'Categorie deja existante' });

    const categorie = await Categorie.create({ nom, description });
    res.status(201).json({ message: 'Categorie creee avec succes', categorie });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// PUT /api/categories/:id
const update = async (req, res) => {
  try {
    const { nom, description } = req.body;

    const categorie = await Categorie.findByPk(req.params.id);
    if (!categorie)
      return res.status(404).json({ message: 'Categorie introuvable' });

    if (nom && nom !== categorie.nom) {
      const existing = await Categorie.findOne({ where: { nom } });
      if (existing) return res.status(400).json({ message: 'Categorie deja existante' });
    }

    await categorie.update({
      nom: nom || categorie.nom,
      description: description !== undefined ? description : categorie.description,
    });

    res.json({ message: 'Categorie mise a jour', categorie });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// DELETE /api/categories/:id
const remove = async (req, res) => {
  try {
    const categorie = await Categorie.findByPk(req.params.id);
    if (!categorie)
      return res.status(404).json({ message: 'Categorie introuvable' });

    const produits = await Produit.count({ where: { categorie_id: req.params.id } });
    if (produits > 0)
      return res.status(400).json({ message: 'Impossible de supprimer: des produits sont lies a cette categorie' });

    await categorie.destroy();
    res.json({ message: 'Categorie supprimee avec succes' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = { getAll, create, update, remove };
