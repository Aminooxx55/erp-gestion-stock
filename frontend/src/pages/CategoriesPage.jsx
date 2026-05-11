import { useState, useEffect } from 'react';
import usePageTitle from '../hooks/usePageTitle';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiEdit2, FiTrash2, FiCheck, FiX, FiTag, FiPackage, FiEye, FiLayers, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from '../components/PageTransition';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import SearchInput from '../components/ui/SearchInput';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { SkeletonCards, SkeletonTable } from '../components/ui/Skeleton';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 22 } } };
const rowVariants = { hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0 } };

function CategoriesPage() {
  const { user } = useAuth();
  usePageTitle('Catégories');
  const navigate = useNavigate();
  const canCreate = user?.role === 'admin' || user?.role === 'responsable';
  const canDelete = user?.role === 'admin';

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ nom: '', description: '' });
  const [newForm, setNewForm] = useState({ nom: '', description: '' });
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [confirmTarget, setConfirmTarget] = useState(null);

  const fetchCategories = async () => {
    try {
      setError('');
      const { data } = await api.get('/categories');
      setCategories(data);
    } catch (err) { setError(err.response?.data?.message || 'Erreur chargement'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchCategories(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault(); setError('');
    if (!newForm.nom.trim()) { setError('Le nom est obligatoire'); return; }
    try { await api.post('/categories', newForm); setNewForm({ nom: '', description: '' }); setShowNew(false); fetchCategories(); }
    catch (err) { setError(err.response?.data?.message || 'Erreur serveur'); }
  };

  const handleEdit = async (e) => {
    e.preventDefault(); setError('');
    try { await api.put(`/categories/${editing}`, editForm); setEditing(null); fetchCategories(); }
    catch (err) { setError(err.response?.data?.message || 'Erreur serveur'); }
  };

  const handleDelete = async () => {
    if (!confirmTarget) return;
    try { await api.delete(`/categories/${confirmTarget}`); fetchCategories(); }
    catch (err) { setError(err.response?.data?.message || 'Erreur serveur'); }
    finally { setConfirmTarget(null); }
  };

  const startEdit = (cat) => { setEditing(cat.id); setEditForm({ nom: cat.nom, description: cat.description || '' }); };

  const totalProduits = categories.reduce((sum, c) => sum + (Number(c.produit_count) || 0), 0);
  const emptyCount = categories.filter(c => (Number(c.produit_count) || 0) === 0).length;

  const filtered = categories.filter(c => {
    if (!search) return true;
    return c.nom.toLowerCase().includes(search.toLowerCase()) || (c.description || '').toLowerCase().includes(search.toLowerCase());
  });

  const statCards = [
    { title: 'Total catégories', value: categories.length, subtitle: 'catégories créées', icon: FiTag, accent: 'blue' },
    { title: 'Produits liés', value: totalProduits, subtitle: 'produits assignés', icon: FiPackage, accent: 'indigo' },
    { title: 'Catégories vides', value: emptyCount, subtitle: emptyCount > 0 ? 'sans produits' : 'toutes utilisées', icon: FiAlertCircle, accent: emptyCount > 0 ? 'warning' : 'success' },
  ];

  return (
    <PageTransition>
      <div className="space-y-7">

        {/* Header */}
        <PageHeader
          title="Catégories"
          description={`Organisez vos produits par catégorie · ${categories.length} catégorie(s)`}
          actions={canCreate && (
            <motion.button whileHover={{ scale: 1.02, boxShadow: '0 12px 32px rgba(59,130,246,0.3)' }} whileTap={{ scale: 0.98 }}
              onClick={() => setShowNew(true)} className="btn btn-primary">
              <FiPlus size={18} /> Ajouter une catégorie
            </motion.button>
          )}
        />

        {/* Stats */}
        {loading ? <SkeletonCards count={3} /> : (
          <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {statCards.map((s, i) => (
              <motion.div key={i} variants={item}><StatCard {...s} /></motion.div>
            ))}
          </motion.div>
        )}

        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <SearchInput value={search} onChange={setSearch} placeholder="Rechercher une catégorie..." className="flex-1 max-w-md" />
          <p className="text-sm opacity-40 font-medium" style={{ color: 'var(--text-secondary)' }}>
            {filtered.length} résultat(s)
          </p>
        </div>

        {error && <div className="notice notice-error">{error}</div>}

        {/* Inline Create */}
        <AnimatePresence>
          {showNew && (
            <motion.div initial={{ opacity: 0, y: -8, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, y: -8, height: 0 }}
              className="card rounded-[18px] p-5 overflow-hidden" style={{ borderColor: 'var(--blue-alpha-15)' }}>
              <p className="font-bold text-sm mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <FiPlus size={14} style={{ color: 'var(--blue)' }} /> Nouvelle catégorie
              </p>
              <form onSubmit={handleCreate} className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
                <div className="flex-1">
                  <label className="input-label">Nom *</label>
                  <input value={newForm.nom} onChange={(e) => setNewForm(p => ({ ...p, nom: e.target.value }))} placeholder="Ex: Informatique" autoFocus
                    className="input-field" style={{ borderColor: 'var(--blue-alpha-12)' }} />
                </div>
                <div className="flex-[2]">
                  <label className="input-label">Description</label>
                  <input value={newForm.description} onChange={(e) => setNewForm(p => ({ ...p, description: e.target.value }))} placeholder="Description optionnelle..."
                    className="input-field" />
                </div>
                <div className="flex gap-2 sm:pb-0">
                  <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} type="submit" className="btn btn-primary btn-sm">
                    Créer
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} type="button"
                    onClick={() => { setShowNew(false); setNewForm({ nom: '', description: '' }); }}
                    className="btn btn-secondary btn-sm">
                    Annuler
                  </motion.button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Table */}
        <div className="card rounded-[20px] overflow-hidden">
          {loading ? (
            <SkeletonTable rows={5} cols={4} />
          ) : filtered.length === 0 && !showNew ? (
            <EmptyState
              icon={FiLayers}
              title={search ? 'Aucun résultat' : 'Aucune catégorie'}
              description={search ? 'Essayez un autre terme de recherche.' : 'Créez votre première catégorie pour organiser vos produits.'}
              action={canCreate && !search && (
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowNew(true)}
                  className="btn btn-primary btn-sm">
                  <FiPlus size={16} /> Ajouter une catégorie
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
                      {['Catégorie', 'Description', 'Produits', 'Statut'].map(h => (
                        <th key={h} className="table-header-cell">{h}</th>
                      ))}
                      <th className="table-header-cell text-right">Actions</th>
                    </tr>
                  </thead>
                  <motion.tbody variants={container} initial="hidden" animate="show">
                    {filtered.map((cat) => {
                      const count = Number(cat.produit_count) || 0;
                      const isActive = count > 0;
                      const isEditing = editing === cat.id;

                      return (
                        <motion.tr key={cat.id} variants={rowVariants} className="table-row group">
                          <td className="table-cell">
                            {isEditing ? (
                              <input value={editForm.nom} onChange={(e) => setEditForm(p => ({ ...p, nom: e.target.value }))} autoFocus
                                className="input-field py-2 text-sm" style={{ borderColor: 'var(--blue-alpha-12)' }} />
                            ) : (
                              <div className="flex items-center gap-3">
                                <div className="icon-box icon-box-sm rounded-xl" style={{ background: 'var(--blue-alpha-8)', border: '1px solid var(--blue-alpha-12)' }}>
                                  <FiTag size={15} style={{ color: 'var(--blue)' }} />
                                </div>
                                <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{cat.nom}</span>
                              </div>
                            )}
                          </td>
                          <td className="table-cell">
                            {isEditing ? (
                              <input value={editForm.description} onChange={(e) => setEditForm(p => ({ ...p, description: e.target.value }))}
                                className="input-field py-2 text-sm" />
                            ) : (
                              <span className="opacity-55 text-sm" style={{ color: 'var(--text-secondary)' }}>{cat.description || '—'}</span>
                            )}
                          </td>
                          <td className="table-cell">
                            <span className={`badge ${isActive ? 'badge-blue' : 'badge-neutral'}`}>
                              <FiPackage size={13} /> {count}
                            </span>
                          </td>
                          <td className="table-cell">
                            <span className={`status-pill ${isActive ? 'badge-success' : 'badge-warning'}`}>
                              <span className={`status-dot ${isActive ? 'bg-[#22C55E]' : 'bg-[#F59E0B]'}`} />
                              {isActive ? 'Active' : 'Vide'}
                            </span>
                          </td>
                          <td className="table-cell">
                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              {isEditing ? (
                                <>
                                  <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={handleEdit}
                                    className="p-2 rounded-xl transition-all" style={{ color: 'var(--success)', background: 'var(--success-alpha-8)' }}><FiCheck size={16} /></motion.button>
                                  <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => setEditing(null)}
                                    className="p-2 rounded-xl transition-all" style={{ color: 'var(--text-secondary)', background: 'var(--neutral-alpha-6)' }}><FiX size={16} /></motion.button>
                                </>
                              ) : (
                                <>
                                  {count > 0 && (
                                    <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                                      onClick={() => navigate(`/produits?categorie_id=${cat.id}`)}
                                      className="p-2 rounded-xl text-[#94A3B8] hover:text-[#6366F1] hover:bg-[rgba(99,102,241,0.08)] transition-all" title="Voir produits">
                                      <FiEye size={16} />
                                    </motion.button>
                                  )}
                                  {canCreate && (
                                    <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => startEdit(cat)}
                                      className="p-2 rounded-xl text-[#94A3B8] hover:text-[#3B82F6] hover:bg-[rgba(59,130,246,0.08)] transition-all" title="Modifier">
                                      <FiEdit2 size={16} />
                                    </motion.button>
                                  )}
                                  {canDelete && (
                                    <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => setConfirmTarget(cat.id)}
                                      className="p-2 rounded-xl text-[#94A3B8] hover:text-[#EF4444] hover:bg-[rgba(239,68,68,0.08)] transition-all" title="Supprimer">
                                      <FiTrash2 size={16} />
                                    </motion.button>
                                  )}
                                </>
                              )}
                            </div>
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
                  {filtered.map((cat) => {
                    const count = Number(cat.produit_count) || 0;
                    const isActive = count > 0;
                    const isEditing = editing === cat.id;

                    return (
                      <motion.div key={cat.id} variants={rowVariants} className="p-5 table-row">
                        {isEditing ? (
                          <div className="flex flex-col gap-3">
                            <input value={editForm.nom} onChange={(e) => setEditForm(p => ({ ...p, nom: e.target.value }))}
                              className="input-field" style={{ borderColor: 'var(--blue-alpha-12)' }} />
                            <input value={editForm.description} onChange={(e) => setEditForm(p => ({ ...p, description: e.target.value }))}
                              className="input-field" />
                            <div className="flex gap-2 pt-1">
                              <motion.button whileTap={{ scale: 0.95 }} onClick={handleEdit}
                                className="flex-1 btn btn-sm" style={{ background: 'var(--success-alpha-8)', color: 'var(--success)' }}>
                                <FiCheck size={15} /> Enregistrer
                              </motion.button>
                              <motion.button whileTap={{ scale: 0.95 }} onClick={() => setEditing(null)}
                                className="flex-1 btn btn-sm btn-secondary">
                                <FiX size={15} /> Annuler
                              </motion.button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-start gap-3 mb-3">
                              <div className="icon-box icon-box-md rounded-xl shrink-0" style={{ background: 'var(--blue-alpha-8)', border: '1px solid var(--blue-alpha-12)' }}>
                                <FiTag size={18} style={{ color: 'var(--blue)' }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-lg leading-tight" style={{ color: 'var(--text-primary)' }}>{cat.nom}</h3>
                                <p className="text-xs mt-1 opacity-50 truncate" style={{ color: 'var(--text-secondary)' }}>{cat.description || 'Aucune description'}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2.5 mb-4">
                              <span className={`badge ${isActive ? 'badge-blue' : 'badge-neutral'}`}><FiPackage size={12} /> {count} produit{count !== 1 ? 's' : ''}</span>
                              <span className={`status-pill ${isActive ? 'badge-success' : 'badge-warning'}`}>
                                <span className={`status-dot ${isActive ? 'bg-[#22C55E]' : 'bg-[#F59E0B]'}`} />
                                {isActive ? 'Active' : 'Vide'}
                              </span>
                            </div>
                            <div className="flex gap-2 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                              {count > 0 && (
                                <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate(`/produits?categorie_id=${cat.id}`)}
                                  className="flex-1 btn btn-sm" style={{ background: 'var(--indigo-alpha-8)', color: 'var(--indigo)', border: '1px solid var(--indigo-alpha-12)' }}>
                                  <FiEye size={14} /> Voir produits
                                </motion.button>
                              )}
                              {canCreate && (
                                <motion.button whileTap={{ scale: 0.95 }} onClick={() => startEdit(cat)}
                                  className="flex-1 btn btn-sm" style={{ background: 'var(--blue-alpha-8)', color: 'var(--blue)', border: '1px solid var(--blue-alpha-12)' }}>
                                  <FiEdit2 size={14} /> Modifier
                                </motion.button>
                              )}
                              {canDelete && (
                                <motion.button whileTap={{ scale: 0.95 }} onClick={() => setConfirmTarget(cat.id)}
                                  className="flex-1 btn btn-sm btn-danger">
                                  <FiTrash2 size={14} /> Supprimer
                                </motion.button>
                              )}
                            </div>
                          </>
                        )}
                      </motion.div>
                    );
                  })}
                </motion.div>
              </div>
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!confirmTarget}
        title="Supprimer cette catégorie ?"
        description="Les produits liés devront être réaffectés. La suppression est irréversible."
        confirmLabel="Supprimer"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmTarget(null)}
      />
    </PageTransition>
  );
}

export default CategoriesPage;
