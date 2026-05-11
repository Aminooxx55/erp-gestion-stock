const express = require('express');
const router = express.Router();
const { getAll, create, exportCSV } = require('../controllers/mouvementController');
const auth = require('../middlewares/auth');  // Vérifie le token JWT
const rbac = require('../middlewares/rbac');  // Vérifie le rôle de l'utilisateur

// Exporter les mouvements en CSV (admin et responsable)
router.get('/export/csv', auth, rbac('admin', 'responsable'), exportCSV);

// Lister tous les mouvements — accessible uniquement par admin et responsable
router.get('/',  auth, rbac('admin', 'responsable'), getAll);

// Créer un nouveau mouvement (entrée ou sortie) — admin et responsable uniquement
router.post('/', auth, rbac('admin', 'responsable'), create);

module.exports = router;
