import { useState, useEffect, useRef } from 'react';
import usePageTitle from '../hooks/usePageTitle';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiDownload,
  FiPackage,
  FiAlertTriangle,
  FiTag,
  FiRepeat,
  FiEye,
  FiRotateCcw,
  FiClipboard,
  FiLayers,
} from 'react-icons/fi';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ProductModal from '../components/ProductModal';
import MouvementModal from '../components/MouvementModal';
import ProductDetailsModal from '../components/ProductDetailsModal';
import InventoryCheckModal from '../components/InventoryCheckModal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { motion } from 'framer-motion';
import PageTransition from '../components/PageTransition';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import SearchInput from '../components/ui/SearchInput';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonCards, SkeletonTable } from '../components/ui/Skeleton';
import { getStockStatus } from '../utils/stockStatus';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const rowVariants = { hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0 } };
const cardItem = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 22 } } };

function ProductsPage() {
  const { user } = useAuth();
  usePageTitle('Produits');
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get('categorie_id') || searchParams.get('categorie') || '';
  const canEdit = user?.role === 'admin' || user?.role === 'responsable';
  const canDelete = user?.role === 'admin';

  const [produits, setProduits] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState(categoryParam);
  const [filterStatus, setFilterStatus] = useState('all');
  const [modal, setModal] = useState(null);
  const debounceRef = useRef(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [mouvementTarget, setMouvementTarget] = useState(null);
  const [detailTarget, setDetailTarget] = useState(null);
  const [inventoryTarget, setInventoryTarget] = useState(null);

  const fetchData = async (s, c) => {
    try {
      setError('');
      const params = {};
      if (s) params.search = s;
      if (c) params.categorie_id = c;
      const [prodRes, catRes] = await Promise.all([api.get('/produits', { params }), api.get('/categories')]);
      setProduits(prodRes.data);
      setCategories(catRes.data);
    } catch (err) { setError(err.response?.data?.message || 'Erreur chargement'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchData(search, filterCat), 300);
    return () => clearTimeout(debounceRef.current);
  }, [search, filterCat]);

  useEffect(() => {
    setFilterCat((prev) => (categoryParam === prev ? prev : categoryParam));
  }, [categoryParam]);

  const handleDelete = async () => {
    if (!confirmTarget) return;
    try { await api.delete(`/produits/${confirmTarget}`); fetchData(search, filterCat); }
    catch (err) { setError(err.response?.data?.message || 'Erreur suppression'); }
    finally { setConfirmTarget(null); }
  };

  const handleExportCSV = async () => {
    try {
      const response = await api.get('/produits/export/csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url; link.setAttribute('download', 'produits.csv');
      document.body.appendChild(link); link.click(); link.remove();
    } catch (err) { setError(err.response?.data?.message || 'Erreur export'); }
  };

  const handleSaved = () => { setModal(null); fetchData(search, filterCat); };

  // Stats
  const outOfStockCount = produits.filter((p) => Number(p.quantite) <= 0).length;
  const lowStockCount = produits.filter((p) => Number(p.quantite) > 0 && Number(p.seuil_min) > 0 && Number(p.quantite) <= Number(p.seuil_min)).length;
  const categoriesUsed = new Set(produits.map(p => p.categorie_id).filter(Boolean)).size;

  const filteredProduits = produits.filter((p) => {
    if (filterStatus === 'all') return true;
    return getStockStatus(p).key === filterStatus;
  });

  const hasActiveFilters = Boolean(search) || Boolean(filterCat) || filterStatus !== 'all';

  const handleResetFilters = () => {
    setSearch('');
    setFilterCat('');
    setFilterStatus('all');
  };

  // Stock level percentage relative to seuil_min
  const getStockLevel = (p) => {
    if (!p.seuil_min || p.seuil_min === 0) return 100;
    const ratio = (p.quantite / (p.seuil_min * 3)) * 100;
    return Math.min(100, Math.max(0, ratio));
  };

  return (
    <PageTransition>
      <div className="space-y-7">

        {/* Header */}
        <PageHeader
          title="Produits"
          description={`${produits.length} produit(s) enregistré(s)`}
          actions={
            <>
              {canEdit && (
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setInventoryTarget('global')}
                  className="btn btn-secondary flex-1 sm:flex-none">
                  <FiClipboard size={16} /> Contrôle inventaire
                </motion.button>
              )}
              {canEdit && (
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleExportCSV}
                  className="btn btn-secondary flex-1 sm:flex-none">
                  <FiDownload size={16} /> Export
                </motion.button>
              )}
              {canEdit && (
                <motion.button whileHover={{ scale: 1.02, boxShadow: '0 12px 32px rgba(59,130,246,0.3)' }} whileTap={{ scale: 0.98 }}
                  onClick={() => setModal('create')} className="btn btn-primary flex-[2] sm:flex-none">
                  <FiPlus size={18} /> Nouveau produit
                </motion.button>
              )}
            </>
          }
        />

        {/* Stat Cards */}
        {loading ? <SkeletonCards count={3} /> : (
          <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: 'Total produits', value: produits.length, subtitle: 'dans le catalogue', icon: FiPackage, accent: 'blue', link: null },
              { title: 'Rupture', value: outOfStockCount, subtitle: outOfStockCount > 0 ? 'produits a reapprovisionner' : 'aucune rupture', icon: FiLayers, accent: outOfStockCount > 0 ? 'danger' : 'success' },
              { title: 'Stock faible', value: lowStockCount, subtitle: lowStockCount > 0 ? 'sous seuil minimum' : 'niveau stable', icon: FiAlertTriangle, accent: lowStockCount > 0 ? 'warning' : 'success' },
              { title: 'Catégories', value: categoriesUsed, subtitle: 'catégories utilisées', icon: FiTag, accent: 'indigo' },
            ].map((card, i) => (
              <motion.div key={i} variants={cardItem}><StatCard {...card} /></motion.div>
            ))}
          </motion.div>
        )}

        {/* Filters */}
        <div className="card p-4 rounded-[16px]">
          <div className="flex flex-col lg:flex-row gap-4">
            <SearchInput value={search} onChange={setSearch} placeholder="Rechercher par nom, code..." className="flex-1" />

            <div className="relative w-full sm:w-60">
              <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)}
                className="input-field appearance-none cursor-pointer pr-10">
                <option value="" style={{ background: 'var(--bg-surface)' }}>Toutes Catégories</option>
                {categories.map((c) => <option key={c.id} value={c.id} style={{ background: 'var(--bg-surface)' }}>{c.nom}</option>)}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-secondary)', opacity: 0.4 }}>
                <svg width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M1.5 1.5L6 6L10.5 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </div>

            <div className="relative w-full sm:w-56">
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                className="input-field appearance-none cursor-pointer pr-10">
                <option value="all" style={{ background: 'var(--bg-surface)' }}>Tous statuts</option>
                <option value="ok" style={{ background: 'var(--bg-surface)' }}>Stock normal</option>
                <option value="low" style={{ background: 'var(--bg-surface)' }}>Stock faible</option>
                <option value="out" style={{ background: 'var(--bg-surface)' }}>Rupture</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-secondary)', opacity: 0.4 }}>
                <svg width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M1.5 1.5L6 6L10.5 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleResetFilters}
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
            <SkeletonTable rows={6} cols={5} />
          ) : filteredProduits.length === 0 ? (
            <EmptyState
              icon={FiPackage}
              title={hasActiveFilters ? 'Aucun résultat pour ces filtres' : 'Aucun produit trouvé'}
              description={hasActiveFilters ? 'Essayez une autre catégorie, statut ou recherche.' : 'Ajoutez votre premier produit puis enregistrez les mouvements de stock.'}
              action={canEdit && (
                hasActiveFilters ? (
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={handleResetFilters} className="btn btn-secondary btn-sm">
                    <FiRotateCcw size={16} /> Réinitialiser les filtres
                  </motion.button>
                ) : (
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => setModal('create')} className="btn btn-primary btn-sm">
                    <FiPlus size={16} /> Nouveau produit
                  </motion.button>
                )
              )}
            />
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm whitespace-nowrap">
                  <thead>
                    <tr className="table-head">
                      {['Code', 'Produit', 'Catégorie', 'Stock', 'Statut', 'Niveau'].map(h => (
                        <th key={h} className="table-header-cell">{h}</th>
                      ))}
                      {(canEdit || canDelete) && <th className="table-header-cell text-right">Actions</th>}
                    </tr>
                  </thead>
                  <motion.tbody variants={container} initial="hidden" animate="show">
                    {filteredProduits.map((p) => {
                      const status = getStockStatus(p);
                      const level = getStockLevel(p);
                      return (
                        <motion.tr key={p.id} variants={rowVariants} className="table-row group">
                          <td className="table-cell">
                            <span className="badge badge-indigo font-mono text-xs">{p.code}</span>
                          </td>
                          <td className="table-cell">
                            <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{p.nom}</p>
                            <p className="text-xs mt-0.5 opacity-40" style={{ color: 'var(--text-secondary)' }}>{p.unite}</p>
                          </td>
                          <td className="table-cell">
                            <span className="badge badge-neutral text-xs">{p.Categorie?.nom || '—'}</span>
                          </td>
                          <td className="table-cell">
                            <span className="status-pill" style={{ background: status.bg, color: status.color, border: `1px solid ${status.border}` }}>
                              <span className={`status-dot ${status.pulse ? 'animate-pulse' : ''}`} style={{ background: status.color }} />
                              {p.quantite}
                            </span>
                            {(status.key === 'low' || status.key === 'out') && (
                              <p className="text-[10px] mt-1 opacity-40" style={{ color: 'var(--text-secondary)' }}>seuil: {p.seuil_min}</p>
                            )}
                          </td>
                          <td className="table-cell">
                            <span className="status-pill" style={{ background: status.bg, color: status.color, border: `1px solid ${status.border}` }}>
                              {status.shortLabel}
                            </span>
                          </td>
                          <td className="table-cell" style={{ minWidth: '120px' }}>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--neutral-alpha-8)' }}>
                                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${level}%`, background: status.color }} />
                              </div>
                              <span className="text-[10px] font-bold tabular-nums w-8 text-right" style={{ color: status.color }}>{Math.round(level)}%</span>
                            </div>
                          </td>
                          {(canEdit || canDelete) && (
                            <td className="table-cell">
                              <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => setDetailTarget(p)}
                                  className="p-2.5 rounded-xl text-[#94A3B8] hover:text-[#3B82F6] hover:bg-[rgba(59,130,246,0.08)] transition-all"
                                  title="Détails produit">
                                  <FiEye size={16} />
                                </motion.button>
                                {canEdit && (
                                  <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => setInventoryTarget(p)}
                                    className="p-2.5 rounded-xl text-[#94A3B8] hover:text-[var(--warning)] hover:bg-[rgba(212,165,86,0.08)] transition-all"
                                    title="Contrôle inventaire">
                                    <FiClipboard size={16} />
                                  </motion.button>
                                )}
                                {canEdit && (
                                  <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => setMouvementTarget(p)}
                                    className="p-2.5 rounded-xl text-[#94A3B8] hover:text-[var(--success)] hover:bg-[rgba(100,184,146,0.08)] transition-all"
                                    title="Mouvement de stock">
                                    <FiRepeat size={16} />
                                  </motion.button>
                                )}
                                {canEdit && (
                                  <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => setModal(p)}
                                    className="p-2.5 rounded-xl text-[#94A3B8] hover:text-[#3B82F6] hover:bg-[rgba(59,130,246,0.08)] transition-all">
                                    <FiEdit2 size={16} />
                                  </motion.button>
                                )}
                                {canDelete && (
                                  <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => setConfirmTarget(p.id)}
                                    className="p-2.5 rounded-xl text-[#94A3B8] hover:text-[#EF4444] hover:bg-[rgba(239,68,68,0.08)] transition-all">
                                    <FiTrash2 size={16} />
                                  </motion.button>
                                )}
                              </div>
                            </td>
                          )}
                        </motion.tr>
                      );
                    })}
                  </motion.tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="md:hidden">
                <motion.div variants={container} initial="hidden" animate="show">
                  {filteredProduits.map((p) => {
                    const status = getStockStatus(p);
                    const level = getStockLevel(p);
                    return (
                      <motion.div key={p.id} variants={rowVariants} className="p-5 table-row">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <span className="badge badge-indigo font-mono text-[10px] mb-2 inline-block">{p.code}</span>
                            <h3 className="font-bold text-lg leading-tight" style={{ color: 'var(--text-primary)' }}>{p.nom}</h3>
                            <p className="text-xs mt-1 opacity-50" style={{ color: 'var(--text-secondary)' }}>{p.Categorie?.nom || 'Sans catégorie'}</p>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="status-pill" style={{ background: status.bg, color: status.color, border: `1px solid ${status.border}` }}>
                              {p.quantite}
                            </span>
                            <span className="uppercase tracking-wide font-bold opacity-40 mt-1" style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>{status.shortLabel}</span>
                          </div>
                        </div>
                        {/* Mini progress bar */}
                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--neutral-alpha-8)' }}>
                            <div className="h-full rounded-full" style={{ width: `${level}%`, background: status.color }} />
                          </div>
                          <span className="text-[10px] font-bold" style={{ color: status.color }}>{status.label}</span>
                        </div>
                        {(canEdit || canDelete) && (
                          <div className="flex gap-2 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                            <motion.button whileTap={{ scale: 0.95 }} onClick={() => setDetailTarget(p)}
                              className="flex-1 btn btn-sm" style={{ background: 'var(--indigo-alpha-8)', color: 'var(--indigo)', border: '1px solid var(--indigo-alpha-12)' }}>
                              <FiEye size={14} /> Détails
                            </motion.button>
                            {canEdit && (
                              <motion.button whileTap={{ scale: 0.95 }} onClick={() => setInventoryTarget(p)}
                                className="flex-1 btn btn-sm" style={{ background: 'var(--warning-alpha-8)', color: 'var(--warning)', border: '1px solid var(--warning-alpha-12)' }}>
                                <FiClipboard size={14} /> Inventaire
                              </motion.button>
                            )}
                            {canEdit && (
                              <motion.button whileTap={{ scale: 0.95 }} onClick={() => setMouvementTarget(p)}
                                className="flex-1 btn btn-sm" style={{ background: 'var(--success-alpha-8)', color: 'var(--success)', border: '1px solid var(--success-alpha-12)' }}>
                                <FiRepeat size={14} /> Mouvement
                              </motion.button>
                            )}
                            {canEdit && (
                              <motion.button whileTap={{ scale: 0.95 }} onClick={() => setModal(p)}
                                className="flex-1 btn btn-sm" style={{ background: 'var(--blue-alpha-8)', color: 'var(--blue)', border: '1px solid var(--blue-alpha-12)' }}>
                                <FiEdit2 size={14} /> Modifier
                              </motion.button>
                            )}
                            {canDelete && (
                              <motion.button whileTap={{ scale: 0.95 }} onClick={() => setConfirmTarget(p.id)}
                                className="flex-1 btn btn-sm btn-danger">
                                <FiTrash2 size={14} /> Supprimer
                              </motion.button>
                            )}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </motion.div>
              </div>
            </>
          )}
        </div>

        {modal && <ProductModal produit={modal === 'create' ? null : modal} categories={categories} onClose={() => setModal(null)} onSaved={handleSaved} />}

        {detailTarget && (
          <ProductDetailsModal
            produit={detailTarget}
            onClose={() => setDetailTarget(null)}
          />
        )}

        {inventoryTarget && (
          <InventoryCheckModal
            produit={inventoryTarget === 'global' ? null : inventoryTarget}
            produits={inventoryTarget === 'global' ? produits : []}
            onClose={() => setInventoryTarget(null)}
            onSaved={() => {
              setInventoryTarget(null);
              fetchData(search, filterCat);
            }}
          />
        )}

        {mouvementTarget && (
          <MouvementModal
            produit={mouvementTarget}
            onClose={() => setMouvementTarget(null)}
            onSaved={() => { setMouvementTarget(null); fetchData(search, filterCat); }}
          />
        )}

        <ConfirmDialog
          open={!!confirmTarget}
          title="Supprimer ce produit ?"
          description="Cette action est irréversible. Le produit sera définitivement supprimé."
          confirmLabel="Supprimer"
          danger
          onConfirm={handleDelete}
          onCancel={() => setConfirmTarget(null)}
        />
      </div>
    </PageTransition>
  );
}

export default ProductsPage;
