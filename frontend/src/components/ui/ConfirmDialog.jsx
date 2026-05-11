import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertTriangle } from 'react-icons/fi';

/**
 * Reusable confirm dialog — replaces native confirm().
 * Usage:
 *   <ConfirmDialog
 *     open={showConfirm}
 *     title="Supprimer ce produit ?"
 *     description="Cette action est irréversible."
 *     confirmLabel="Supprimer"
 *     danger
 *     onConfirm={handleConfirm}
 *     onCancel={() => setShowConfirm(false)}
 *   />
 */
export default function ConfirmDialog({ open, title, description, confirmLabel = 'Confirmer', danger = false, onConfirm, onCancel }) {

  // Lock page scroll while dialog is open
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handleEscape = (e) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="modal-overlay"
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="modal-panel"
            style={{ maxWidth: '420px' }}
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-desc"
          >
            <div className="modal-accent" />

            <div className="flex items-start gap-4 mb-6">
              <div
                className="icon-box icon-box-lg rounded-xl shrink-0"
                style={{
                  background: danger ? 'var(--danger-alpha-8)' : 'var(--warning-alpha-8)',
                  border: `1px solid ${danger ? 'var(--danger-alpha-12)' : 'var(--warning-alpha-12)'}`,
                }}
              >
                <FiAlertTriangle size={22} style={{ color: danger ? 'var(--danger)' : 'var(--warning)' }} />
              </div>
              <div>
                <h3 id="confirm-dialog-title" className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
                {description && (
                  <p id="confirm-dialog-desc" className="text-sm mt-1.5 opacity-60" style={{ color: 'var(--text-secondary)' }}>{description}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button className="btn btn-secondary btn-sm" onClick={onCancel}>
                Annuler
              </button>
              <button
                className={`btn btn-sm ${danger ? 'btn-danger' : 'btn-primary'}`}
                onClick={onConfirm}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
