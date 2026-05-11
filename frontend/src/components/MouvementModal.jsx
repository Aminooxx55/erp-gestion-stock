import { useState, useEffect } from 'react';
import { FiX, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import api from '../api/axios';
import { motion } from 'framer-motion';

/**
 * Modal pour enregistrer un mouvement de stock (entrée ou sortie).
 *
 * Props:
 *   produit  — produit pré-sélectionné (si ouvert depuis la page Produits)
 *              ou null (si ouvert depuis la page Mouvements → dropdown affiché)
 *   produits — liste de tous les produits (pour le dropdown)
 *   onClose  — fermer la modal
 *   onSaved  — appelé après un enregistrement réussi
 */
function MouvementModal({ produit, produits = [], onClose, onSaved }) {
  // État du formulaire
  const [form, setForm] = useState({
    produit_id: produit?.id || '',
    type: 'entree',       // "entree" ou "sortie"
    quantite: '',
    motif: '',
    reference: '',        // Auto-générée par le backend si vide
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Bloquer le scroll de la page quand la modal est ouverte
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, []);

  // Fermer avec la touche Escape
  useEffect(() => {
    const handleEscape = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Mise à jour des champs du formulaire
  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  // --- Aperçu du stock en temps réel ---
  // On cherche le produit sélectionné pour afficher son stock actuel
  const selectedProduit = produit || produits.find((p) => p.id === form.produit_id);
  const currentStock = selectedProduit ? Number(selectedProduit.quantite) : null;
  const qty = Number(form.quantite) || 0;

  // Calcul du stock APRÈS le mouvement:
  //   Entrée → stock actuel + quantité
  //   Sortie → stock actuel - quantité
  const afterStock = currentStock !== null && qty > 0
    ? (form.type === 'entree' ? currentStock + qty : currentStock - qty)
    : null;

  // Envoi du formulaire au backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/mouvements', {
        ...form,
        quantite: Number(form.quantite),
        reference: form.reference || undefined, // Si vide → le backend génère auto
      });
      onSaved(); // Ferme la modal et rafraîchit la liste
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur serveur');
    } finally {
      setLoading(false);
    }
  };

  const isEntree = form.type === 'entree';

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
        aria-labelledby="mouvement-modal-title"
      >
        {/* Barre colorée en haut — verte pour entrée, rouge pour sortie */}
        <div className="modal-accent" style={{
          background: isEntree
            ? 'linear-gradient(90deg, var(--success), var(--success-light))'
            : 'linear-gradient(90deg, var(--danger), var(--danger-light))'
        }} />

        {/* En-tête */}
        <div className="flex items-center justify-between mb-6 mt-1">
          <h2 id="mouvement-modal-title" className="text-lg font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Nouveau mouvement
          </h2>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onClose}
            className="p-2 rounded-xl transition-colors" style={{ color: 'var(--text-secondary)', background: 'var(--neutral-alpha-6)' }}
            aria-label="Fermer la fenêtre">
            <FiX size={18} />
          </motion.button>
        </div>

        {/* Message d'erreur */}
        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="notice notice-error mb-4">
            {error}
          </motion.p>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Sélection du type: Entrée ou Sortie */}
          <div>
            <label className="input-label">Type de mouvement *</label>
            <div className="grid grid-cols-2 gap-3">
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => setForm((p) => ({ ...p, type: 'entree' }))}
                className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all"
                style={{
                  background: isEntree ? 'var(--success-alpha-15)' : 'var(--neutral-alpha-4)',
                  color: isEntree ? 'var(--success)' : 'var(--text-muted)',
                  border: `1.5px solid ${isEntree ? 'var(--success-alpha-12)' : 'var(--border)'}`,
                  boxShadow: isEntree ? '0 4px 16px rgba(100, 184, 146, 0.15)' : 'none',
                }}
              >
                <FiArrowDown size={16} /> Entrée
              </motion.button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => setForm((p) => ({ ...p, type: 'sortie' }))}
                className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all"
                style={{
                  background: !isEntree ? 'var(--danger-alpha-8)' : 'var(--neutral-alpha-4)',
                  color: !isEntree ? 'var(--danger)' : 'var(--text-muted)',
                  border: `1.5px solid ${!isEntree ? 'var(--danger-alpha-12)' : 'var(--border)'}`,
                  boxShadow: !isEntree ? '0 4px 16px rgba(216, 116, 116, 0.15)' : 'none',
                }}
              >
                <FiArrowUp size={16} /> Sortie
              </motion.button>
            </div>
          </div>

          {/* Dropdown produit — affiché uniquement si aucun produit pré-sélectionné */}
          {!produit && (
            <div>
              <label className="input-label">Produit *</label>
              <div className="relative">
                <select name="produit_id" value={form.produit_id} onChange={handleChange} required
                  className="input-field appearance-none cursor-pointer pr-10">
                  <option value="" style={{ background: 'var(--bg-surface)' }}>— Sélectionner un produit —</option>
                  {produits.map((p) => (
                    <option key={p.id} value={p.id} style={{ background: 'var(--bg-surface)' }}>
                      {p.code} — {p.nom} (stock: {p.quantite})
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-secondary)', opacity: 0.4 }}>
                  <svg width="10" height="6" viewBox="0 0 12 8" fill="none"><path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </div>
            </div>
          )}

          {/* Badge produit pré-sélectionné — affiché quand on vient de la page Produits */}
          {produit && (
            <div className="rounded-xl p-3 flex items-center gap-3" style={{ background: 'var(--neutral-alpha-4)', border: '1px solid var(--border-subtle)' }}>
              <span className="badge badge-indigo font-mono text-xs">{produit.code}</span>
              <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{produit.nom}</span>
              <span className="ml-auto text-xs font-medium opacity-50" style={{ color: 'var(--text-secondary)' }}>Stock: {produit.quantite}</span>
            </div>
          )}

          {/* Quantité et Référence */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Quantité *</label>
              <input name="quantite" type="number" min="1" value={form.quantite} onChange={handleChange}
                required placeholder="0" className="input-field" />
            </div>
            <div>
              <label className="input-label">Référence</label>
              <input name="reference" value={form.reference} onChange={handleChange}
                placeholder="Auto" className="input-field" />
            </div>
          </div>

          {/* Motif du mouvement */}
          <div>
            <label className="input-label">Motif</label>
            <input name="motif" value={form.motif} onChange={handleChange}
              placeholder="Raison du mouvement..." className="input-field" />
          </div>

          {/* Aperçu stock — montre le stock avant → après en temps réel */}
          {afterStock !== null && qty > 0 && (
            <div className="rounded-xl p-3" style={{ background: 'var(--neutral-alpha-4)', border: '1px solid var(--border-subtle)' }}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-50" style={{ color: 'var(--text-secondary)' }}>Aperçu stock</span>
                <span className="text-xs font-bold" style={{
                  color: afterStock < 0 ? 'var(--danger)' : isEntree ? 'var(--success)' : 'var(--warning)'
                }}>
                  {afterStock < 0 ? 'Stock insuffisant !' : isEntree ? 'Stock augmenté' : 'Stock réduit'}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-lg font-bold tabular-nums" style={{ color: 'var(--text-secondary)' }}>{currentStock}</span>
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>→</span>
                <span className="text-lg font-extrabold tabular-nums" style={{
                  color: afterStock < 0 ? 'var(--danger)' : isEntree ? 'var(--success)' : 'var(--text-primary)'
                }}>
                  {afterStock}
                </span>
                <span className="text-xs font-medium opacity-40 ml-1" style={{ color: 'var(--text-secondary)' }}>
                  ({isEntree ? '+' : '-'}{qty})
                </span>
              </div>
            </div>
          )}

          {/* Boutons Annuler / Enregistrer */}
          <div className="flex gap-3 pt-5 mt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <motion.button whileTap={{ scale: 0.97 }} type="button" onClick={onClose} className="flex-1 btn btn-secondary">
              Annuler
            </motion.button>
            <motion.button
              whileHover={{ boxShadow: isEntree ? '0 10px 28px rgba(100,184,146,0.3)' : '0 10px 28px rgba(216,116,116,0.3)' }}
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={loading || afterStock === null || afterStock < 0}
              className="flex-1 btn btn-primary"
              style={{
                background: isEntree
                  ? 'linear-gradient(135deg, var(--success), var(--success-light))'
                  : 'linear-gradient(135deg, var(--danger), var(--danger-light))',
                boxShadow: isEntree
                  ? '0 6px 20px rgba(100,184,146,0.2)'
                  : '0 6px 20px rgba(216,116,116,0.2)',
              }}
            >
              {loading
                ? <><span className="spinner spinner-sm" /> Traitement...</>
                : isEntree ? '✓ Enregistrer l\'entrée' : '✓ Enregistrer la sortie'
              }
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default MouvementModal;
