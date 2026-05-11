const express = require('express');
const router = express.Router();
const { register, login, getMe, updateMe, changeMyPassword } = require('../controllers/authController');
const auth = require('../middlewares/auth');

router.post('/register', register);
router.post('/login', login);

// Routes du compte connecté (Mon compte)
router.get('/me', auth, getMe);
router.put('/me', auth, updateMe);
router.put('/me/password', auth, changeMyPassword);

module.exports = router;