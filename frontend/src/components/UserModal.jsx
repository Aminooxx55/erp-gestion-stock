import { useState, useEffect, useRef } from 'react';
import { FiX } from 'react-icons/fi';
import api from '../api/axios';
import { motion } from 'framer-motion';

// Modal for creating or editing a user (admin only)
// Props:
//   user — null for create, user object for edit
//   onClose — callback to close the modal
//   onSaved — callback after successful save
function UserModal({ user, onClose, onSaved }) {
  const isEdit = Boolean(user);

  const [form, setForm] = useState({ nom: '', prenom: '', email: '', password: '', role: 'employe' });
  const [resetPwd, setResetPwd] = useState({ newPassword: '', confirmPassword: '' });
  const [status, setStatus] = useState('actif');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const firstInputRef = useRef(null);

  // Pre-fill form when editing an existing user
  useEffect(() => {
    if (isEdit) {
      setForm({ nom: user.nom, prenom: user.prenom, email: user.email, password: '', role: user.role });
      setStatus(user.actif ? 'actif' : 'inactif');
    }
    setResetPwd({ newPassword: '', confirmPassword: '' });
  }, [user, isEdit]);

  // Lock page scroll while modal is open
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  // Focus first field for faster keyboard flow
  useEffect(() => {
    firstInputRef.current?.focus();
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  // POST /api/users (create) or PUT /api/users/:id (update)
  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      if (isEdit) {
        const hasResetPwd = resetPwd.newPassword || resetPwd.confirmPassword;
        const nextActive = status === 'actif';
        if (hasResetPwd) {
          if (resetPwd.newPassword !== resetPwd.confirmPassword) {
            setError('Les mots de passe ne correspondent pas');
            setLoading(false);
            return;
          }
          if (resetPwd.newPassword.length < 6) {
            setError('Le mot de passe doit contenir au moins 6 caracteres');
            setLoading(false);
            return;
          }
        }

        const payload = { nom: form.nom, prenom: form.prenom, email: form.email, role: form.role };
        await api.put(`/users/${user.id}`, payload);

        if (hasResetPwd) {
          await api.patch(`/users/${user.id}/password`, resetPwd);
        }

        if (nextActive !== user.actif) {
          await api.patch(`/users/${user.id}/toggle-active`);
        }
      } else {
        await api.post('/users', form);
      }
      onSaved();
    } catch (err) { setError(err.response?.data?.message || 'Erreur serveur'); }
    finally { setLoading(false); }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="modal-panel max-w-md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-modal-title"
      >
        <div className="modal-accent" style={{ background: 'linear-gradient(90deg, var(--indigo), var(--purple))' }} />

        <div className="flex items-center justify-between mb-6 mt-1">
          <h2 id="user-modal-title" className="text-lg font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {isEdit ? 'Modifier utilisateur' : 'Ajouter un utilisateur'}
          </h2>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onClose}
            className="p-2 rounded-xl transition-colors" style={{ color: 'var(--text-secondary)', background: 'var(--neutral-alpha-6)' }}
            aria-label="Fermer la fenêtre">
            <FiX size={18} />
          </motion.button>
        </div>

        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="notice notice-error mb-4">
            {error}
          </motion.p>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Nom</label>
              <input ref={firstInputRef} name="nom" value={form.nom} onChange={handleChange} required className="input-field" />
            </div>
            <div>
              <label className="input-label">Prénom</label>
              <input name="prenom" value={form.prenom} onChange={handleChange} required className="input-field" />
            </div>
          </div>

          <div>
            <label className="input-label">Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} required className="input-field" />
          </div>

          {/* Password — only shown when creating */}
          {!isEdit && (
            <div>
              <label className="input-label">Mot de passe</label>
              <input name="password" type="password" value={form.password} onChange={handleChange} required
                placeholder="Minimum 6 caractères" className="input-field" />
            </div>
          )}

          {/* Reset password — only shown when editing */}
          {isEdit && (
            <>
              <div>
                <label className="input-label">Nouveau mot de passe</label>
                <input
                  name="newPassword"
                  type="password"
                  value={resetPwd.newPassword}
                  onChange={(e) => setResetPwd({ ...resetPwd, newPassword: e.target.value })}
                  minLength="6"
                  className="input-field"
                  placeholder="Laisser vide pour ne pas changer"
                />
              </div>
              <div>
                <label className="input-label">Confirmer nouveau mot de passe</label>
                <input
                  name="confirmPassword"
                  type="password"
                  value={resetPwd.confirmPassword}
                  onChange={(e) => setResetPwd({ ...resetPwd, confirmPassword: e.target.value })}
                  minLength="6"
                  className="input-field"
                  placeholder="Confirmer le nouveau mot de passe"
                />
              </div>
            </>
          )}

          <div>
            <label className="input-label">Rôle</label>
            <div className="relative">
              <select name="role" value={form.role} onChange={handleChange}
                className="input-field appearance-none cursor-pointer pr-10">
                <option value="employe" style={{ background: 'var(--bg-surface)' }}>Employé</option>
                <option value="responsable" style={{ background: 'var(--bg-surface)' }}>Responsable Stock</option>
                <option value="admin" style={{ background: 'var(--bg-surface)' }}>Administrateur</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-secondary)', opacity: 0.4 }}>
                <svg width="10" height="6" viewBox="0 0 12 8" fill="none"><path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </div>
          </div>

          {isEdit && (
            <div>
              <label className="input-label">Statut</label>
              <div className="relative">
                <select
                  name="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="input-field appearance-none cursor-pointer pr-10"
                >
                  <option value="actif" style={{ background: 'var(--bg-surface)' }}>Actif</option>
                  <option value="inactif" style={{ background: 'var(--bg-surface)' }}>Inactif</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-secondary)', opacity: 0.4 }}>
                  <svg width="10" height="6" viewBox="0 0 12 8" fill="none"><path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-5 mt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <motion.button whileTap={{ scale: 0.97 }} type="button" onClick={onClose} className="flex-1 btn btn-secondary">
              Annuler
            </motion.button>
            <motion.button
              whileHover={{ boxShadow: '0 10px 28px rgba(99,102,241,0.3)' }}
              whileTap={{ scale: 0.97 }}
              type="submit" disabled={loading}
              className="flex-1 btn btn-primary"
              style={{ background: 'linear-gradient(135deg, var(--indigo), var(--purple))', boxShadow: '0 6px 20px rgba(99,102,241,0.2)' }}
            >
              {loading ? <><span className="spinner spinner-sm" /> Traitement...</> : isEdit ? 'Enregistrer' : 'Créer le compte'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default UserModal;
