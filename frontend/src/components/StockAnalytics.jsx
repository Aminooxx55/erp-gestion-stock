import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { motion } from 'framer-motion';
import { FiTrendingUp } from 'react-icons/fi';
import { useState } from 'react';

/**
 * Construit une serie journaliere sur N jours avec entrees, sorties et solde net cumule.
 */
function buildDailySeries(mouvements, days = 30) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const series = [];
  const byDay = {};

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    byDay[key] = { key, label, entrees: 0, sorties: 0, net: 0 };
    series.push(byDay[key]);
  }

  for (const m of mouvements || []) {
    if (!m?.date_mouvement) continue;
    const k = new Date(m.date_mouvement).toISOString().slice(0, 10);
    if (!byDay[k]) continue;
    const qty = Number(m.quantite) || 0;
    if (m.type === 'entree') byDay[k].entrees += qty;
    else if (m.type === 'sortie') byDay[k].sorties += qty;
  }

  // Calculer le net cumule
  let cumul = 0;
  for (const day of series) {
    cumul += day.entrees - day.sorties;
    day.net = cumul;
  }

  return series;
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div
      className="px-3 py-2.5 rounded-lg text-xs"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        color: 'var(--text-primary)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
      }}
    >
      <p className="font-bold mb-2 opacity-75">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-2 py-0.5">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: p.color }} />
          <span className="opacity-60 flex-1">{p.name}</span>
          <span className="font-extrabold tabular-nums ml-3">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

export default function StockAnalytics({ mouvements = [] }) {
  const [period, setPeriod] = useState(30);
  const data = buildDailySeries(mouvements, period);
  const hasData = data.some((d) => d.entrees > 0 || d.sorties > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.32 }}
      className="card rounded-[20px] p-6"
    >
      <div className="flex items-center gap-3 mb-5">
        <div
          className="icon-box icon-box-md rounded-xl"
          style={{ background: 'var(--indigo-alpha-8)', border: '1px solid var(--indigo-alpha-12)' }}
        >
          <FiTrendingUp size={18} style={{ color: 'var(--indigo)' }} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            Analyse des mouvements
          </p>
          <p className="text-xs opacity-50" style={{ color: 'var(--text-secondary)' }}>
            Entrées, sorties et solde net cumulé
          </p>
        </div>

        {/* Period selector */}
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'var(--neutral-alpha-6)' }}>
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              onClick={() => setPeriod(d)}
              className="px-3 py-1 text-[11px] font-bold rounded-md transition-all"
              style={{
                background: period === d ? 'var(--bg-card)' : 'transparent',
                color: period === d ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: period === d ? 'var(--shadow-sm)' : 'none',
              }}
            >
              {d}j
            </button>
          ))}
        </div>
      </div>

      {hasData ? (
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer>
            <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <defs>
                <linearGradient id="gradEntrees" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--success)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--success)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradSorties" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--danger)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--danger)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradNet" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--blue)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="var(--blue)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
                tickLine={false}
                axisLine={{ stroke: 'var(--border-subtle)' }}
                interval={period <= 7 ? 0 : period <= 14 ? 1 : 4}
              />
              <YAxis
                tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                width={40}
              />
              <Tooltip content={<ChartTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                iconType="circle"
                iconSize={8}
              />
              <Area
                type="monotone"
                dataKey="entrees"
                name="Entrées"
                stroke="var(--success)"
                strokeWidth={2}
                fill="url(#gradEntrees)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
              <Area
                type="monotone"
                dataKey="sorties"
                name="Sorties"
                stroke="var(--danger)"
                strokeWidth={2}
                fill="url(#gradSorties)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
              <Area
                type="monotone"
                dataKey="net"
                name="Solde net"
                stroke="var(--blue)"
                strokeWidth={2}
                strokeDasharray="4 4"
                fill="url(#gradNet)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-[260px] flex items-center justify-center text-center">
          <div>
            <p className="text-sm font-semibold opacity-60" style={{ color: 'var(--text-secondary)' }}>
              Aucun mouvement sur cette période
            </p>
            <p className="text-xs mt-1 opacity-40" style={{ color: 'var(--text-secondary)' }}>
              Les données apparaîtront dès que des mouvements seront enregistrés.
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
