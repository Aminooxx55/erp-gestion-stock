import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiGrid, FiUsers, FiPackage, FiTag, FiRepeat, FiLogOut, FiMenu, FiX, FiUser } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ProfileModal from './ProfileModal';
import ChatbotWidget from './ChatbotWidget';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: FiGrid, roles: ['admin', 'responsable'] },
  { to: '/users', label: 'Utilisateurs', icon: FiUsers, roles: ['admin'] },
  { to: '/categories', label: 'Catégories', icon: FiTag, roles: ['admin', 'responsable', 'employe'] },
  { to: '/produits', label: 'Produits', icon: FiPackage, roles: ['admin', 'responsable', 'employe'] },
  { to: '/mouvements', label: 'Mouvements', icon: FiRepeat, roles: ['admin', 'responsable'] },
];

const roleLabel = { admin: 'Administrateur', responsable: 'Responsable Stock', employe: 'Employé' };
const roleColor = {
  admin: { bg: 'var(--purple-alpha-8)', color: 'var(--purple)', border: 'var(--purple-alpha-12)' },
  responsable: { bg: 'var(--blue-alpha-8)', color: 'var(--blue)', border: 'var(--blue-alpha-12)' },
  employe: { bg: 'var(--neutral-alpha-6)', color: 'var(--text-secondary)', border: 'var(--neutral-alpha-8)' },
};

function SidebarContent({ filtered, rc, user, onNavItemClick, onProfileOpen, onLogout }) {
  const initials = `${user?.prenom?.[0] || ''}${user?.nom?.[0] || ''}` || 'U';
  const roleText = roleLabel[user?.role] || roleLabel.employe;

  return (
    <>
      {/* Logo area */}
      <div className="px-5 pt-6 pb-5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="flex items-center gap-3">
          <div
            className="relative w-11 h-11 rounded-[14px] flex items-center justify-center text-white"
            style={{
              background: 'linear-gradient(135deg, var(--blue), var(--indigo))',
              boxShadow: '0 6px 20px rgba(59,130,246,0.25)',
            }}
            aria-label="Stock logo"
          >
            <FiPackage size={18} />
            <span
              className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
              style={{ background: 'var(--success)', border: '2px solid var(--bg-card)' }}
            />
          </div>
          <div>
            <p className="text-[15px] font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>ERP Stock</p>
            <p className="text-[10px] font-bold tracking-[0.15em] uppercase opacity-70" style={{ color: 'var(--blue)' }}>Enterprise</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 pt-6 pb-4 space-y-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] px-3 mb-4 opacity-35" style={{ color: 'var(--text-secondary)' }}>Navigation</p>
        {filtered.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavItemClick}
            className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
          >
            {({ isActive }) => (
              <>
                <div
                  className={`icon-box icon-box-sm rounded-lg nav-icon ${isActive ? 'nav-icon-active' : ''}`}
                >
                  <Icon size={17} />
                </div>
                <span>{label}</span>
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="ml-auto w-1.5 h-1.5 rounded-full"
                    style={{ background: 'var(--blue)', boxShadow: '0 0 4px var(--blue)' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User card */}
      <div className="p-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <motion.button
          type="button"
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.99 }}
          onClick={onProfileOpen}
          className="sidebar-user-card"
          aria-label="Ouvrir mon compte"
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
            style={{
              background: 'linear-gradient(135deg, rgba(110,143,219,0.2), rgba(126,132,216,0.2))',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{user?.prenom} {user?.nom}</p>
            <span
              className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold"
              style={{ background: rc.bg, color: rc.color, border: `1px solid ${rc.border}` }}
            >
              {roleText}
            </span>
          </div>
          <div className="icon-box icon-box-sm rounded-lg sidebar-user-card-action">
            <FiUser size={14} />
          </div>
        </motion.button>
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={onLogout}
          className="mt-2 sidebar-user-action sidebar-user-action-danger group"
        >
          <FiLogOut size={15} className="group-hover:-translate-x-0.5 transition-transform" />
          Déconnexion
        </motion.button>
      </div>
    </>
  );
}

function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Close mobile sidebar on Escape
  useEffect(() => {
    const handleEscape = (e) => { if (e.key === 'Escape') setMobileOpen(false); };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };
  const handleNavItemClick = () => setMobileOpen(false);
  const handleOpenProfile = () => {
    setProfileOpen(true);
    setMobileOpen(false);
  };
  const filtered = navItems.filter((item) => item.roles.includes(user?.role));
  const rc = roleColor[user?.role] || roleColor.employe;

  return (
    <div className="flex min-h-screen text-[var(--text-primary)] relative">

      {/* Mobile top bar */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-40 px-4 py-3 flex items-center justify-between"
        style={{ background: 'rgba(17, 24, 38, 0.9)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border-subtle)' }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="relative w-8 h-8 rounded-lg flex items-center justify-center text-white"
            style={{ background: 'linear-gradient(135deg, var(--blue), var(--indigo))', boxShadow: '0 4px 12px rgba(110,143,219,0.2)' }}
            aria-label="Stock logo"
          >
            <FiPackage size={14} />
            <span
              className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
              style={{ background: 'var(--success)', border: '1px solid var(--bg-card)' }}
            />
          </div>
          <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>ERP Stock</span>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-xl transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={mobileOpen}
          aria-controls="mobile-sidebar"
        >
          {mobileOpen ? <FiX size={22} /> : <FiMenu size={22} />}
        </motion.button>
      </div>

      {/* Mobile overlay + sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            />
            <motion.aside
              id="mobile-sidebar"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 26, stiffness: 300 }}
              className="md:hidden fixed left-0 top-0 bottom-0 z-50 w-[260px] flex flex-col shadow-2xl"
              style={{ background: 'linear-gradient(180deg, var(--bg-surface), #141E30)', borderRight: '1px solid var(--border-subtle)' }}
            >
              <SidebarContent
                filtered={filtered}
                rc={rc}
                user={user}
                onNavItemClick={handleNavItemClick}
                onProfileOpen={handleOpenProfile}
                onLogout={handleLogout}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <aside
        className="hidden md:flex w-[260px] shrink-0 flex-col sticky top-0 h-screen"
        style={{ background: 'rgba(17, 24, 38, 0.45)', backdropFilter: 'blur(20px)', borderRight: '1px solid rgba(163, 177, 194, 0.08)' }}
      >
        <SidebarContent
          filtered={filtered}
          rc={rc}
          user={user}
          onNavItemClick={handleNavItemClick}
          onProfileOpen={handleOpenProfile}
          onLogout={handleLogout}
        />
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-5 md:p-10 pt-[72px] md:pt-10 relative">
        {/* Ambient glows */}
        <div
          className="fixed top-[-100px] right-[-100px] w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(110,143,219,0.045), transparent 65%)' }}
        />
        <div
          className="fixed bottom-[-100px] left-[200px] w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(126,132,216,0.035), transparent 65%)' }}
        />
        <div className="relative z-10 w-full max-w-none">
          {children}
        </div>
      </main>

      {user && <ChatbotWidget />}
      {profileOpen && <ProfileModal onClose={() => setProfileOpen(false)} />}
    </div>
  );
}

export default Layout;
