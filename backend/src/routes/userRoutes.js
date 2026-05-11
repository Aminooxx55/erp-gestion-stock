const express = require('express');
const router = express.Router();
const { getAll, getById, create, update, resetPassword, toggleActive, remove } = require('../controllers/userController');
const auth = require('../middlewares/auth');
const rbac = require('../middlewares/rbac');

router.get('/',                  auth, rbac('admin'), getAll);
router.get('/:id',               auth, rbac('admin'), getById);
router.post('/',                 auth, rbac('admin'), create);
router.put('/:id',               auth, rbac('admin'), update);
router.patch('/:id/password',    auth, rbac('admin'), resetPassword);
router.patch('/:id/toggle-active', auth, rbac('admin'), toggleActive);
router.delete('/:id',            auth, rbac('admin'), remove);

module.exports = router;
