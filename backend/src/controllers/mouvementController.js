const { Op } = require('sequelize');
const { MouvementStock, Produit, User, sequelize } = require('../models');

// Echapper proprement les valeurs CSV (virgules, guillemets, retours ligne)
const escapeCsv = (val) => {
  const str = String(val == null ? '' : val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

// ============================================================
// GET /api/mouvements — Lister tous les mouvements de stock
// ============================================================
// Optionnel: ?produit_id=xxx, ?type=xxx, ?date_debut=xxx, ?date_fin=xxx
const getAll = async (req, res) => {
  try {
    // Construire le filtre dynamique
    const where = {};
    if (req.query.produit_id) where.produit_id = req.query.produit_id;

    if (req.query.type && ['entree', 'sortie'].includes(req.query.type)) {
      where.type = req.query.type;
    }

    if (req.query.date_debut || req.query.date_fin) {
      where.date_mouvement = {};
      if (req.query.date_debut) {
        where.date_mouvement[Op.gte] = new Date(req.query.date_debut + 'T00:00:00.000Z');
      }
      if (req.query.date_fin) {
        where.date_mouvement[Op.lte] = new Date(req.query.date_fin + 'T23:59:59.999Z');
      }
    }

    // Chercher les mouvements avec les infos du produit et de l'utilisateur
    const mouvements = await MouvementStock.findAll({
      where,
      include: [
        { model: Produit, attributes: ['id', 'nom', 'code', 'unite'] },
        { model: User, attributes: ['id', 'nom', 'prenom'] },
      ],
      order: [['date_mouvement', 'DESC']], // Les plus récents en premier
    });

    res.json(mouvements);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ============================================================
// POST /api/mouvements — Créer un nouveau mouvement de stock
// ============================================================
// Utilise une TRANSACTION pour garantir que:
//   1. Le mouvement est enregistré
//   2. La quantité du produit est mise à jour
// Si une des deux opérations échoue, tout est annulé (rollback)
const create = async (req, res) => {
  // Démarrer une transaction (les deux opérations réussissent ou aucune)
  const transaction = await sequelize.transaction();

  try {
    const { produit_id, type, quantite, motif, reference } = req.body;

    // --- VALIDATION DES DONNÉES ---

    // Vérifier que les champs obligatoires sont remplis
    if (!produit_id || !type || !quantite) {
      await transaction.rollback();
      return res.status(400).json({ message: 'produit_id, type et quantite sont obligatoires' });
    }

    // Vérifier que le type est valide (entree ou sortie)
    if (!['entree', 'sortie'].includes(type)) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Le type doit etre "entree" ou "sortie"' });
    }

    // Vérifier que la quantité est un nombre entier positif
    const qty = Number(quantite);
    if (!Number.isInteger(qty) || qty < 1) {
      await transaction.rollback();
      return res.status(400).json({ message: 'La quantite doit etre un entier positif (minimum 1)' });
    }

    // Vérifier que le produit existe
    const produit = await Produit.findByPk(produit_id, { transaction });
    if (!produit) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Produit introuvable' });
    }

    // Pour une SORTIE: vérifier qu'il y a assez de stock
    if (type === 'sortie' && produit.quantite < qty) {
      await transaction.rollback();
      return res.status(400).json({
        message: `Stock insuffisant. Stock actuel: ${produit.quantite}, demande: ${qty}`,
      });
    }
    // --- FIN VALIDATION ---

    // Générer automatiquement une référence si non fournie
    // Format: MVT-20260421-AB3F (date + 4 caractères aléatoires)
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const autoRef = reference || `MVT-${dateStr}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // 1) Créer le mouvement dans la base de données
    const mouvement = await MouvementStock.create({
      produit_id,
      type,
      quantite: qty,
      motif: motif || null,
      reference: autoRef,
      effectue_par: req.user.id, // ID de l'utilisateur connecté (via le middleware auth)
      date_mouvement: now,
    }, { transaction });

    // 2) Calculer la nouvelle quantité du produit
    //    Entrée = on AJOUTE au stock
    //    Sortie  = on RETIRE du stock
    const newQuantite = type === 'entree'
      ? produit.quantite + qty
      : produit.quantite - qty;

    // 3) Mettre à jour le produit
    await produit.update({ quantite: newQuantite }, { transaction });

    // Tout s'est bien passé → on valide la transaction
    await transaction.commit();

    res.status(201).json({
      message: type === 'entree' ? 'Entree de stock enregistree' : 'Sortie de stock enregistree',
      mouvement,
      nouvelle_quantite: newQuantite,
    });
  } catch (error) {
    // En cas d'erreur → tout annuler
    await transaction.rollback();
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ============================================================
// GET /api/mouvements/export/csv — Export des mouvements
// ============================================================
const exportCSV = async (req, res) => {
  try {
    const where = {};
    
    if (req.query.type && ['entree', 'sortie'].includes(req.query.type)) {
      where.type = req.query.type;
    }

    if (req.query.date_debut || req.query.date_fin) {
      where.date_mouvement = {};
      if (req.query.date_debut) {
        where.date_mouvement[Op.gte] = new Date(req.query.date_debut + 'T00:00:00.000Z');
      }
      if (req.query.date_fin) {
        where.date_mouvement[Op.lte] = new Date(req.query.date_fin + 'T23:59:59.999Z');
      }
    }

    const mouvements = await MouvementStock.findAll({
      where,
      include: [
        { model: Produit, attributes: ['nom', 'code', 'unite'] },
        { model: User, attributes: ['nom', 'prenom'] },
      ],
      order: [['date_mouvement', 'DESC']],
    });

    // Entete lisible directement dans Excel / LibreOffice
    const header = 'Reference,Produit,Code Produit,Type,Quantite,Unite,Motif,Par,Date\n';

    const rows = mouvements.map((m) => {
      const fullName = m.User ? `${m.User.prenom} ${m.User.nom}` : '';
      const isoDate = m.date_mouvement ? new Date(m.date_mouvement).toISOString() : '';

      return [
        m.reference,
        m.Produit?.nom,
        m.Produit?.code,
        m.type,
        m.quantite,
        m.Produit?.unite,
        m.motif,
        fullName,
        isoDate,
      ].map(escapeCsv).join(',');
    }).join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="mouvements.csv"');
    // BOM UTF-8 pour eviter les problemes d'accents dans Excel
    res.send('\uFEFF' + header + rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = { getAll, create, exportCSV };
