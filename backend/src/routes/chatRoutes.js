const express = require('express');
const router = express.Router();

const auth = require('../middlewares/auth');
const rbac = require('../middlewares/rbac');
const { getStatus, sendMessage } = require('../controllers/chatController');

router.get('/status', auth, rbac('admin', 'responsable', 'employe'), getStatus);
router.post('/message', auth, rbac('admin', 'responsable', 'employe'), sendMessage);

module.exports = router;
