import { useState, useMemo } from 'react'
import usePageTitle from '../hooks/usePageTitle'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FiArrowRight, FiAtSign, FiEye, FiEyeOff, FiLock, FiUser, FiAlertCircle, FiCheckCircle } from 'react-icons/fi'
import { motion } from 'framer-motion'
import AuthLayout from '../components/AuthLayout'

const fieldVariants = {
  hidden: { opacity: 0, y: 14 },
  show: (i) => ({
    opacity: 1, y: 0,
    transition: { delay: 0.1 + i * 0.08, type: 'spring', stiffness: 300, damping: 24 }
  })
}

function getPasswordStrength(pw) {
  if (!pw) return { score: 0, label: '', color: 'transparent' };
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { score: 20, label: 'Faible', color: 'var(--danger)' };
  if (score <= 2) return { score: 40, label: 'Moyen', color: 'var(--warning)' };
  if (score <= 3) return { score: 60, label: 'Bon', color: 'var(--warning-light)' };
  if (score <= 4) return { score: 80, label: 'Fort', color: 'var(--success)' };
  return { score: 100, label: 'Excellent', color: 'var(--success)' };
}

function RegisterPage() {
  const { register } = useAuth()
  usePageTitle('Créer un compte')

  const [nom, setNom] = useState('')
  const [prenom, setPrenom] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.')
      return
    }

    try {
      setLoading(true)
      await register(nom.trim(), prenom.trim(), email.trim().toLowerCase(), password)
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la création du compte.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title={success ? 'Demande envoyée' : 'Créer un compte'}
      subtitle={success ? '' : 'Le rôle sera attribué par un administrateur.'}
      switchText={success ? '' : 'Tu as déjà un compte ?'}
      switchLinkText={success ? '' : 'Se connecter'}
      switchLinkTo="/login"
    >
      {success ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-4"
        >
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'var(--success-alpha-8)', border: '2px solid var(--success-alpha-12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px'
          }}>
            <FiCheckCircle size={28} style={{ color: 'var(--success)' }} />
          </div>
          <h3 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.1rem', marginBottom: 8 }}>
            Demande de création envoyée avec succès
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 24 }}>
            Votre demande a été transmise à l'administrateur.<br />
            Vous pourrez vous connecter une fois votre compte approuvé.
          </p>
          <Link to="/login" className="btn btn-primary" style={{ display: 'inline-flex', gap: 8 }}>
            Retour à la connexion <FiArrowRight />
          </Link>
        </motion.div>
      ) : (
      <>
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
        {/* Name fields — side by side */}
        <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="show"
          className="grid grid-cols-2 gap-3">
          <label className="field">
            <span className="field-label">Nom *</span>
            <div className="input-wrap">
              <FiUser />
              <input className="field-input" type="text" placeholder="Nom"
                value={nom} onChange={(e) => setNom(e.target.value)} required autoComplete="family-name" />
            </div>
          </label>

          <label className="field">
            <span className="field-label">Prénom *</span>
            <div className="input-wrap">
              <FiUser />
              <input className="field-input" type="text" placeholder="Prénom"
                value={prenom} onChange={(e) => setPrenom(e.target.value)} required autoComplete="given-name" />
            </div>
          </label>
        </motion.div>

        <motion.label className="field" custom={1} variants={fieldVariants} initial="hidden" animate="show">
          <span className="field-label">Email *</span>
          <div className="input-wrap">
            <FiAtSign />
            <input className="field-input" type="email" placeholder="you@company.com"
              value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </div>
        </motion.label>

        <motion.label className="field" custom={2} variants={fieldVariants} initial="hidden" animate="show">
          <span className="field-label">Mot de passe *</span>
          <div className="input-wrap">
            <FiLock />
            <input className="field-input" type={showPassword ? 'text' : 'password'}
              placeholder="Minimum 6 caractères"
              value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" />
            <button type="button" className="icon-action" onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Masquer' : 'Afficher'}>
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
          {/* Password strength bar */}
          {password && (
            <div className="flex items-center gap-2 mt-1">
              <div className="password-strength flex-1">
                <div
                  className="password-strength-fill"
                  style={{ width: `${strength.score}%`, background: strength.color }}
                />
              </div>
              <span className="text-[10px] font-bold" style={{ color: strength.color }}>{strength.label}</span>
            </div>
          )}
        </motion.label>

        <motion.label className="field" custom={3} variants={fieldVariants} initial="hidden" animate="show">
          <span className="field-label">Confirmer mot de passe *</span>
          <div className={`input-wrap ${confirmPassword && confirmPassword !== password ? 'has-error' : ''}`}>
            <FiLock />
            <input className="field-input" type="password" placeholder="Répète le mot de passe"
              value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password" />
          </div>
          {confirmPassword && confirmPassword !== password && (
            <p className="field-error">Les mots de passe ne correspondent pas</p>
          )}
        </motion.label>

        <motion.div custom={4} variants={fieldVariants} initial="hidden" animate="show">
          <button className="submit-btn submit-btn-register" type="submit" disabled={loading}>
            {loading ? (
              <>
                <span className="submit-spinner" />
                Création...
              </>
            ) : (
              <>
                Créer mon compte
                <FiArrowRight />
              </>
            )}
          </button>
        </motion.div>
      </form>
      </>
      )}
    </AuthLayout>
  )
}

export default RegisterPage
