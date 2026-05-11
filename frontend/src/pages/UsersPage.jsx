import { useState, useEffect } from 'react';
import usePageTitle from '../hooks/usePageTitle';
import { FiPlus, FiEdit2, FiTrash2, FiUsers, FiUserCheck, FiShield, FiClock, FiX, FiEye } from 'react-icons/fi';
import api from '../api/axios';
import UserModal from '../components/UserModal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { motion } from 'framer-motion';
import PageTransition from '../components/PageTransition';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import SearchInput from '../components/ui/SearchInput';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonCards, SkeletonTable } from '../components/ui/Skeleton';

const roleBadge = {
  admin: { cls: 'badge-purple' },
  responsable: { cls: 'badge-blue' },
  employe: { cls: 'badge-neutral' },
};
const roleLabel = { admin: 'Admin', responsable: 'Responsable', employe: 'Employé' };

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const rowVariants = { hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0 } };
const cardItem = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 22 } } };

function UsersPage() {
  usePageTitle('Utilisateurs');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState('');
  const [confirmTarget, setConfirmTarget] = useState(null);  // { id, action: 'delete' | 'reject' }
  const [pendingOpen, setPendingOpen] = useState(false);
  const [activeRequest, setActiveRequest] = useState(null);
  const [requestRole, setRequestRole] = useState('employe');

  const fetchUsers = async () => {
    try { setError(''); const { data } = await api.get('/users'); setUsers(data); }
    catch (err) { setError(err.response?.data?.message || 'Erreur chargement'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchUsers(); }, []);

  useEffect(() => {
    if (activeRequest) {
      setRequestRole(activeRequest.role || 'employe');
    }
  }, [activeRequest]);

  const handleDeleteUser = async () => {
    if (!confirmTarget) return;
    try { await api.delete(`/users/${confirmTarget.id}`); fetchUsers(); }
    catch (err) { setError(err.response?.data?.message || 'Erreur lors de la suppression'); }
    finally { setConfirmTarget(null); }
  };
  const handleSaved = () => { setModal(null); fetchUsers(); };

  const filtered = users.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.nom?.toLowerCase().includes(q) || u.prenom?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });

  // Summary stats
  const pendingUsers = users.filter(u => !u.actif);
  const activeCount = users.filter(u => u.actif).length;
  const adminCount = users.filter(u => u.role === 'admin').length;

  // Approuver une demande (activer le compte)
  const handleApprove = async (id) => {
    try { await api.patch(`/users/${id}/toggle-active`); fetchUsers(); return true; }
    catch (err) { setError(err.response?.data?.message || 'Erreur lors de l\'approbation'); return false; }
  };

  // Rejeter une demande (supprimer le compte)
  const handleReject = async (id) => {
    try { await api.delete(`/users/${id}`); fetchUsers(); return true; }
    catch (err) { setError(err.response?.data?.message || 'Erreur lors du rejet'); return false; }
  };

  const handleApproveRequest = async () => {
    if (!activeRequest) return;
    let ok = true;
    if (requestRole && requestRole !== activeRequest.role) {
      try {
        await api.put(`/users/${activeRequest.id}`, { role: requestRole });
      } catch (err) {
        setError(err.response?.data?.message || 'Erreur lors de la mise a jour du role');
        ok = false;
      }
    }
    if (ok) ok = await handleApprove(activeRequest.id);
    if (ok) setActiveRequest(null);
  };

  const handleRejectRequest = async () => {
    if (!activeRequest) return;
    const ok = await handleReject(activeRequest.id);
    if (ok) setActiveRequest(null);
  };

  return (
    <PageTransition>
      <div className="space-y-7">
        <PageHeader
          title="Utilisateurs"
          description={`${users.length} utilisateur(s) enregistré(s)`}
          actions={
            <div className="flex flex-wrap gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setPendingOpen(true)}
                className="btn btn-secondary"
                disabled={pendingUsers.length === 0}
                style={pendingUsers.length === 0 ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
              >
                <FiClock size={18} /> Demandes en attente ({pendingUsers.length})
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: '0 12px 32px rgba(59,130,246,0.3)' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setModal('create')}
                className="btn btn-primary"
              >
                <FiPlus size={18} /> Ajouter un utilisateur
              </motion.button>
            </div>
          }
        />

        {/* Summary Cards */}
        {loading ? (
          <SkeletonCards count={4} />
        ) : (
          <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: 'Total', value: users.length, subtitle: 'utilisateurs', icon: FiUsers, accent: 'blue' },
              { title: 'Actifs', value: activeCount, subtitle: 'comptes actifs', icon: FiUserCheck, accent: 'success' },
              { title: 'En attente', value: pendingUsers.length, subtitle: pendingUsers.length > 0 ? 'demande(s) en attente' : 'aucune demande', icon: FiClock, accent: pendingUsers.length > 0 ? 'warning' : 'success' },
              { title: 'Admins', value: adminCount, subtitle: 'administrateurs', icon: FiShield, accent: 'purple' },
            ].map((card, i) => (
              <motion.div key={i} variants={cardItem}>
                <StatCard {...card} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Search */}
        <SearchInput value={search} onChange={setSearch} placeholder="Rechercher un utilisateur..." className="max-w-md" />

        {error && <div className="notice notice-error">{error}</div>}

        {/* Table */}
        <div className="card rounded-[20px] overflow-hidden">
          {loading ? (
            <SkeletonTable rows={5} cols={4} />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={FiUsers}
              title="Aucun utilisateur trouvé"
              description={search ? 'Essayez un autre terme de recherche.' : 'Ajoutez votre premier utilisateur.'}
              action={!search && (
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => setModal('create')} className="btn btn-primary btn-sm">
                  <FiPlus size={16} /> Ajouter un utilisateur
                </motion.button>
              )}
            />
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="table-head">
                      {['Utilisateur', 'Rôle', 'Statut', 'Actions'].map((h, i) => (
                        <th key={h} className={`table-header-cell ${i === 3 ? 'text-right' : ''}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <motion.tbody variants={container} initial="hidden" animate="show">
                    {filtered.map((u) => {
                      const rb = roleBadge[u.role] || roleBadge.employe;
                      return (
                        <motion.tr key={u.id} variants={rowVariants} className="table-row group">
                          <td className="table-cell">
                            <div className="flex items-center gap-4">
                              <div
                                className="w-11 h-11 rounded-full flex items-center justify-center font-bold shrink-0"
                                style={{
                                  background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(99,102,241,0.15))',
                                  border: '1px solid var(--border)',
                                  color: 'var(--text-primary)',
                                }}
                              >
                                {u.prenom?.[0]}{u.nom?.[0]}
                              </div>
                              <div>
                                <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{u.prenom} {u.nom}</p>
                                <p className="text-sm mt-0.5 opacity-50" style={{ color: 'var(--text-secondary)' }}>{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="table-cell">
                            <span className={`badge ${rb.cls}`}>{roleLabel[u.role] || u.role}</span>
                          </td>
                          <td className="table-cell">
                            <span className={`status-pill ${u.actif ? 'badge-success' : 'badge-danger'}`}>
                              <span className={`status-dot ${u.actif ? 'bg-[#22C55E]' : 'bg-[#EF4444]'}`} />
                              {u.actif ? 'Actif' : 'Inactif'}
                            </span>
                          </td>
                          <td className="table-cell">
                            <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                                onClick={() => setModal(u)}
                                className="btn-icon text-[#94A3B8] hover:text-[#3B82F6] hover:bg-[rgba(59,130,246,0.08)] transition-all rounded-xl p-2.5"
                              >
                                <FiEdit2 size={16} />
                              </motion.button>
                              <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                                onClick={() => setConfirmTarget({ id: u.id, action: 'delete' })}
                                className="btn-icon text-[#94A3B8] hover:text-[#EF4444] hover:bg-[rgba(239,68,68,0.08)] transition-all rounded-xl p-2.5"
                                title="Supprimer"
                              >
                                <FiTrash2 size={16} />
                              </motion.button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </motion.tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="md:hidden">
                <motion.div variants={container} initial="hidden" animate="show">
                  {filtered.map((u) => {
                    const rb = roleBadge[u.role] || roleBadge.employe;
                    return (
                      <motion.div key={u.id} variants={rowVariants} className="p-5 table-row">
                        <div className="flex items-center gap-3 mb-4">
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center font-bold shrink-0"
                            style={{
                              background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(99,102,241,0.15))',
                              border: '1px solid var(--border)',
                              color: 'var(--text-primary)',
                            }}
                          >
                            {u.prenom?.[0]}{u.nom?.[0]}
                          </div>
                          <div>
                            <h3 className="font-bold text-lg leading-tight" style={{ color: 'var(--text-primary)' }}>{u.prenom} {u.nom}</h3>
                            <p className="text-xs mt-0.5 opacity-50" style={{ color: 'var(--text-secondary)' }}>{u.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 mb-4">
                          <span className={`badge ${rb.cls}`}>{roleLabel[u.role]}</span>
                          <span className={`status-pill ${u.actif ? 'badge-success' : 'badge-danger'}`}>
                            <span className={`status-dot ${u.actif ? 'bg-[#22C55E]' : 'bg-[#EF4444]'}`} />
                            {u.actif ? 'Actif' : 'Inactif'}
                          </span>
                        </div>
                        <div className="flex gap-2 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setModal(u)}
                            className="flex-1 btn btn-sm" style={{ background: 'var(--blue-alpha-8)', color: 'var(--blue)', border: '1px solid var(--blue-alpha-12)' }}>
                            <FiEdit2 size={14} /> Modifier
                          </motion.button>
                          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setConfirmTarget({ id: u.id, action: 'delete' })}
                            className="flex-1 btn btn-sm btn-danger">
                            <FiTrash2 size={14} /> Supprimer
                          </motion.button>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </div>
            </>
          )}
        </div>

        {modal && <UserModal user={modal === 'create' ? null : modal} onClose={() => setModal(null)} onSaved={handleSaved} />}

        {pendingOpen && (
          <div
            className="modal-overlay"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setPendingOpen(false);
                setActiveRequest(null);
              }
            }}
          >
            <div className="modal-panel max-w-3xl w-full">
              <div className="flex items-center justify-between mb-4 mt-1">
                <h2 className="text-lg font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  Demandes en attente
                </h2>
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setPendingOpen(false)}
                  className="p-2 rounded-xl transition-colors" style={{ color: 'var(--text-secondary)', background: 'var(--neutral-alpha-6)' }}>
                  <FiX size={18} />
                </motion.button>
              </div>

              {pendingUsers.length === 0 ? (
                <div className="notice" style={{ background: 'var(--neutral-alpha-6)' }}>
                  Aucune demande en attente.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="table-head">
                        {['Utilisateur', 'Email', 'Rôle', 'Actions'].map((h, i) => (
                          <th key={h} className={`table-header-cell ${i === 3 ? 'text-right' : ''}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pendingUsers.map((u) => {
                        const rb = roleBadge[u.role] || roleBadge.employe;
                        return (
                          <tr key={u.id} className="table-row">
                            <td className="table-cell">{u.prenom} {u.nom}</td>
                            <td className="table-cell">{u.email}</td>
                            <td className="table-cell"><span className={`badge ${rb.cls}`}>{roleLabel[u.role] || u.role}</span></td>
                            <td className="table-cell text-right">
                              <motion.button
                                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}
                                onClick={() => { setActiveRequest(u); setPendingOpen(false); }}
                                className="btn btn-sm"
                                style={{ background: 'var(--blue-alpha-8)', color: 'var(--blue)', border: '1px solid var(--blue-alpha-12)' }}
                              >
                                <FiEye size={14} /> Voir
                              </motion.button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeRequest && (
          <div
            className="modal-overlay"
            onClick={(e) => { if (e.target === e.currentTarget) setActiveRequest(null); }}
          >
            <div className="modal-panel max-w-md w-full">
              <div className="flex items-center justify-between mb-4 mt-1">
                <h2 className="text-lg font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  Demande en attente
                </h2>
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setActiveRequest(null)}
                  className="p-2 rounded-xl transition-colors" style={{ color: 'var(--text-secondary)', background: 'var(--neutral-alpha-6)' }}>
                  <FiX size={18} />
                </motion.button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="input-label">Nom</label>
                  <input className="input-field" readOnly value={`${activeRequest.prenom || ''} ${activeRequest.nom || ''}`.trim()} />
                </div>
                <div>
                  <label className="input-label">Email</label>
                  <input className="input-field" readOnly value={activeRequest.email || ''} />
                </div>
                <div>
                  <label className="input-label">Rôle</label>
                  <div className="relative">
                    <select
                      value={requestRole}
                      onChange={(e) => setRequestRole(e.target.value)}
                      className="input-field appearance-none cursor-pointer pr-10"
                    >
                      <option value="employe" style={{ background: 'var(--bg-surface)' }}>Employé</option>
                      <option value="responsable" style={{ background: 'var(--bg-surface)' }}>Responsable Stock</option>
                      <option value="admin" style={{ background: 'var(--bg-surface)' }}>Administrateur</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-secondary)', opacity: 0.4 }}>
                      <svg width="10" height="6" viewBox="0 0 12 8" fill="none"><path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="input-label">Statut</label>
                  <input className="input-field" readOnly value="En attente" />
                </div>
              </div>

              <div className="flex gap-3 pt-5 mt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleRejectRequest} className="flex-1 btn btn-danger">
                  Refuser
                </motion.button>
                <motion.button
                  whileHover={{ boxShadow: '0 10px 28px rgba(34,197,94,0.25)' }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleApproveRequest}
                  className="flex-1 btn btn-primary"
                  style={{ background: 'var(--success)', color: 'white' }}
                >
                  Accepter
                </motion.button>
              </div>
            </div>
          </div>
        )}

        <ConfirmDialog
          open={confirmTarget?.action === 'delete'}
          title="Supprimer cet utilisateur ?"
          description="Cette action est irréversible. Toutes les données de cet utilisateur seront définitivement supprimées."
          confirmLabel="Supprimer"
          danger
          onConfirm={handleDeleteUser}
          onCancel={() => setConfirmTarget(null)}
        />

        <ConfirmDialog
          open={confirmTarget?.action === 'reject'}
          title="Refuser cette demande ?"
          description="Le compte de cet utilisateur sera supprimé. Il devra soumettre une nouvelle demande s'il souhaite accéder au système."
          confirmLabel="Refuser la demande"
          danger
          onConfirm={() => { handleReject(confirmTarget.id); setConfirmTarget(null); }}
          onCancel={() => setConfirmTarget(null)}
        />
      </div>
    </PageTransition>
  );
}

export default UsersPage;
