const bcrypt = require('bcrypt');
const { User } = require('../models');

// GET /api/users
const getAll = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password_hash'] },
      order: [['createdAt', 'DESC']],
    });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// GET /api/users/:id
const getById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password_hash'] },
    });
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// POST /api/users
const create = async (req, res) => {
  try {
    const { nom, prenom, email, password, role } = req.body;

    if (!nom || !prenom || !email || !password)
      return res.status(400).json({ message: 'Tous les champs sont obligatoires' });

    if (password.length < 6)
      return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caracteres' });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      return res.status(400).json({ message: 'Format email invalide' });

    const rolesValides = ['admin', 'responsable', 'employe'];
    if (role && !rolesValides.includes(role))
      return res.status(400).json({ message: 'Role invalide' });

    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(400).json({ message: 'Email deja utilise' });

    const password_hash = await bcrypt.hash(password, 12);

    const user = await User.create({
      nom,
      prenom,
      email,
      password_hash,
      role: role || 'employe',
    });

    res.status(201).json({
      message: 'Utilisateur cree avec succes',
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

// PUT /api/users/:id
const update = async (req, res) => {
  try {
    const { nom, prenom, email, role } = req.body;

    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });

    const rolesValides = ['admin', 'responsable', 'employe'];
    if (role && !rolesValides.includes(role))
      return res.status(400).json({ message: 'Role invalide' });

    if (email && email !== user.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email))
        return res.status(400).json({ message: 'Format email invalide' });
      const existing = await User.findOne({ where: { email } });
      if (existing) return res.status(400).json({ message: 'Email deja utilise' });
    }

    if (req.user.id === user.id && role && role !== 'admin')
      return res.status(400).json({ message: 'Vous ne pouvez pas retirer votre propre role admin' });

    await user.update({
      nom: nom || user.nom,
      prenom: prenom || user.prenom,
      email: email || user.email,
      role: role || user.role,
    });

    res.json({
      message: 'Utilisateur mis a jour',
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

// PATCH /api/users/:id/password
const resetPassword = async (req, res) => {
  try {
    const { newPassword, confirmPassword } = req.body;

    if (!newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'Mot de passe et confirmation obligatoires' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caracteres' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Les mots de passe ne correspondent pas' });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });

    const password_hash = await bcrypt.hash(newPassword, 12);
    await user.update({ password_hash });

    res.json({ message: 'Mot de passe reinitialise avec succes' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// PATCH /api/users/:id/toggle-active
const toggleActive = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });

    if (req.user.id === user.id)
      return res.status(400).json({ message: 'Vous ne pouvez pas modifier le statut de votre propre compte' });

    const newStatus = !user.actif;
    await user.update({ actif: newStatus });
    res.json({
      message: newStatus ? 'Utilisateur active avec succes' : 'Utilisateur desactive avec succes',
      actif: newStatus,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// DELETE /api/users/:id
const remove = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });

    if (req.user.id === user.id)
      return res.status(400).json({ message: 'Vous ne pouvez pas supprimer votre propre compte' });

    await user.destroy();
    res.json({ message: 'Utilisateur supprime avec succes' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = { getAll, getById, create, update, resetPassword, toggleActive, remove };
