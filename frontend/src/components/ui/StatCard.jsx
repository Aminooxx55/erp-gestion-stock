import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiArrowUpRight } from 'react-icons/fi';
import { Bar, BarChart, ResponsiveContainer, Tooltip } from 'recharts';

const accentStyles = {
  blue:    { bg: 'var(--blue-alpha-8)',    border: 'var(--blue-alpha-12)',    icon: 'var(--blue)',    glow: 'var(--glow-blue)' },
  indigo:  { bg: 'var(--indigo-alpha-8)',  border: 'var(--indigo-alpha-12)',  icon: 'var(--indigo)',  glow: 'var(--glow-indigo)' },
  purple:  { bg: 'var(--purple-alpha-8)',  border: 'var(--purple-alpha-12)',  icon: 'var(--purple)',  glow: 'rgba(138, 134, 191, 0.12)' },
  success: { bg: 'var(--success-alpha-8)', border: 'var(--success-alpha-12)', icon: 'var(--success)', glow: 'var(--glow-success)' },
  warning: { bg: 'var(--warning-alpha-8)', border: 'var(--warning-alpha-12)', icon: 'var(--warning)', glow: 'var(--glow-warning)' },
  danger:  { bg: 'var(--danger-alpha-8)',  border: 'var(--danger-alpha-12)',  icon: 'var(--danger)',  glow: 'var(--glow-danger)' },
};

/**
 * Tooltip minimaliste pour la sparkline: on ne montre que la valeur brute
 * pour que ca reste discret et pas "dashboard-lourd".
 */
function SparklineTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const { value, label } = payload[0].payload;
  return (
    <div
      className="px-2 py-1 rounded text-[11px] font-semibold"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        color: 'var(--text-primary)',
      }}
    >
      {label ? `${label}: ` : ''}{value}
    </div>
  );
}

/**
 * Reusable stat card with icon, value, subtitle, accent color.
 * Optional link wrapping for navigation.
 * Optional sparklineData: array of { label?: string, value: number }
 */
export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accent = 'blue',
  link,
  loading = false,
  sparklineData,
}) {
  const a = accentStyles[accent] || accentStyles.blue;
  const hasSparkline = Array.isArray(sparklineData) && sparklineData.length > 1;

  const content = (
    <motion.div
      whileHover={{ y: -2, scale: 1.006 }}
      whileTap={{ scale: 0.99 }}
      className="card relative rounded-[20px] p-6 overflow-hidden cursor-pointer group h-full"
      style={{ borderColor: a.border }}
    >
      {/* Hover glow */}
      <div
        className="absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: a.glow }}
      />

      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] mb-3 opacity-65" style={{ color: 'var(--text-secondary)' }}>
            {title}
          </p>
          {loading ? (
            <div className="skeleton skeleton-heading w-20 mb-3" />
          ) : (
            <p className="text-[40px] font-extrabold leading-none tabular-nums tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {value}
            </p>
          )}
          <p className="text-sm mt-3 opacity-50 font-medium" style={{ color: 'var(--text-secondary)' }}>
            {subtitle}
          </p>
        </div>
        <div className="icon-box icon-box-lg rounded-[14px]" style={{ background: a.bg, border: `1px solid ${a.border}` }}>
          <Icon size={22} style={{ color: a.icon }} />
        </div>
      </div>

      {/* Sparkline en bas de la carte — rendue seulement si on a des donnees
          pour garder les cartes sans historique visuellement identiques a avant. */}
      {hasSparkline && !loading && (
        <div className="relative z-10 mt-4 h-10 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sparklineData} margin={{ top: 2, right: 2, bottom: 0, left: 2 }} barCategoryGap={2}>
              <Tooltip
                cursor={{ fill: 'var(--neutral-alpha-6)' }}
                content={<SparklineTooltip />}
              />
              <Bar dataKey="value" fill={a.icon} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Arrow indicator on hover */}
      {link && (
        <div className="absolute bottom-5 right-5 opacity-0 group-hover:opacity-50 translate-x-2 group-hover:translate-x-0 transition-all duration-300">
          <FiArrowUpRight size={16} style={{ color: 'var(--text-secondary)' }} />
        </div>
      )}
    </motion.div>
  );

  if (link) {
    return <Link to={link} className="block">{content}</Link>;
  }
  return content;
}
