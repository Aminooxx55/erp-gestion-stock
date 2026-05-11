import { useEffect, useMemo, useState } from 'react';
import { FiX, FiClipboard, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';
import { motion } from 'framer-motion';
import api from '../api/axios';

function InventoryCheckModal({ produit = null, produits = [], onClose, onSaved }) {
  const [selectedId, setSelectedId] = useState(produit?.id || '');
  const [actualStock, setActualStock] = useState('');
  const [motif, setMotif] = useState('Controle inventaire');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const selectedProduit = useMemo(() => {
    if (produit) return produit;
    return produits.find((p) => p.id === selectedId) || null;
  }, [produit, produits, selectedId]);

  const theoretical = Number(selectedProduit?.quantite) || 0;
  const counted = Number(actualStock);
  const hasCount = Number.isFinite(counted) && actualStock !== '';
  const diff = hasCount ? counted - theoretical : 0;
  const needsAdjustment = hasCount && diff !== 0;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleApplyAdjustment = async () => {
    if (!selectedProduit || !needsAdjustment) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/mouvements', {
        produit_id: selectedProduit.id,
        type: diff > 0 ? 'entree' : 'sortie',
        quantite: Math.abs(diff),
        motif: `${motif} (ajustement inventaire: ${theoretical} -> ${counted})`,
      });

      setSuccess('Ajustement de stock créé avec succès.');
      onSaved?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la création de l\'ajustement.');
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
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ scale: 0.96, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, y: 16 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="modal-panel max-w-lg"
      >
        <div className="modal-accent" style={{ background: 'linear-gradient(90deg, var(--indigo), var(--blue))' }} />

        <div className="flex items-center justify-between mb-5 mt-1">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] opacity-55" style={{ color: 'var(--text-secondary)' }}>
              Inventaire léger
            </p>
            <h2 className="text-lg font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Contrôle de stock
            </h2>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="p-2 rounded-xl transition-colors"
            style={{ color: 'var(--text-secondary)', background: 'var(--neutral-alpha-6)' }}
            aria-label="Fermer"
          >
            <FiX size={18} />
          </motion.button>
        </div>

        {error && <p className="notice notice-error mb-4">{error}</p>}
        {success && <p className="notice notice-success mb-4">{success}</p>}

        <div className="space-y-4">
          {!produit && (
            <div>
              <label className="input-label">Produit</label>
              <div className="relative">
                <select
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="input-field appearance-none cursor-pointer pr-10"
                >
                  <option value="" style={{ background: 'var(--bg-surface)' }}>Sélectionner un produit</option>
                  {produits.map((p) => (
                    <option key={p.id} value={p.id} style={{ background: 'var(--bg-surface)' }}>
                      {p.code} — {p.nom}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-secondary)', opacity: 0.4 }}>
                  <svg width="10" height="6" viewBox="0 0 12 8" fill="none"><path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
              </div>
            </div>
          )}

          {selectedProduit ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl p-3" style={{ background: 'var(--neutral-alpha-4)', border: '1px solid var(--border-subtle)' }}>
                  <p className="text-[10px] uppercase font-bold tracking-[0.1em] opacity-45" style={{ color: 'var(--text-secondary)' }}>
                    Stock théorique
                  </p>
                  <p className="text-2xl font-extrabold tabular-nums mt-1" style={{ color: 'var(--text-primary)' }}>{theoretical}</p>
                </div>

                <div className="rounded-xl p-3" style={{ background: 'var(--neutral-alpha-4)', border: '1px solid var(--border-subtle)' }}>
                  <p className="text-[10px] uppercase font-bold tracking-[0.1em] opacity-45" style={{ color: 'var(--text-secondary)' }}>
                    Stock compté
                  </p>
                  <input
                    type="number"
                    min="0"
                    className="input-field mt-2"
                    value={actualStock}
                    onChange={(e) => setActualStock(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>

              {hasCount && (
                <div className="rounded-xl p-3 flex items-center justify-between" style={{
                  background: needsAdjustment ? 'var(--warning-alpha-8)' : 'var(--success-alpha-8)',
                  border: `1px solid ${needsAdjustment ? 'var(--warning-alpha-12)' : 'var(--success-alpha-12)'}`,
                }}>
                  <div className="flex items-center gap-2">
                    {needsAdjustment ? (
                      <FiAlertTriangle size={15} style={{ color: 'var(--warning)' }} />
                    ) : (
                      <FiCheckCircle size={15} style={{ color: 'var(--success)' }} />
                    )}
                    <p className="text-sm font-semibold" style={{ color: needsAdjustment ? 'var(--warning-light)' : 'var(--success-light)' }}>
                      {needsAdjustment ? 'Écart détecté' : 'Aucun écart'}
                    </p>
                  </div>
                  <p className="text-sm font-extrabold tabular-nums" style={{ color: needsAdjustment ? 'var(--warning)' : 'var(--success)' }}>
                    {diff > 0 ? '+' : ''}{diff}
                  </p>
                </div>
              )}

              <div>
                <label className="input-label">Motif</label>
                <input
                  className="input-field"
                  value={motif}
                  onChange={(e) => setMotif(e.target.value)}
                  placeholder="Contrôle inventaire"
                />
              </div>
            </>
          ) : (
            <div className="rounded-xl p-4 text-sm opacity-50" style={{ background: 'var(--neutral-alpha-4)', color: 'var(--text-secondary)' }}>
              Choisissez un produit pour démarrer le contrôle.
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-5 mt-5" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <motion.button whileTap={{ scale: 0.97 }} type="button" onClick={onClose} className="flex-1 btn btn-secondary">
            Fermer
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="button"
            disabled={!selectedProduit || !needsAdjustment || loading}
            onClick={handleApplyAdjustment}
            className="flex-1 btn btn-primary"
          >
            {loading ? <><span className="spinner spinner-sm" /> Traitement...</> : <><FiClipboard size={15} /> Créer ajustement</>}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default InventoryCheckModal;
