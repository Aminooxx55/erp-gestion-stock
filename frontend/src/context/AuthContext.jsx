import { createContext, useContext, useState } from 'react';
import api from '../api/axios';

// Créer un "contexte" React pour partager les données d'authentification
// dans toute l'application sans passer les props partout
const AuthContext = createContext(null);

/**
 * AuthProvider — enveloppe l'application et fournit:
 *   - user    : l'utilisateur connecté (ou null)
 *   - token   : le JWT token
 *   - login() : fonction pour se connecter
 *   - register() : fonction pour s'inscrire
 *   - logout(): fonction pour se déconnecter
 *   - updateProfile() : modifier nom/prenom/email du compte connecté
 *   - changePassword() : changer le mot de passe du compte connecté
 *   - refreshMe() : récupérer le profil actuel depuis le backend
 */
export function AuthProvider({ children }) {
  // Au démarrage, on vérifie si un utilisateur est déjà stocké dans localStorage
  // (pour garder la connexion après un refresh de page)
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('auth_user');
    return stored ? JSON.parse(stored) : null;
  });

  const [token, setToken] = useState(() => localStorage.getItem('auth_token'));

  // Centraliser la synchro user React + localStorage
  const syncStoredUser = (nextUser) => {
    localStorage.setItem('auth_user', JSON.stringify(nextUser));
    setUser(nextUser);
  };

  // CONNEXION: envoie email + password au backend, reçoit un token JWT
  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    // Sauvegarder dans localStorage (persistance après refresh)
    localStorage.setItem('auth_token', data.token);
    syncStoredUser(data.user);
    // Mettre à jour l'état React
    setToken(data.token);
    return data.user;
  };

  // INSCRIPTION: envoie les données au backend.
  // Le compte est créé avec actif = false (en attente d'approbation par l'admin)
  // Pas de token ni de connexion automatique.
  const register = async (nom, prenom, email, password) => {
    const { data } = await api.post('/auth/register', { nom, prenom, email, password });
    return data;
  };

  // Mettre a jour les infos de "Mon compte"
  const updateProfile = async (payload) => {
    const { data } = await api.put('/auth/me', payload);
    syncStoredUser(data.user);
    return data.user;
  };

  // Changer le mot de passe du compte connecté
  const changePassword = async (currentPassword, newPassword) => {
    const { data } = await api.put('/auth/me/password', { currentPassword, newPassword });
    return data;
  };

  // Rafraichir les infos utilisateur (utile si le backend met a jour des champs)
  const refreshMe = async () => {
    const { data } = await api.get('/auth/me');
    syncStoredUser(data.user);
    return data.user;
  };

  // DÉCONNEXION: supprimer les données et remettre à zéro
  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setToken(null);
    setUser(null);
  };

  // Rendre les données accessibles à tous les composants enfants
  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, updateProfile, changePassword, refreshMe }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook personnalisé pour accéder au contexte facilement
// Usage: const { user, login, logout } = useAuth();
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}
