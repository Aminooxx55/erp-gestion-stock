const express = require('express');
const router = express.Router();
const { getAll, getById, create, update, remove, exportCSV } = require('../controllers/produitController');
const auth = require('../middlewares/auth');
const rbac = require('../middlewares/rbac');

router.get('/export/csv', auth, rbac('admin', 'responsable'), exportCSV);
router.get('/',           auth, rbac('admin', 'responsable', 'employe'), getAll);
router.get('/:id',        auth, rbac('admin', 'responsable', 'employe'), getById);
router.post('/',          auth, rbac('admin', 'responsable'), create);
router.put('/:id',        auth, rbac('admin', 'responsable'), update);
router.delete('/:id',     auth, rbac('admin'), remove);

module.exports = router;
