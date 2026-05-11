import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute — protège une page pour que seuls les utilisateurs
 * connectés (et avec le bon rôle) puissent y accéder.
 *
 * Usage dans App.jsx:
 *   <ProtectedRoute roles={['admin', 'responsable']}>
 *     <MaPage />
 *   </ProtectedRoute>
 *
 * Comportement:
 *   1. Pas connecté          → redirige vers /login
 *   2. Connecté mais mauvais rôle → redirige vers sa page par défaut
 *   3. Connecté et bon rôle  → affiche la page
 */
function ProtectedRoute({ children, roles }) {
  const { user } = useAuth();

  // Pas connecté → aller au login
  if (!user) return <Navigate to="/login" replace />;

  // Connecté mais n'a pas le rôle requis → rediriger vers sa page par défaut
  if (roles && !roles.includes(user.role)) {
    const fallback = (user.role === 'admin' || user.role === 'responsable') ? '/dashboard' : '/produits';
    return <Navigate to={fallback} replace />;
  }

  // Tout est bon → afficher la page
  return children;
}

export default ProtectedRoute;
