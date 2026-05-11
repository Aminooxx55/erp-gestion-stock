import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { AnimatePresence } from 'framer-motion'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import UsersPage from './pages/UsersPage'
import ProductsPage from './pages/ProductsPage'
import CategoriesPage from './pages/CategoriesPage'
import MouvementsPage from './pages/MouvementsPage'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import './App.css'

// Employé → /produits, Responsable/Admin → /dashboard
const getDefaultRoute = (role) => {
  if (role === 'admin' || role === 'responsable') return '/dashboard'
  return '/produits'
}

function App() {
  const { user } = useAuth()
  const location = useLocation()
  const defaultRoute = user ? getDefaultRoute(user.role) : '/login'

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public routes */}
        <Route path="/login" element={user ? <Navigate to={defaultRoute} replace /> : <LoginPage />} />
        <Route path="/register" element={user ? <Navigate to={defaultRoute} replace /> : <RegisterPage />} />

        {/* Protected routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute roles={['admin', 'responsable']}>
            <Layout><DashboardPage /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/users" element={
          <ProtectedRoute roles={['admin']}>
            <Layout><UsersPage /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/categories" element={
          <ProtectedRoute>
            <Layout><CategoriesPage /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/produits" element={
          <ProtectedRoute>
            <Layout><ProductsPage /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/mouvements" element={
          <ProtectedRoute roles={['admin', 'responsable']}>
            <Layout><MouvementsPage /></Layout>
          </ProtectedRoute>
        } />

        {/* Redirects */}
        <Route path="/" element={<Navigate to={defaultRoute} replace />} />
        <Route path="*" element={<Navigate to={defaultRoute} replace />} />
      </Routes>
    </AnimatePresence>
  )
}

export default App
