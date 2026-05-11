const jwt = require('jsonwebtoken');
const { User } = require('../models');

/**
 * Middleware d'authentification JWT.
 *
 * Vérifie que la requête contient un token valide dans le header:
 *   Authorization: Bearer <token>
 *
 * Si le token est valide → on ajoute l'utilisateur dans req.user
 *   et on passe au middleware suivant (next).
 * Sinon → on renvoie une erreur 401.
 */
const auth = async (req, res, next) => {
  try {
    // Extraire le token du header "Authorization: Bearer xyz123..."
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Token manquant' });
    }

    // Vérifier et décoder le token avec la clé secrète
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Chercher l'utilisateur dans la base de données
    const user = await User.findByPk(decoded.id);
    if (!user || !user.actif) {
      return res.status(401).json({ message: 'Utilisateur non trouve ou desactive' });
    }

    // Stocker l'utilisateur dans la requête pour les middlewares suivants
    // (le controller pourra accéder à req.user.id, req.user.role, etc.)
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token invalide' });
  }
};

module.exports = auth;