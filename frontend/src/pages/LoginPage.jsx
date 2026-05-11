import { useState } from 'react'
import usePageTitle from '../hooks/usePageTitle'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FiArrowRight, FiAtSign, FiEye, FiEyeOff, FiLock, FiAlertCircle } from 'react-icons/fi'
import { motion } from 'framer-motion'
import AuthLayout from '../components/AuthLayout'

const fieldVariants = {
  hidden: { opacity: 0, y: 14 },
  show: (i) => ({
    opacity: 1, y: 0,
    transition: { delay: 0.1 + i * 0.08, type: 'spring', stiffness: 300, damping: 24 }
  })
}

function LoginPage() {
  const { login } = useAuth()
  usePageTitle('Connexion')
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [pendingMessage, setPendingMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setPendingMessage('')

    try {
      setLoading(true)
      const u = await login(email.trim().toLowerCase(), password)
      navigate(u.role === 'employe' ? '/produits' : '/dashboard')
    } catch (err) {
      // Si le compte est en attente d'approbation → message info (pas erreur)
      if (err.response?.data?.pendingApproval) {
        setPendingMessage(err.response.data.message)
      } else {
        setError(err.response?.data?.message || 'Email ou mot de passe incorrect.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Connexion"
      subtitle="Entre dans ton espace de travail ERP."
      switchText="Pas encore de compte ?"
      switchLinkText="Créer un compte"
      switchLinkTo="/register"
    >
      {pendingMessage && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="notice"
          style={{
            background: 'var(--blue-alpha-8)',
            border: '1px solid var(--blue-alpha-12)',
            color: 'var(--blue)',
            borderRadius: 12,
            padding: '14px 16px',
            fontSize: '0.85rem',
            lineHeight: 1.5,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
          }}
        >
          <FiAlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>{pendingMessage}</span>
        </motion.div>
      )}

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="notice notice-error"
        >
          <FiAlertCircle size={16} style={{ flexShrink: 0 }} />
          {error}
        </motion.p>
      )}

      <form className="form-grid" onSubmit={handleSubmit}>
        <motion.label className="field" custom={0} variants={fieldVariants} initial="hidden" animate="show">
          <span className="field-label">Email *</span>
          <div className="input-wrap">
            <FiAtSign />
            <input className="field-input" type="email" placeholder="you@company.com"
              value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </div>
        </motion.label>

        <motion.label className="field" custom={1} variants={fieldVariants} initial="hidden" animate="show">
          <span className="field-label">Mot de passe *</span>
          <div className="input-wrap">
            <FiLock />
            <input className="field-input" type={showPassword ? 'text' : 'password'}
              placeholder="Minimum 6 caractères"
              value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
            <button type="button" className="icon-action" onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
        </motion.label>

        <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="show">
          <button className="submit-btn" type="submit" disabled={loading}>
            {loading ? (
              <>
                <span className="submit-spinner" />
                Connexion...
              </>
            ) : (
              <>
                Se connecter
                <FiArrowRight />
              </>
            )}
          </button>
        </motion.div>
      </form>
    </AuthLayout>
  )
}

export default LoginPage
