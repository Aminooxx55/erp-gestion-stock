const { Op } = require('sequelize');
const { Produit, Categorie } = require('../models');

// GET /api/produits?search=xxx&categorie_id=xxx
const getAll = async (req, res) => {
  try {
    const { search, categorie_id } = req.query;
    const where = {};

    if (search) {
      where[Op.or] = [
        { nom: { [Op.iLike]: `%${search}%` } },
        { code: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (categorie_id) where.categorie_id = categorie_id;

    const produits = await Produit.findAll({
      where,
      include: [{ model: Categorie, attributes: ['id', 'nom'] }],
      order: [['createdAt', 'DESC']],
    });

    res.json(produits);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// GET /api/produits/:id
const getById = async (req, res) => {
  try {
    const produit = await Produit.findByPk(req.params.id, {
      include: [{ model: Categorie, attributes: ['id', 'nom'] }],
    });
    if (!produit) return res.status(404).json({ message: 'Produit introuvable' });
    res.json(produit);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// POST /api/produits
const create = async (req, res) => {
  try {
    const { code, nom, description, unite, seuil_min, categorie_id } = req.body;

    if (!code || !nom || !unite)
      return res.status(400).json({ message: 'code, nom et unite sont obligatoires' });

    if (seuil_min !== undefined && Number(seuil_min) < 0)
      return res.status(400).json({ message: 'Le seuil minimum ne peut pas etre negatif' });

    const existing = await Produit.findOne({ where: { code } });
    if (existing)
      return res.status(400).json({ message: 'Code produit deja utilise' });

    if (categorie_id) {
      const cat = await Categorie.findByPk(categorie_id);
      if (!cat) return res.status(404).json({ message: 'Categorie introuvable' });
    }

    const produit = await Produit.create({
      code, nom, description, unite,
      // La quantite de stock est pilotee par les mouvements.
      // A la creation du produit, on initialise a 0.
      quantite: 0,
      seuil_min: seuil_min || 0,
      categorie_id: categorie_id || null,
    });

    res.status(201).json({ message: 'Produit cree avec succes', produit });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// PUT /api/produits/:id
const update = async (req, res) => {
  try {
    const { code, nom, description, unite, seuil_min, categorie_id } = req.body;

    const produit = await Produit.findByPk(req.params.id);
    if (!produit) return res.status(404).json({ message: 'Produit introuvable' });

    if (code && code !== produit.code) {
      const existing = await Produit.findOne({ where: { code } });
      if (existing) return res.status(400).json({ message: 'Code produit deja utilise' });
    }

    if (seuil_min !== undefined && Number(seuil_min) < 0)
      return res.status(400).json({ message: 'Le seuil minimum ne peut pas etre negatif' });

    if (categorie_id) {
      const cat = await Categorie.findByPk(categorie_id);
      if (!cat) return res.status(404).json({ message: 'Categorie introuvable' });
    }

    await produit.update({
      code: code || produit.code,
      nom: nom || produit.nom,
      description: description !== undefined ? description : produit.description,
      unite: unite || produit.unite,
      // Pas de mise a jour directe du stock ici: utiliser les mouvements.
      seuil_min: seuil_min !== undefined ? Number(seuil_min) : produit.seuil_min,
      categorie_id: categorie_id !== undefined ? categorie_id : produit.categorie_id,
    });

    res.json({ message: 'Produit mis a jour', produit });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// DELETE /api/produits/:id
const remove = async (req, res) => {
  try {
    const produit = await Produit.findByPk(req.params.id);
    if (!produit) return res.status(404).json({ message: 'Produit introuvable' });

    await produit.destroy();
    res.json({ message: 'Produit supprime avec succes' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// GET /api/produits/export/csv
const exportCSV = async (req, res) => {
  try {
    const produits = await Produit.findAll({
      include: [{ model: Categorie, attributes: ['nom'] }],
      order: [['nom', 'ASC']],
    });

    const escape = (val) => {
      const str = String(val == null ? '' : val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const header = 'Code,Nom,Categorie,Unite,Quantite,Seuil Min\n';
    const rows = produits.map((p) => {
      const cat = p.Categorie ? p.Categorie.nom : '';
      return [p.code, p.nom, cat, p.unite, p.quantite, p.seuil_min]
        .map(escape)
        .join(',');
    }).join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="produits.csv"');
    res.send('\uFEFF' + header + rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = { getAll, getById, create, update, remove, exportCSV };
