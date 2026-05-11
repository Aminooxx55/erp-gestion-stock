import { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import api from '../api/axios';
import { motion } from 'framer-motion';

// Modal for creating or editing a product
// Props:
//   produit — null for create, product object for edit
//   categories — array of categories for the dropdown
//   onClose — callback to close the modal
//   onSaved — callback after successful save
function ProductModal({ produit, categories, onClose, onSaved }) {
  const isEdit = Boolean(produit);

  const [form, setForm] = useState({
    code: '', nom: '', description: '', unite: '', seuil_min: 0, categorie_id: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Pre-fill form when editing an existing product
  useEffect(() => {
    if (isEdit) {
      setForm({
        code: produit.code, nom: produit.nom, description: produit.description || '',
        unite: produit.unite, seuil_min: produit.seuil_min,
        categorie_id: produit.categorie_id || '',
      });
    }
  }, [produit, isEdit]);

  // Lock page scroll while modal is open
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  // POST /api/produits (create) or PUT /api/produits/:id (update)
  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const payload = { ...form, seuil_min: Number(form.seuil_min), categorie_id: form.categorie_id || null };
      if (isEdit) await api.put(`/produits/${produit.id}`, payload);
      else await api.post('/produits', payload);
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
        className="modal-panel max-w-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-modal-title"
      >
        <div className="modal-accent" />

        <div className="flex items-center justify-between mb-6 mt-1">
          <h2 id="product-modal-title" className="text-lg font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {isEdit ? 'Modifier le produit' : 'Ajouter un produit'}
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
              <label className="input-label">Code *</label>
              <input name="code" value={form.code} onChange={handleChange} required className="input-field" />
            </div>
            <div>
              <label className="input-label">Unité *</label>
              <input name="unite" value={form.unite} onChange={handleChange} required placeholder="kg, litre, pièce..." className="input-field" />
            </div>
          </div>

          <div>
            <label className="input-label">Nom *</label>
            <input name="nom" value={form.nom} onChange={handleChange} required className="input-field" />
          </div>

          <div>
            <label className="input-label">Description</label>
            <input name="description" value={form.description} onChange={handleChange} className="input-field" />
          </div>

          <div>
            <label className="input-label">Seuil critique</label>
            <input name="seuil_min" type="number" min="0" value={form.seuil_min} onChange={handleChange} className="input-field" />
          </div>

          {/* Preview du niveau de stock cible */}
          {Number(form.seuil_min) > 0 && (
            <div className="rounded-xl p-3" style={{ background: 'var(--neutral-alpha-4)', border: '1px solid var(--border-subtle)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-50" style={{ color: 'var(--text-secondary)' }}>Logique stock</span>
                <span className="text-xs font-bold" style={{ color: 'var(--blue)' }}>
                  Piloté par mouvements
                </span>
              </div>
              <p className="text-xs leading-relaxed opacity-70" style={{ color: 'var(--text-secondary)' }}>
                La quantité de stock ne se modifie pas ici. Utilisez un mouvement d'entrée/sortie ou un contrôle inventaire pour ajuster le stock.
              </p>
            </div>
          )}

          <div>
            <label className="input-label">Catégorie</label>
            <div className="relative">
              <select name="categorie_id" value={form.categorie_id} onChange={handleChange}
                className="input-field appearance-none cursor-pointer pr-10">
                <option value="" style={{ background: 'var(--bg-surface)' }}>— Sans catégorie —</option>
                {categories.map((c) => <option key={c.id} value={c.id} style={{ background: 'var(--bg-surface)' }}>{c.nom}</option>)}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-secondary)', opacity: 0.4 }}>
                <svg width="10" height="6" viewBox="0 0 12 8" fill="none"><path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-5 mt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <motion.button whileTap={{ scale: 0.97 }} type="button" onClick={onClose} className="flex-1 btn btn-secondary">
              Annuler
            </motion.button>
            <motion.button
              whileHover={{ boxShadow: '0 10px 28px rgba(59,130,246,0.3)' }}
              whileTap={{ scale: 0.97 }}
              type="submit" disabled={loading}
              className="flex-1 btn btn-primary"
            >
              {loading ? <><span className="spinner spinner-sm" /> Traitement...</> : isEdit ? 'Enregistrer' : 'Ajouter le produit'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default ProductModal;
