const express = require('express');
const router = express.Router();
const { getAll, create, update, remove } = require('../controllers/categorieController');
const auth = require('../middlewares/auth');
const rbac = require('../middlewares/rbac');

router.get('/',      auth, rbac('admin', 'responsable', 'employe'), getAll);
router.post('/',     auth, rbac('admin', 'responsable'), create);
router.put('/:id',   auth, rbac('admin', 'responsable'), update);
router.delete('/:id', auth, rbac('admin'), remove);

module.exports = router;
