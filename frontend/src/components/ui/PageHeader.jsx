import { motion } from 'framer-motion';

/**
 * Reusable page header with title, description, and optional action buttons.
 */
export default function PageHeader({ title, description, actions, chip }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
    >
      <div>
        {chip && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-4"
               style={{ background: 'var(--blue-alpha-8)', border: '1px solid var(--blue-alpha-15)' }}>
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--blue)', boxShadow: '0 0 6px var(--blue)' }} />
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] opacity-80" style={{ color: 'var(--blue)' }}>
              {chip}
            </p>
          </div>
        )}
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h1>
        {description && (
          <p className="text-sm mt-1.5 opacity-55 font-medium max-w-lg" style={{ color: 'var(--text-secondary)' }}>
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex gap-3 self-start sm:self-auto w-full sm:w-auto">
          {actions}
        </div>
      )}
    </motion.div>
  );
}
