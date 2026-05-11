const { Produit, Categorie, MouvementStock } = require('../models');
const {
  askInventoryAssistant,
  isGeminiConfigured,
  getMissingEnvVars,
} = require('../services/geminiService');

const MAX_MESSAGE_LENGTH = 1200;
const MAX_HISTORY_ITEMS = 12;

const normalizeIncomingHistory = (history) => {
  if (!Array.isArray(history)) return [];

  return history
    .filter(
      (item) =>
        item &&
        (item.role === 'user' || item.role === 'assistant') &&
        typeof item.content === 'string'
    )
    .map((item) => ({
      role: item.role,
      content: item.content.trim().slice(0, MAX_MESSAGE_LENGTH),
    }))
    .filter((item) => item.content.length > 0)
    .slice(-MAX_HISTORY_ITEMS);
};

const buildInventoryContext = async () => {
  const recentWindowDays = 7;
  const recentMovementLimit = 80;
  const recentSince = new Date(Date.now() - recentWindowDays * 24 * 60 * 60 * 1000);

  const [produits, categoriesTotal, mouvementsTotal, recentMouvements] = await Promise.all([
    Produit.findAll({
      attributes: ['id', 'nom', 'code', 'quantite', 'seuil_min', 'unite'],
    }),
    Categorie.count(),
    MouvementStock.count(),
    MouvementStock.findAll({
      attributes: ['type', 'quantite', 'date_mouvement', 'motif', 'reference'],
      where: {
        date_mouvement: {
          [require('sequelize').Op.gte]: recentSince,
        },
      },
      include: [
        {
          model: Produit,
          attributes: ['code', 'nom', 'unite'],
        },
      ],
      order: [['date_mouvement', 'DESC']],
      limit: recentMovementLimit,
    }),
  ]);

  let stockTotal = 0;
  let ruptureTotal = 0;
  let sousSeuilTotal = 0;
  const alertes = [];

  for (const produit of produits) {
    const quantite = Number(produit.quantite) || 0;
    const seuil = Number(produit.seuil_min) || 0;

    stockTotal += quantite;

    if (quantite <= 0) {
      ruptureTotal += 1;
      alertes.push({
        code: produit.code,
        nom: produit.nom,
        quantite,
        seuil,
        unite: produit.unite,
        type: 'rupture',
        ecart: Math.max(0, seuil - quantite),
      });
      continue;
    }

    if (seuil > 0 && quantite <= seuil) {
      sousSeuilTotal += 1;
      alertes.push({
        code: produit.code,
        nom: produit.nom,
        quantite,
        seuil,
        unite: produit.unite,
        type: 'sous-seuil',
        ecart: Math.max(0, seuil - quantite),
      });
    }
  }

  const topAlertes = alertes
    .sort((a, b) => {
      if (a.type !== b.type) return a.type === 'rupture' ? -1 : 1;
      return b.ecart - a.ecart;
    })
    .slice(0, 5);

  const topAlertesText = topAlertes
    .map((a) => {
      const seuilTxt = a.seuil > 0 ? a.seuil : '-';
      return `${a.code} (${a.quantite}/${seuilTxt} ${a.unite})`;
    })
    .join(' | ');

  const recentDailyNet = {};
  let recentEntrees = 0;
  let recentSorties = 0;

  for (const mouvement of recentMouvements) {
    const amount = Number(mouvement.quantite) || 0;
    const direction = mouvement.type === 'sortie' ? -1 : 1;
    const dayKey = new Date(mouvement.date_mouvement).toISOString().slice(0, 10);

    if (!recentDailyNet[dayKey]) {
      recentDailyNet[dayKey] = 0;
    }

    recentDailyNet[dayKey] += direction * amount;

    if (direction > 0) {
      recentEntrees += amount;
    } else {
      recentSorties += amount;
    }
  }

  const recentNetTotal = recentEntrees - recentSorties;
  const dailyAverageNet = recentWindowDays > 0 ? recentNetTotal / recentWindowDays : 0;
  const projectedStock4Days = Math.max(0, Math.round(stockTotal + dailyAverageNet * 4));

  const recentTrendText = Object.entries(recentDailyNet)
    .sort(([dayA], [dayB]) => dayA.localeCompare(dayB))
    .map(([day, net]) => `${day}:${net >= 0 ? '+' : ''}${net}`)
    .join(' | ');

  const recentMovementSummary = recentMouvements.slice(0, 10).map((mouvement) => ({
    date: mouvement.date_mouvement,
    type: mouvement.type,
    quantite: mouvement.quantite,
    produitCode: mouvement.Produit?.code || null,
    produitNom: mouvement.Produit?.nom || null,
    produitUnite: mouvement.Produit?.unite || null,
    motif: mouvement.motif || null,
    reference: mouvement.reference || null,
  }));

  return {
    produitsTotal: produits.length,
    categoriesTotal,
    mouvementsTotal,
    ruptureTotal,
    sousSeuilTotal,
    stockTotal,
    topAlertesText,
    recentWindowDays,
    recentMouvementsTotal: recentMouvements.length,
    recentEntrees,
    recentSorties,
    recentNetTotal,
    dailyAverageNet,
    projectedStock4Days,
    recentTrendText,
    recentMovementSummary,
  };
};

const getStatus = (req, res) => {
  const missing = getMissingEnvVars();
  res.json({
    configured: missing.length === 0,
    missing,
  });
};

const sendMessage = async (req, res) => {
  try {
    if (!isGeminiConfigured()) {
      return res.status(503).json({
        message: 'Chatbot indisponible: configuration Gemini incomplete',
        missing: getMissingEnvVars(),
      });
    }

    const message = String(req.body?.message || '').trim();
    const history = normalizeIncomingHistory(req.body?.history);

    if (!message) {
      return res.status(400).json({ message: 'Le message est obligatoire' });
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({
        message: `Le message ne doit pas depasser ${MAX_MESSAGE_LENGTH} caracteres`,
      });
    }

    const context = await buildInventoryContext();

    const result = await askInventoryAssistant({
      user: req.user,
      message,
      history,
      context,
    });

    return res.json({
      reply: result.reply,
      usage: result.usage,
      snapshot: {
        produitsTotal: context.produitsTotal,
        ruptureTotal: context.ruptureTotal,
        sousSeuilTotal: context.sousSeuilTotal,
        projectedStock4Days: context.projectedStock4Days,
      },
    });
  } catch (error) {
    console.error('chatbot.sendMessage error:', error.message);
    return res.status(500).json({ message: 'Erreur serveur chatbot' });
  }
};

module.exports = {
  getStatus,
  sendMessage,
};
