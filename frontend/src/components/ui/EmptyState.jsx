import { motion } from 'framer-motion';

/**
 * Reusable empty state with icon, title, description, and optional action.
 */
export default function EmptyState({ icon: Icon, title, description, action, iconAccent = 'blue' }) {
  const accentMap = {
    blue:   { bg: 'var(--blue-alpha-8)', border: 'var(--blue-alpha-12)', color: 'var(--blue)' },
    indigo: { bg: 'var(--indigo-alpha-8)', border: 'var(--indigo-alpha-12)', color: 'var(--indigo)' },
    danger: { bg: 'var(--danger-alpha-8)', border: 'var(--danger-alpha-12)', color: 'var(--danger)' },
  };
  const a = accentMap[iconAccent] || accentMap.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center p-16 sm:p-20 text-center"
    >
      {Icon && (
        <div
          className="icon-box icon-box-xl rounded-[20px] mb-6"
          style={{ background: a.bg, border: `1px solid ${a.border}` }}
        >
          <Icon size={32} style={{ color: a.color, opacity: 0.5 }} />
        </div>
      )}
      <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
        {title}
      </h3>
      {description && (
        <p className="text-sm opacity-50 max-w-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          {description}
        </p>
      )}
      {action && action}
    </motion.div>
  );
}
