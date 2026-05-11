import { useState, useEffect } from 'react';
import usePageTitle from '../hooks/usePageTitle';
import { FiPlus, FiRepeat, FiArrowDown, FiArrowUp, FiDownload, FiRotateCcw, FiClipboard } from 'react-icons/fi';
import api from '../api/axios';
import MouvementModal from '../components/MouvementModal';
import InventoryCheckModal from '../components/InventoryCheckModal';
import { motion } from 'framer-motion';
import PageTransition from '../components/PageTransition';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import SearchInput from '../components/ui/SearchInput';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonCards, SkeletonTable } from '../components/ui/Skeleton';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const rowVariants = { hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0 } };
const cardItem = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 22 } } };

function MouvementsPage() {
  usePageTitle('Mouvements');
  const [mouvements, setMouvements] = useState([]);
  const [produits, setProduits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [modal, setModal] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);

  const fetchData = async () => {
    try {
      setError('');
      const [mvtRes, prodRes] = await Promise.all([
        api.get('/mouvements'),
        api.get('/produits'),
      ]);
      setMouvements(mvtRes.data);
      setProduits(prodRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSaved = () => { setModal(false); fetchData(); };

  // Export CSV des mouvements pour reporting / archivage
  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.append('type', typeFilter);
      
      const now = new Date();
      if (periodFilter === 'today') {
        const todayStr = now.toISOString().split('T')[0];
        params.append('date_debut', todayStr);
        params.append('date_fin', todayStr);
      } else if (periodFilter === '7days') {
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(now.getDate() - 7);
        params.append('date_debut', sevenDaysAgo.toISOString().split('T')[0]);
        params.append('date_fin', now.toISOString().split('T')[0]);
      } else if (periodFilter === 'thisMonth') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day
        params.append('date_debut', startOfMonth.toISOString().split('T')[0]);
        params.append('date_fin', endOfMonth.toISOString().split('T')[0]);
      } else if (periodFilter === 'month' && selectedMonth) {
        const [y, m] = selectedMonth.split('-').map(Number);
        const startOfMonth = new Date(y, m - 1, 1);
        const endOfMonth = new Date(y, m, 0);
        params.append('date_debut', startOfMonth.toISOString().split('T')[0]);
        params.append('date_fin', endOfMonth.toISOString().split('T')[0]);
      }

      const queryString = params.toString() ? `?${params.toString()}` : '';
      const response = await api.get(`/mouvements/export/csv${queryString}`, { responseType: 'blob' });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'mouvements.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur export');
    }
  };

  // Stats
  const entreesCount = mouvements.filter((m) => m.type === 'entree').length;
  const sortiesCount = mouvements.filter((m) => m.type === 'sortie').length;

  // Filtre date: presets + mois spécifique
  const matchesPeriodFilter = (rawDate) => {
    if (periodFilter === 'all') return true;
    if (!rawDate) return false;

    const movementDate = new Date(rawDate);
    if (Number.isNaN(movementDate.getTime())) return false;

    const now = new Date();

    if (periodFilter === 'today') {
      return movementDate.toDateString() === now.toDateString();
    }

    if (periodFilter === '7days') {
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 7);
      return movementDate >= sevenDaysAgo;
    }

    if (periodFilter === 'thisMonth') {
      return (
        movementDate.getFullYear() === now.getFullYear()
        && movementDate.getMonth() === now.getMonth()
      );
    }

    if (periodFilter === 'month') {
      if (!selectedMonth) return true;
      const [year, month] = selectedMonth.split('-').map(Number);
      if (!year || !month) return true;
      return (
        movementDate.getFullYear() === year
        && movementDate.getMonth() + 1 === month
      );
    }

    return true;
  };

  // Filtrage combiné: texte + type + période
  const filtered = mouvements.filter((m) => {
    if (typeFilter !== 'all' && m.type !== typeFilter) return false;
    if (!matchesPeriodFilter(m.date_mouvement)) return false;
    if (!search) return true;

    const q = search.toLowerCase();
    return (
      m.reference?.toLowerCase().includes(q) ||
      m.motif?.toLowerCase().includes(q) ||
      m.Produit?.nom?.toLowerCase().includes(q) ||
      m.Produit?.code?.toLowerCase().includes(q) ||
      m.User?.nom?.toLowerCase().includes(q) ||
      m.User?.prenom?.toLowerCase().includes(q)
    );
  });

  const hasActiveFilters = Boolean(search) || typeFilter !== 'all' || periodFilter !== 'all';

  const resetFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setPeriodFilter('all');
  };

  // Format date
  const formatDate = (d) => {
    if (!d) return '—';
    const date = new Date(d);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
      + ' ' + date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <PageTransition>
      <div className="space-y-7">

        {/* Header */}
        <PageHeader
          title="Mouvements de stock"
          description={`${filtered.length} affiché(s) sur ${mouvements.length} mouvement(s)`}
          actions={
            <>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setInventoryOpen(true)}
                className="btn btn-secondary flex-1 sm:flex-none"
              >
                <FiClipboard size={16} /> Contrôle inventaire
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleExportCSV}
                className="btn btn-secondary flex-1 sm:flex-none"
              >
                <FiDownload size={16} /> Export CSV
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: '0 12px 32px rgba(59,130,246,0.3)' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setModal(true)}
                className="btn btn-primary flex-[2] sm:flex-none"
              >
                <FiPlus size={18} /> Nouveau mouvement
              </motion.button>
            </>
          }
        />

        {/* Stat Cards */}
        {loading ? <SkeletonCards count={3} /> : (
          <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { title: 'Total', value: mouvements.length, subtitle: 'mouvements enregistrés', icon: FiRepeat, accent: 'blue' },
              { title: 'Entrées', value: entreesCount, subtitle: 'entrées de stock', icon: FiArrowDown, accent: 'success' },
              { title: 'Sorties', value: sortiesCount, subtitle: 'sorties de stock', icon: FiArrowUp, accent: sortiesCount > 0 ? 'warning' : 'success' },
            ].map((card, i) => (
              <motion.div key={i} variants={cardItem}><StatCard {...card} /></motion.div>
            ))}
          </motion.div>
        )}

        {/* Filtres: recherche + type + période */}
        <div className="flex flex-col lg:flex-row gap-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Rechercher par produit, référence, motif..."
            className="flex-1"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex gap-4 w-full lg:w-auto">
            <div className="relative w-full sm:min-w-[180px]">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="input-field appearance-none cursor-pointer pr-10"
              >
                <option value="all" style={{ background: 'var(--bg-surface)' }}>Tous types</option>
                <option value="entree" style={{ background: 'var(--bg-surface)' }}>Entrées uniquement</option>
                <option value="sortie" style={{ background: 'var(--bg-surface)' }}>Sorties uniquement</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-secondary)', opacity: 0.4 }}>
                <svg width="10" height="6" viewBox="0 0 12 8" fill="none"><path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
            </div>

            <div className="relative w-full sm:min-w-[190px]">
              <select
                value={periodFilter}
                onChange={(e) => setPeriodFilter(e.target.value)}
                className="input-field appearance-none cursor-pointer pr-10"
              >
                <option value="all" style={{ background: 'var(--bg-surface)' }}>Toutes périodes</option>
                <option value="today" style={{ background: 'var(--bg-surface)' }}>Aujourd&apos;hui</option>
                <option value="7days" style={{ background: 'var(--bg-surface)' }}>7 derniers jours</option>
                <option value="thisMonth" style={{ background: 'var(--bg-surface)' }}>Mois en cours</option>
                <option value="month" style={{ background: 'var(--bg-surface)' }}>Mois spécifique</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-secondary)', opacity: 0.4 }}>
                <svg width="10" height="6" viewBox="0 0 12 8" fill="none"><path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
            </div>

            {periodFilter === 'month' && (
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="input-field w-full sm:min-w-[170px]"
              />
            )}

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={resetFilters}
              className="btn btn-secondary"
              disabled={!hasActiveFilters}
            >
              <FiRotateCcw size={14} /> Réinitialiser
            </motion.button>
          </div>
        </div>

        {error && <div className="notice notice-error">{error}</div>}

        {/* Table */}
        <div className="card rounded-[20px] overflow-hidden">
          {loading ? (
            <SkeletonTable rows={6} cols={6} />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={FiRepeat}
              title="Aucun mouvement trouvé"
              description={hasActiveFilters ? 'Ajustez vos filtres (texte, type ou période).' : 'Enregistrez votre premier mouvement de stock.'}
              action={!hasActiveFilters && (
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => setModal(true)} className="btn btn-primary btn-sm">
                  <FiPlus size={16} /> Nouveau mouvement
                </motion.button>
              )}
            />
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm whitespace-nowrap">
                  <thead>
                    <tr className="table-head">
                      {['Référence', 'Produit', 'Type', 'Quantité', 'Motif', 'Par', 'Date'].map((h) => (
                        <th key={h} className="table-header-cell">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <motion.tbody variants={container} initial="hidden" animate="show">
                    {filtered.map((m) => {
                      const isEntree = m.type === 'entree';
                      return (
                        <motion.tr key={m.id} variants={rowVariants} className="table-row">
                          <td className="table-cell">
                            <span className="badge badge-neutral font-mono text-xs">{m.reference || '—'}</span>
                          </td>
                          <td className="table-cell">
                            <div>
                              <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{m.Produit?.nom || '—'}</p>
                              <p className="text-xs mt-0.5 opacity-40" style={{ color: 'var(--text-secondary)' }}>{m.Produit?.code}</p>
                            </div>
                          </td>
                          <td className="table-cell">
                            <span className={`status-pill ${isEntree ? 'badge-success' : 'badge-danger'}`}>
                              <span className={`status-dot`} style={{ background: isEntree ? 'var(--success)' : 'var(--danger)' }} />
                              {isEntree ? 'Entrée' : 'Sortie'}
                            </span>
                          </td>
                          <td className="table-cell">
                            <span className="text-sm font-extrabold tabular-nums" style={{ color: isEntree ? 'var(--success)' : 'var(--danger)' }}>
                              {isEntree ? '+' : '-'}{m.quantite}
                            </span>
                            <span className="text-xs ml-1 opacity-40" style={{ color: 'var(--text-secondary)' }}>{m.Produit?.unite}</span>
                          </td>
                          <td className="table-cell">
                            <span className="text-sm opacity-55" style={{ color: 'var(--text-secondary)' }}>{m.motif || '—'}</span>
                          </td>
                          <td className="table-cell">
                            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                              {m.User ? `${m.User.prenom} ${m.User.nom}` : '—'}
                            </span>
                          </td>
                          <td className="table-cell">
                            <span className="text-xs opacity-50" style={{ color: 'var(--text-secondary)' }}>{formatDate(m.date_mouvement)}</span>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </motion.tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden">
                <motion.div variants={container} initial="hidden" animate="show">
                  {filtered.map((m) => {
                    const isEntree = m.type === 'entree';
                    return (
                      <motion.div key={m.id} variants={rowVariants} className="p-5 table-row">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <span className="badge badge-neutral font-mono text-[10px] mb-2 inline-block">{m.reference}</span>
                            <h3 className="font-bold text-lg leading-tight" style={{ color: 'var(--text-primary)' }}>{m.Produit?.nom || '—'}</h3>
                            <p className="text-xs mt-1 opacity-50" style={{ color: 'var(--text-secondary)' }}>
                              {m.User ? `Par ${m.User.prenom} ${m.User.nom}` : ''}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className={`status-pill ${isEntree ? 'badge-success' : 'badge-danger'}`}>
                              {isEntree ? 'Entrée' : 'Sortie'}
                            </span>
                            <span className="text-lg font-extrabold tabular-nums" style={{ color: isEntree ? 'var(--success)' : 'var(--danger)' }}>
                              {isEntree ? '+' : '-'}{m.quantite}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs opacity-40" style={{ color: 'var(--text-secondary)' }}>
                          <span>{m.motif || 'Aucun motif'}</span>
                          <span>{formatDate(m.date_mouvement)}</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </div>
            </>
          )}
        </div>

        {/* Modal */}
        {modal && (
          <MouvementModal
            produit={null}
            produits={produits}
            onClose={() => setModal(false)}
            onSaved={handleSaved}
          />
        )}

        {inventoryOpen && (
          <InventoryCheckModal
            produit={null}
            produits={produits}
            onClose={() => setInventoryOpen(false)}
            onSaved={() => {
              setInventoryOpen(false);
              fetchData();
            }}
          />
        )}
      </div>
    </PageTransition>
  );
}

export default MouvementsPage;
