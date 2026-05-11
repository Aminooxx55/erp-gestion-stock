import { useEffect, useMemo, useState } from 'react';
import { FiX, FiTag, FiPackage, FiAlertTriangle, FiArrowDown, FiArrowUp } from 'react-icons/fi';
import { motion } from 'framer-motion';
import api from '../api/axios';
import { getStockStatus } from '../utils/stockStatus';

function ProductDetailsModal({ produit, onClose }) {
  const [mouvements, setMouvements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovements = async () => {
      try {
        const res = await api.get('/mouvements', { params: { produit_id: produit.id } });
        setMouvements(res.data.slice(0, 6));
      } catch {
        setMouvements([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMovements();
  }, [produit.id]);

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

  const status = useMemo(() => getStockStatus(produit), [produit]);

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
        className="modal-panel max-w-2xl"
      >
        <div className="modal-accent" style={{ background: 'linear-gradient(90deg, var(--blue), var(--indigo))' }} />

        <div className="flex items-center justify-between mb-5 mt-1">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] opacity-55" style={{ color: 'var(--text-secondary)' }}>
              Fiche produit
            </p>
            <h2 className="text-lg font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {produit.nom}
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
          <div className="card p-4 rounded-xl lg:col-span-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs opacity-45 mb-1" style={{ color: 'var(--text-secondary)' }}>Code</p>
                <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{produit.code}</p>
              </div>
              <div>
                <p className="text-xs opacity-45 mb-1" style={{ color: 'var(--text-secondary)' }}>Catégorie</p>
                <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{produit.Categorie?.nom || 'Sans catégorie'}</p>
              </div>
              <div>
                <p className="text-xs opacity-45 mb-1" style={{ color: 'var(--text-secondary)' }}>Unité</p>
                <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{produit.unite}</p>
              </div>
              <div>
                <p className="text-xs opacity-45 mb-1" style={{ color: 'var(--text-secondary)' }}>Seuil minimum</p>
                <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{produit.seuil_min}</p>
              </div>
            </div>
            {produit.description && (
              <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <p className="text-xs opacity-45 mb-1" style={{ color: 'var(--text-secondary)' }}>Description</p>
                <p className="text-sm opacity-80" style={{ color: 'var(--text-secondary)' }}>{produit.description}</p>
              </div>
            )}
          </div>

          <div className="card p-4 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold uppercase tracking-[0.1em] opacity-50" style={{ color: 'var(--text-secondary)' }}>
                Stock actuel
              </p>
              <FiPackage size={14} style={{ color: 'var(--text-muted)' }} />
            </div>
            <p className="text-3xl font-extrabold tabular-nums" style={{ color: 'var(--text-primary)' }}>
              {produit.quantite}
            </p>
            <p className="text-xs opacity-50" style={{ color: 'var(--text-secondary)' }}>{produit.unite}</p>
            <div className="mt-4">
              <span className="status-pill" style={{ background: status.bg, color: status.color, border: `1px solid ${status.border}` }}>
                {status.label}
              </span>
            </div>
          </div>
        </div>

        <div className="card rounded-xl overflow-hidden">
          <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Derniers mouvements</p>
            <FiTag size={14} style={{ color: 'var(--text-muted)' }} />
          </div>

          {loading ? (
            <div className="p-4 text-sm opacity-50" style={{ color: 'var(--text-secondary)' }}>Chargement...</div>
          ) : mouvements.length === 0 ? (
            <div className="p-4 text-sm opacity-50" style={{ color: 'var(--text-secondary)' }}>
              Aucun mouvement pour ce produit.
            </div>
          ) : (
            <div>
              {mouvements.map((m) => {
                const isEntree = m.type === 'entree';
                return (
                  <div key={m.id} className="px-4 py-3 flex items-center justify-between table-row">
                    <div className="flex items-center gap-3">
                      <div className="icon-box icon-box-sm rounded-lg" style={{
                        background: isEntree ? 'var(--success-alpha-8)' : 'var(--danger-alpha-8)',
                        border: `1px solid ${isEntree ? 'var(--success-alpha-12)' : 'var(--danger-alpha-12)'}`,
                      }}>
                        {isEntree ? <FiArrowDown size={14} style={{ color: 'var(--success)' }} /> : <FiArrowUp size={14} style={{ color: 'var(--danger)' }} />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {m.reference || 'Mouvement'}
                        </p>
                        <p className="text-xs opacity-45" style={{ color: 'var(--text-secondary)' }}>
                          {m.motif || 'Sans motif'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-extrabold tabular-nums" style={{ color: isEntree ? 'var(--success)' : 'var(--danger)' }}>
                        {isEntree ? '+' : '-'}{m.quantite}
                      </p>
                      <p className="text-[11px] opacity-45" style={{ color: 'var(--text-secondary)' }}>
                        {m.date_mouvement ? new Date(m.date_mouvement).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '—'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {status.key !== 'ok' && (
          <div className="mt-4 rounded-xl p-3 flex items-center gap-2" style={{ background: 'var(--warning-alpha-8)', border: '1px solid var(--warning-alpha-12)' }}>
            <FiAlertTriangle size={15} style={{ color: 'var(--warning)' }} />
            <p className="text-xs font-medium" style={{ color: 'var(--warning-light)' }}>
              Pour ajuster ce stock, utilisez un mouvement d'entrée/sortie ou un contrôle inventaire.
            </p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export default ProductDetailsModal;
