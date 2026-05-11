import { useState, useEffect } from 'react';
import { FiX, FiUser, FiLock, FiCheck, FiClock } from 'react-icons/fi';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { timeAgoFr, formatDateTimeFr } from '../utils/formatDate';

function ProfileModal({ onClose }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('infos'); // 'infos' or 'security'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Info form
  const [infoForm, setInfoForm] = useState({
    nom: user?.nom || '',
    prenom: user?.prenom || '',
    email: user?.email || '',
  });

  // Security form
  const [pwdForm, setPwdForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const handleEscape = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handleInfoSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const { data } = await api.put('/auth/me', infoForm);
      setSuccess('Profil mis à jour avec succès.');
      // Update local storage to reflect changes in UI without refresh
      const stored = JSON.parse(localStorage.getItem('auth_user') || '{}');
      const updatedUser = { ...stored, ...data.user };
      localStorage.setItem('auth_user', JSON.stringify(updatedUser));
      // Ideally we'd need to update the context state, in simple setups a reload works 
      // or we just trust the next reload will have it. For now, it Updates on next refresh.
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const handlePwdSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      setError('Les nouveaux mots de passe ne correspondent pas.');
      return;
    }
    setLoading(true);
    try {
      await api.put('/auth/me/password', {
        currentPassword: pwdForm.currentPassword,
        newPassword: pwdForm.newPassword
      });
      setSuccess('Mot de passe changé avec succès.');
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du changement de mot de passe');
    } finally {
      setLoading(false);
    }
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
        className="modal-panel max-w-md w-full"
      >
        <div className="modal-accent" style={{ background: 'linear-gradient(90deg, var(--blue), var(--indigo))' }} />
        
        <div className="flex items-center justify-between mb-4 mt-1">
          <h2 className="text-lg font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Mon Compte
          </h2>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onClose}
            className="p-2 rounded-xl transition-colors" style={{ color: 'var(--text-secondary)', background: 'var(--neutral-alpha-6)' }}>
            <FiX size={18} />
          </motion.button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5 p-1 rounded-xl" style={{ background: 'var(--neutral-alpha-4)' }}>
          <button
            onClick={() => { setActiveTab('infos'); setError(''); setSuccess(''); }}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'infos' ? 'shadow-sm' : 'opacity-50 hover:opacity-100'}`}
            style={activeTab === 'infos' ? { background: 'var(--bg-card)', color: 'var(--text-primary)' } : { color: 'var(--text-secondary)' }}
          >
            <FiUser size={15} /> Informations
          </button>
          <button
            onClick={() => { setActiveTab('security'); setError(''); setSuccess(''); }}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'security' ? 'shadow-sm' : 'opacity-50 hover:opacity-100'}`}
            style={activeTab === 'security' ? { background: 'var(--bg-card)', color: 'var(--text-primary)' } : { color: 'var(--text-secondary)' }}
          >
            <FiLock size={15} /> Sécurité
          </button>
        </div>

        <AnimatePresence mode="wait">
          {error && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="notice notice-error mb-4 overflow-hidden">{error}</motion.div>}
          {success && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="notice notice-success mb-4 overflow-hidden flex items-center gap-2"><FiCheck /> {success}</motion.div>}
        </AnimatePresence>

        {activeTab === 'infos' ? (
          <motion.form
            key="infos"
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
            onSubmit={handleInfoSubmit} className="space-y-4"
          >
            {/* Bloc "derniere connexion" — contexte utile quand on ouvre son compte */}
            {user?.derniere_connexion && (
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{ background: 'var(--neutral-alpha-4)', border: '1px solid var(--border-subtle)' }}
              >
                <div
                  className="icon-box icon-box-sm rounded-lg shrink-0"
                  style={{ background: 'var(--blue-alpha-8)', border: '1px solid var(--blue-alpha-12)' }}
                >
                  <FiClock size={14} style={{ color: 'var(--blue)' }} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] opacity-55" style={{ color: 'var(--text-secondary)' }}>
                    Derniere connexion
                  </p>
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }} title={formatDateTimeFr(user.derniere_connexion)}>
                    {timeAgoFr(user.derniere_connexion)}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label">Nom</label>
                <input name="nom" value={infoForm.nom} onChange={e => setInfoForm({...infoForm, nom: e.target.value})} required className="input-field" />
              </div>
              <div>
                <label className="input-label">Prénom</label>
                <input name="prenom" value={infoForm.prenom} onChange={e => setInfoForm({...infoForm, prenom: e.target.value})} required className="input-field" />
              </div>
            </div>
            <div>
              <label className="input-label">Email</label>
              <input name="email" type="email" value={infoForm.email} onChange={e => setInfoForm({...infoForm, email: e.target.value})} required className="input-field" />
            </div>
            <div className="pt-2">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading} className="btn w-full font-bold" style={{ background: 'var(--blue)', color: 'white' }}>
                {loading ? <span className="spinner spinner-sm" /> : 'Enregistrer les modifications'}
              </motion.button>
            </div>
          </motion.form>
        ) : (
          <motion.form
            key="security"
            initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
            onSubmit={handlePwdSubmit} className="space-y-4"
          >
            <div>
              <label className="input-label">Mot de passe actuel</label>
              <input type="password" value={pwdForm.currentPassword} onChange={e => setPwdForm({...pwdForm, currentPassword: e.target.value})} required className="input-field" />
            </div>
            <div>
              <label className="input-label">Nouveau mot de passe</label>
              <input type="password" value={pwdForm.newPassword} onChange={e => setPwdForm({...pwdForm, newPassword: e.target.value})} required minLength="6" className="input-field" />
            </div>
            <div>
              <label className="input-label">Confirmer nouveau mot de passe</label>
              <input type="password" value={pwdForm.confirmPassword} onChange={e => setPwdForm({...pwdForm, confirmPassword: e.target.value})} required minLength="6" className="input-field" />
            </div>
            <div className="pt-2">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading} className="btn w-full font-bold" style={{ background: 'var(--indigo)', color: 'white' }}>
                {loading ? <span className="spinner spinner-sm" /> : 'Modifier le mot de passe'}
              </motion.button>
            </div>
          </motion.form>
        )}
      </motion.div>
    </motion.div>
  );
}

export default ProfileModal;
