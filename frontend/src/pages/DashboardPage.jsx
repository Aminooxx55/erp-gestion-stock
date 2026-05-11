import { useState, useEffect, useCallback } from 'react';
import usePageTitle from '../hooks/usePageTitle';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import PageTransition from '../components/PageTransition';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import MovementsChart from '../components/MovementsChart';
import StockAnalytics from '../components/StockAnalytics';
import { SkeletonCards } from '../components/ui/Skeleton';
import { FiPackage, FiUsers, FiAlertTriangle, FiTrendingUp, FiArrowRight, FiTag, FiPlus, FiActivity, FiArrowDown, FiArrowUp, FiRefreshCw } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { timeAgoFr } from '../utils/formatDate';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};
const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 22 } }
};

function DashboardPage() {
  const { user } = useAuth();
  usePageTitle('Dashboard');
  const [stats, setStats] = useState({
    produits: 0,
    categories: 0,
    utilisateurs: 0,
    outOfStock: 0,
    underThreshold: 0,
    totalStock: 0,
    healthPercent: 100,
  });
  const [alertList, setAlertList] = useState([]);
  const [recentMvts, setRecentMvts] = useState([]);
  const [allMvts, setAllMvts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Horloge vivante dans l'en-tete (heure + minutes). On "tick" chaque minute
  // pour eviter un re-render chaque seconde.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const [produitsRes, categoriesRes] = await Promise.all([
        api.get('/produits'),
        api.get('/categories'),
      ]);
      const produits = produitsRes.data;
      const outOfStock = produits.filter((p) => Number(p.quantite) <= 0);
      const underThreshold = produits.filter((p) => Number(p.quantite) > 0 && Number(p.seuil_min) > 0 && Number(p.quantite) <= Number(p.seuil_min));
      const enAlerte = [...outOfStock, ...underThreshold];
      const totalStock = produits.reduce((sum, p) => sum + (Number(p.quantite) || 0), 0);
      const healthPercent = produits.length > 0
        ? Math.round(((produits.length - enAlerte.length) / produits.length) * 100)
        : 100;

      const newStats = {
        produits: produits.length,
        categories: categoriesRes.data.length,
        utilisateurs: 0,
        outOfStock: outOfStock.length,
        underThreshold: underThreshold.length,
        totalStock,
        healthPercent,
      };
      if (user?.role === 'admin') {
        try {
          const usersRes = await api.get('/users');
          newStats.utilisateurs = usersRes.data.length;
        } catch { /* forbidden */ }
      }
      setStats(newStats);
      setAlertList(enAlerte.slice(0, 5));

      // Fetch recent movements (admin/responsable only)
      if (user?.role === 'admin' || user?.role === 'responsable') {
        try {
          const mvtRes = await api.get('/mouvements');
          // Conserver la liste complete pour le graphe 7 jours et les sparklines,
          // et garder un sous-ensemble pour la vue "Derniers mouvements".
          setAllMvts(mvtRes.data);
          setRecentMvts(mvtRes.data.slice(0, 5));
        } catch { /* not authorized or no data */ }
      }

      setLastUpdated(new Date());
    } catch {
      // Errors are silently handled — stats remain at defaults
    }
  }, [user?.role]);

  // Chargement initial
  useEffect(() => {
    setLoading(true);
    fetchStats().finally(() => setLoading(false));
  }, [fetchStats]);

  // Rafraichissement manuel (bouton dans l'en-tete)
  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  const greeting = () => {
    const h = now.getHours();
    if (h < 12) return 'Bonjour';
    if (h < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const timeEmoji = () => {
    return '';
  };

  // Chip vivant dans l'en-tete: date + heure locale. Mis a jour chaque minute.
  const headerChip = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
    + ' · '
    + now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  // Sparklines (7 jours) calculees une seule fois a partir des mouvements.
  // Chaque serie est un array de 7 valeurs (jour le plus ancien en premier).
  const sparklines = (() => {
    if (!allMvts || allMvts.length === 0) return { entrees: [], sorties: [] };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const entrees = [];
    const sorties = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit' });
      entrees.push({ label, value: 0 });
      sorties.push({ label, value: 0 });
    }
    const firstKey = (() => {
      const d = new Date(today);
      d.setDate(today.getDate() - 6);
      return d.toISOString().slice(0, 10);
    })();
    for (const m of allMvts) {
      if (!m?.date_mouvement) continue;
      const k = new Date(m.date_mouvement).toISOString().slice(0, 10);
      if (k < firstKey) continue;
      const dayIndex = Math.round(
        (new Date(k).getTime() - new Date(firstKey).getTime()) / (24 * 60 * 60 * 1000)
      );
      if (dayIndex < 0 || dayIndex > 6) continue;
      const qty = Number(m.quantite) || 0;
      if (m.type === 'entree') entrees[dayIndex].value += qty;
      else if (m.type === 'sortie') sorties[dayIndex].value += qty;
    }
    return { entrees, sorties };
  })();

  const canSeeMovements = user?.role === 'admin' || user?.role === 'responsable';

  const cards = [
    { title: 'Produits', value: stats.produits, subtitle: 'dans le catalogue', icon: FiPackage, accent: 'blue', link: '/produits' },
    { title: 'Catégories', value: stats.categories, subtitle: 'catégories actives', icon: FiTag, accent: 'indigo', link: '/categories' },
    {
      title: 'Rupture',
      value: stats.outOfStock,
      subtitle: stats.outOfStock > 0 ? 'produits en rupture' : 'aucune rupture',
      icon: FiAlertTriangle,
      accent: stats.outOfStock > 0 ? 'danger' : 'success',
      link: '/produits',
    },
    {
      title: 'Stock faible',
      value: stats.underThreshold,
      subtitle: stats.underThreshold > 0 ? 'sous seuil minimum' : 'niveau stable',
      icon: FiActivity,
      accent: stats.underThreshold > 0 ? 'warning' : 'success',
      link: '/produits',
    },
  ];

  if (user?.role === 'admin') {
    cards.push({ title: 'Utilisateurs', value: stats.utilisateurs, subtitle: 'comptes enregistrés', icon: FiUsers, accent: 'indigo', link: '/users' });
  }

  return (
    <PageTransition>
      <div className="space-y-8">

        {/* ── Header ── */}
        <PageHeader
          chip={headerChip}
          title={`${greeting()}, ${user?.prenom}`}
          description="Voici l'état de votre inventaire en temps réel. Cliquez sur une carte pour naviguer."
          actions={
            <div className="flex items-center gap-3 self-start sm:self-auto">
              {lastUpdated && (
                <span
                  className="hidden sm:inline text-xs font-medium opacity-55"
                  style={{ color: 'var(--text-secondary)' }}
                  title={lastUpdated.toLocaleString('fr-FR')}
                >
                  Mis à jour {timeAgoFr(lastUpdated)}
                </span>
              )}
              <motion.button
                type="button"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={handleRefresh}
                disabled={refreshing || loading}
                className="btn btn-secondary"
                aria-label="Rafraîchir le dashboard"
              >
                <FiRefreshCw
                  size={15}
                  className={refreshing ? 'animate-spin' : ''}
                />
                <span className="hidden sm:inline">Rafraîchir</span>
              </motion.button>
            </div>
          }
        />

        {/* ── Stat Cards ── */}
        {loading ? (
          <SkeletonCards count={3} />
        ) : (
          <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5">
            {cards.map((card, idx) => (
              <motion.div key={idx} variants={item}>
                <StatCard {...card} loading={loading} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* ── Stock Health + Quick Actions Row ── */}
        {!loading && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-5"
          >
            {/* Stock Health */}
            <div className="card rounded-[20px] p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="icon-box icon-box-md rounded-xl" style={{
                  background: stats.healthPercent >= 80 ? 'var(--success-alpha-8)' : stats.healthPercent >= 50 ? 'var(--warning-alpha-8)' : 'var(--danger-alpha-8)',
                  border: `1px solid ${stats.healthPercent >= 80 ? 'var(--success-alpha-12)' : stats.healthPercent >= 50 ? 'var(--warning-alpha-12)' : 'var(--danger-alpha-12)'}`
                }}>
                  <FiActivity size={18} style={{
                    color: stats.healthPercent >= 80 ? 'var(--success)' : stats.healthPercent >= 50 ? 'var(--warning)' : 'var(--danger)'
                  }} />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Santé du stock</p>
                  <p className="text-xs opacity-50" style={{ color: 'var(--text-secondary)' }}>{stats.produits - (stats.outOfStock + stats.underThreshold)} / {stats.produits} produits en bon état</p>
                </div>
                <span className="ml-auto text-2xl font-extrabold tabular-nums" style={{
                  color: stats.healthPercent >= 80 ? 'var(--success)' : stats.healthPercent >= 50 ? 'var(--warning)' : 'var(--danger)'
                }}>
                  {stats.healthPercent}%
                </span>
              </div>
              {/* Progress bar */}
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--neutral-alpha-8)' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.healthPercent}%` }}
                  transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{
                    background: stats.healthPercent >= 80
                      ? 'linear-gradient(90deg, var(--success), #4ADE80)'
                      : stats.healthPercent >= 50
                      ? 'linear-gradient(90deg, var(--warning), var(--warning-light))'
                      : 'linear-gradient(90deg, var(--danger), var(--danger-light))'
                  }}
                />
              </div>
              <div className="flex justify-between mt-3">
                <span className="text-xs font-medium opacity-40" style={{ color: 'var(--text-secondary)' }}>Stock total: {stats.totalStock} unités</span>
                <span className="text-xs font-medium opacity-40" style={{ color: 'var(--text-secondary)' }}>{stats.outOfStock + stats.underThreshold} alerte(s)</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card rounded-[20px] p-6">
              <p className="text-sm font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Actions rapides</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Nouveau produit', icon: FiPlus, to: '/produits', color: 'var(--blue)' },
                  { label: 'Catégories', icon: FiTag, to: '/categories', color: 'var(--indigo)' },
                  { label: 'Voir alertes', icon: FiAlertTriangle, to: '/produits', color: 'var(--warning)' },
                  ...(user?.role === 'admin' ? [{ label: 'Utilisateurs', icon: FiUsers, to: '/users', color: 'var(--purple)' }] : [{ label: 'Stock complet', icon: FiPackage, to: '/produits', color: 'var(--success)' }]),
                ].map(({ label, icon: Icon, to, color }) => (
                  <Link key={label} to={to}>
                    <motion.div
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="action-tile flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all group"
                    >
                      <div className="icon-box icon-box-sm rounded-lg" style={{ background: `color-mix(in srgb, ${color} 12%, transparent)` }}>
                        <Icon size={15} style={{ color }} />
                      </div>
                      <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>{label}</span>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Charts row — admin/responsable only ── */}
        {!loading && canSeeMovements && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <MovementsChart mouvements={allMvts} />
            <StockAnalytics mouvements={allMvts} />
          </div>
        )}

        {/* ── Alerts + Derniers mouvements (2 colonnes, meme hauteur) ── */}
        {!loading && (alertList.length > 0 || recentMvts.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:items-stretch">

            {/* Colonne gauche: Produits en alerte — grandes lignes pleine largeur */}
            {alertList.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="card rounded-[20px] overflow-hidden flex flex-col"
                style={{ borderColor: 'var(--danger-alpha-12)' }}
              >
                {/* Header */}
                <div
                  className="flex items-center gap-3 px-6 py-4 shrink-0"
                  style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--danger-alpha-8)' }}
                >
                  <div className="icon-box icon-box-sm rounded-lg shrink-0" style={{ background: 'var(--danger-alpha-12)', border: '1px solid var(--danger-alpha-12)' }}>
                    <FiAlertTriangle size={15} style={{ color: 'var(--danger)' }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Produits en alerte</h2>
                    <p className="text-[11px] mt-0.5 opacity-55" style={{ color: 'var(--text-secondary)' }}>Sous seuil critique</p>
                  </div>
                  <span className="status-pill shrink-0" style={{ background: 'var(--danger-alpha-12)', color: 'var(--danger)', border: '1px solid var(--danger-alpha-12)' }}>
                    {stats.outOfStock + stats.underThreshold}
                  </span>
                  <Link to="/produits" className="flex items-center gap-1 text-xs font-bold transition-colors group px-2.5 py-1 rounded-lg shrink-0" style={{ color: 'var(--blue)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--blue-alpha-8)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    Voir tous <FiArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>

                {/* Lignes produits — chaque ligne prend toute la largeur, flex-1 pour repartir la hauteur */}
                <div className="flex-1 flex flex-col">
                  {alertList.map((p, i) => (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.06 }}
                      className="flex-1 flex items-center gap-4 px-6 py-5"
                      style={{ borderBottom: i < alertList.length - 1 ? '1px solid var(--border-subtle)' : 'none', minHeight: '80px' }}
                    >
                      {/* Indicateur alerte */}
                      <div className="relative shrink-0">
                        <div className="w-3 h-3 rounded-full" style={{ background: 'var(--danger)' }} />
                        <div className="absolute inset-0 w-3 h-3 rounded-full animate-ping opacity-30" style={{ background: 'var(--danger)' }} />
                      </div>

                      {/* Infos produit */}
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{p.nom}</p>
                        <p className="text-xs mt-1 opacity-50 font-mono" style={{ color: 'var(--text-secondary)' }}>{p.code}</p>
                      </div>

                      {/* Quantite + seuil */}
                      <div className="text-right shrink-0">
                        <span className="status-pill" style={{ background: 'var(--danger-alpha-8)', color: 'var(--danger)', border: '1px solid var(--danger-alpha-12)' }}>
                          {p.quantite} {p.unite}
                        </span>
                        <p className="text-[11px] mt-1.5 opacity-40" style={{ color: 'var(--text-secondary)' }}>seuil : {p.seuil_min}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Colonne droite: Derniers mouvements — meme hauteur, scrollable si depasse */}
            {recentMvts.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="card rounded-[20px] overflow-hidden flex flex-col"
              >
                {/* Header */}
                <div
                  className="flex items-center gap-3 px-6 py-4 shrink-0"
                  style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--blue-alpha-8)' }}
                >
                  <div className="icon-box icon-box-sm rounded-lg shrink-0" style={{ background: 'var(--blue-alpha-12)', border: '1px solid var(--blue-alpha-12)' }}>
                    <FiActivity size={15} style={{ color: 'var(--blue)' }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Derniers mouvements</h2>
                    <p className="text-[11px] mt-0.5 opacity-55" style={{ color: 'var(--text-secondary)' }}>Historique récent</p>
                  </div>
                  <Link to="/mouvements" className="flex items-center gap-1 text-xs font-bold transition-colors group px-2.5 py-1 rounded-lg shrink-0" style={{ color: 'var(--blue)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--blue-alpha-12)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    Tout voir <FiArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>

                {/* Liste scrollable */}
                <div className="overflow-y-auto flex-1">
                  {recentMvts.map((m, i) => {
                    const isEntree = m.type === 'entree';
                    return (
                      <motion.div
                        key={m.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.45 + i * 0.06 }}
                        className="flex items-center gap-4 px-6 py-4"
                        style={{ borderBottom: i < recentMvts.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}
                      >
                        <div className="icon-box icon-box-sm rounded-lg shrink-0" style={{
                          background: isEntree ? 'var(--success-alpha-8)' : 'var(--danger-alpha-8)',
                          border: `1px solid ${isEntree ? 'var(--success-alpha-12)' : 'var(--danger-alpha-12)'}`,
                        }}>
                          {isEntree ? <FiArrowDown size={13} style={{ color: 'var(--success)' }} /> : <FiArrowUp size={13} style={{ color: 'var(--danger)' }} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{m.Produit?.nom || '—'}</p>
                          <p className="text-[11px] mt-0.5 opacity-40 truncate" style={{ color: 'var(--text-secondary)' }}>
                            {m.User ? `${m.User.prenom} ${m.User.nom}` : '—'} · {m.reference}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-sm font-extrabold tabular-nums" style={{ color: isEntree ? 'var(--success)' : 'var(--danger)' }}>
                            {isEntree ? '+' : '-'}{m.quantite}
                          </span>
                          <p className="text-[10px] mt-0.5 opacity-40" style={{ color: 'var(--text-secondary)' }}>
                            {new Date(m.date_mouvement).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* ── Healthy state ── */}
        {!loading && alertList.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card flex items-center gap-5 rounded-[20px] p-6"
            style={{ borderColor: 'var(--success-alpha-12)' }}
          >
            <div className="icon-box icon-box-xl rounded-[14px]" style={{ background: 'var(--success-alpha-8)', border: '1px solid var(--success-alpha-12)' }}>
              <FiTrendingUp size={24} style={{ color: 'var(--success)' }} />
            </div>
            <div>
              <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Stock en bonne santé ✅</p>
              <p className="text-sm mt-1 opacity-55" style={{ color: 'var(--text-secondary)' }}>Aucun produit en dessous du seuil critique. Votre inventaire est bien géré.</p>
            </div>
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
}

export default DashboardPage;
