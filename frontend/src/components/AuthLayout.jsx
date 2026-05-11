import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import AuthIllustration from './AuthIllustration'

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
}
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
}

function AuthLayout({ title, subtitle, switchText, switchLinkText, switchLinkTo, children }) {
  return (
    <div className="auth-app">
      <div className="bg-shape bg-shape-one"></div>
      <div className="bg-shape bg-shape-two"></div>
      <div className="bg-shape bg-shape-three"></div>

      <main className="auth-shell">
        <aside className="brand-column" aria-label="ERP introduction">
          <motion.div variants={containerVariants} initial="hidden" animate="show">
            <motion.p variants={itemVariants} className="brand-chip">ERP Gestion Stock</motion.p>
            <motion.h1 variants={itemVariants} className="brand-title" style={{ marginTop: '20px' }}>
              Pilote ton stock<br />avec précision.
            </motion.h1>
            <motion.p variants={itemVariants} className="brand-text" style={{ marginTop: '12px' }}>
              Plateforme de gestion d'inventaire intelligente pour suivre tes produits,
              anticiper les ruptures et optimiser tes opérations.
            </motion.p>
          </motion.div>

          {/* Animated SVG illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.6, ease: 'easeOut' }}
            style={{ marginTop: '8px' }}
          >
            <AuthIllustration />
          </motion.div>

          <div className="brand-version">
            <span>v1.0 · PFE 2025/2026</span>
          </div>
        </aside>

        <section className="form-column" aria-label="Authentication form">
          <div className="auth-card">
            <header className="form-head">
              <h2 className="form-title">{title}</h2>
              <p className="form-subtitle">{subtitle}</p>
            </header>

            {children}

            <p className="switch-copy">
              {switchText} <Link to={switchLinkTo}>{switchLinkText}</Link>
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}

export default AuthLayout