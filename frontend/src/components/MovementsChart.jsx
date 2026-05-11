import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { motion } from 'framer-motion';
import { FiBarChart2 } from 'react-icons/fi';

/**
 * Genere un tableau de 7 jours (du plus ancien au plus recent)
 * avec les entrees/sorties agregees. Les jours sans mouvement restent
 * presents (valeur 0) pour eviter un graphique "trou".
 */
function buildDailySeries(mouvements, days = 7) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const series = [];
  const byDay = {};

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit' });
    byDay[key] = { key, label, entrees: 0, sorties: 0 };
    series.push(byDay[key]);
  }

  for (const m of mouvements || []) {
    if (!m?.date_mouvement) continue;
    const d = new Date(m.date_mouvement);
    const key = d.toISOString().slice(0, 10);
    if (!byDay[key]) continue;
    const qty = Number(m.quantite) || 0;
    if (m.type === 'entree') byDay[key].entrees += qty;
    else if (m.type === 'sortie') byDay[key].sorties += qty;
  }

  return series;
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div
      className="px-3 py-2 rounded-lg text-xs"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        color: 'var(--text-primary)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
      }}
    >
      <p className="font-bold mb-1.5 opacity-75">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-sm" style={{ background: p.color }} />
          <span className="opacity-60">{p.name}:</span>
          <span className="font-extrabold tabular-nums ml-auto">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

export default function MovementsChart({ mouvements = [] }) {
  const data = buildDailySeries(mouvements, 7);
  const hasData = data.some((d) => d.entrees > 0 || d.sorties > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="card rounded-[20px] p-6"
    >
      <div className="flex items-center gap-3 mb-5">
        <div
          className="icon-box icon-box-md rounded-xl"
          style={{ background: 'var(--blue-alpha-8)', border: '1px solid var(--blue-alpha-12)' }}
        >
          <FiBarChart2 size={18} style={{ color: 'var(--blue)' }} />
        </div>
        <div>
          <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            Mouvements des 7 derniers jours
          </p>
          <p className="text-xs opacity-50" style={{ color: 'var(--text-secondary)' }}>
            Entrees vs sorties par jour
          </p>
        </div>
      </div>

      {hasData ? (
        <div style={{ width: '100%', height: 220 }}>
          <ResponsiveContainer>
            <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: 'var(--border-subtle)' }}
              />
              <YAxis
                tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                width={40}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--neutral-alpha-4)' }} />
              <Legend
                wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
                iconType="circle"
              />
              <Bar dataKey="entrees" name="Entrees" fill="var(--success)" radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Bar dataKey="sorties" name="Sorties" fill="var(--danger)" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-[220px] flex items-center justify-center text-center">
          <div>
            <p className="text-sm font-semibold opacity-60" style={{ color: 'var(--text-secondary)' }}>
              Aucun mouvement sur les 7 derniers jours
            </p>
            <p className="text-xs mt-1 opacity-40" style={{ color: 'var(--text-secondary)' }}>
              Les entrees et sorties apparaitront ici des qu&apos;elles seront enregistrees.
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
