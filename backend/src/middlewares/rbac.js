/**
 * Middleware RBAC (Role-Based Access Control).
 *
 * Vérifie que l'utilisateur connecté a le bon rôle pour accéder à la route.
 *
 * Usage dans les routes:
 *   router.get('/', auth, rbac('admin', 'responsable'), controller);
 *
 * - auth  → vérifie le token JWT et met l'utilisateur dans req.user
 * - rbac  → vérifie que req.user.role est dans la liste autorisée
 *
 * Si le rôle n'est pas autorisé → renvoie une erreur 403 (accès refusé)
 */
const rbac = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Acces refuse' });
    }
    next();
  };
};

module.exports = rbac;