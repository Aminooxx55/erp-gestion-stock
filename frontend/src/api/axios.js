import axios from 'axios';

// Créer une instance Axios avec l'URL de base de notre API
const api = axios.create({
  baseURL: '/api',
});

// ── INTERCEPTEUR DE REQUÊTE ──
// Avant chaque requête HTTP, on ajoute automatiquement le token JWT
// dans le header "Authorization" (format: "Bearer <token>")
// Comme ça, on n'a pas besoin de l'ajouter manuellement à chaque appel
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── INTERCEPTEUR DE RÉPONSE ──
// Si le serveur renvoie une erreur 401 (token expiré ou invalide),
// on déconnecte l'utilisateur automatiquement et on le redirige vers /login
// Exception: on ne le fait PAS si l'erreur vient de login/register
api.interceptors.response.use(
  (response) => response, // Si tout va bien → on laisse passer
  (error) => {
    const url = error.config?.url || '';
    const isAuthRoute = url.includes('/auth/login') || url.includes('/auth/register');

    if (error.response?.status === 401 && !isAuthRoute) {
      // Token invalide → déconnexion
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;
