const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Standardiser la forme de l'utilisateur renvoyé au frontend
// (on n'expose jamais password_hash)
const toSafeUser = (user) => ({
  id: user.id,
  nom: user.nom,
  prenom: user.prenom,
  email: user.email,
  role: user.role,
  actif: user.actif,
  derniere_connexion: user.derniere_connexion,
  createdAt: user.createdAt,
});

// =====================
// REGISTER
// =====================
const register = async (req, res) => {
  try {
    const { nom, prenom, email, password } = req.body;

    // --- VALIDATION ---
    if (!nom || !prenom || !email || !password) {
      return res.status(400).json({ message: 'Tous les champs sont obligatoires' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caracteres' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Format email invalide' });
    }

    // --- FIN VALIDATION ---

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: 'Email deja utilise' });
    }

    const password_hash = await bcrypt.hash(password, 12);

    // Le compte est créé avec actif = false (en attente de validation par l'admin)
    const user = await User.create({
      nom,
      prenom,
      email,
      password_hash,
      role: 'employe',
      actif: false,
    });

    // Le compte est en attente de validation — on ne donne PAS de token.
    // L'utilisateur devra attendre que l'admin active son compte.
    res.status(201).json({
      message: 'Compte cree avec succes. En attente de validation par un administrateur.',
      user: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
        actif: user.actif,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// =====================
// LOGIN
// =====================
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // --- VALIDATION ---
    if (!email || !password) {
      return res.status(400).json({ message: 'Email et mot de passe sont obligatoires' });
    }
    // --- FIN VALIDATION ---

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    if (!user.actif) {
      return res.status(403).json({ message: 'Votre demande de creation de compte est en cours de validation par un administrateur. Vous recevrez un acces des que votre compte sera approuve.', pendingApproval: true });
    }  

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    // Capture la precedente connexion avant d'ecraser la valeur en base
    // (comme ca "derniere_connexion" represente la session precedente du cote frontend)
    const previousConnexion = user.derniere_connexion;
    await user.update({ derniere_connexion: new Date() });

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: 'Configuration serveur manquante' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      message: 'Connexion reussie',
      token,
      user: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
        derniere_connexion: previousConnexion,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// =====================
// GET /api/auth/me
// =====================
// Retourne le profil du compte connecté
const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    res.json({ user: toSafeUser(user) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// =====================
// PUT /api/auth/me
// =====================
// Met a jour les infos personnelles (nom, prenom, email)
const updateMe = async (req, res) => {
  try {
    const { nom, prenom, email } = req.body;

    if (nom === undefined && prenom === undefined && email === undefined) {
      return res.status(400).json({ message: 'Aucune donnee a mettre a jour' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    // Valider les champs textuels seulement s'ils sont fournis
    if (nom !== undefined && !String(nom).trim()) {
      return res.status(400).json({ message: 'Le nom ne peut pas etre vide' });
    }
    if (prenom !== undefined && !String(prenom).trim()) {
      return res.status(400).json({ message: 'Le prenom ne peut pas etre vide' });
    }

    let nextEmail = user.email;
    if (email !== undefined) {
      const normalizedEmail = String(email).trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(normalizedEmail)) {
        return res.status(400).json({ message: 'Format email invalide' });
      }

      const existing = await User.findOne({ where: { email: normalizedEmail } });
      if (existing && existing.id !== user.id) {
        return res.status(400).json({ message: 'Email deja utilise' });
      }

      nextEmail = normalizedEmail;
    }

    await user.update({
      nom: nom !== undefined ? String(nom).trim() : user.nom,
      prenom: prenom !== undefined ? String(prenom).trim() : user.prenom,
      email: nextEmail,
    });

    res.json({
      message: 'Profil mis a jour avec succes',
      user: toSafeUser(user),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// =====================
// PUT /api/auth/me/password
// =====================
// Change le mot de passe du compte connecté
const changeMyPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Mot de passe actuel et nouveau mot de passe obligatoires' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Le nouveau mot de passe doit contenir au moins 6 caracteres' });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ message: 'Le nouveau mot de passe doit etre different de l\'ancien' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) {
      return res.status(400).json({ message: 'Mot de passe actuel incorrect' });
    }

    const password_hash = await bcrypt.hash(newPassword, 12);
    await user.update({ password_hash });

    res.json({ message: 'Mot de passe modifie avec succes' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = { register, login, getMe, updateMe, changeMyPassword };