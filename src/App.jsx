import React, { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/Layout'
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import ProfilePage from './pages/ProfilePage'
import AchievementsPage from './pages/AchievementsPage'
import VaultPage from './pages/VaultPage'
import StoicQuotesPage from './pages/StoicQuotesPage'
import AdminPage from './pages/AdminPage'

export default function App() {
  const [masterKey, setMasterKey] = useState(null)

  const vaultUnlocked = !!masterKey

  return (
    <AuthProvider>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout vaultUnlocked={vaultUnlocked}>
                <Navigate to="/dashboard" replace />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout vaultUnlocked={vaultUnlocked}>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Layout vaultUnlocked={vaultUnlocked}>
                <ProfilePage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/tools/achievements"
          element={
            <ProtectedRoute>
              <Layout vaultUnlocked={vaultUnlocked}>
                <AchievementsPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/tools/vault"
          element={
            <ProtectedRoute>
              <Layout vaultUnlocked={vaultUnlocked}>
                <VaultPage
                  masterKey={masterKey}
                  onMasterKeyReady={setMasterKey}
                />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/tools/stoic"
          element={
            <ProtectedRoute>
              <Layout vaultUnlocked={vaultUnlocked}>
                <StoicQuotesPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <Layout vaultUnlocked={vaultUnlocked}>
                <AdminPage />
              </Layout>
            </AdminRoute>
          }
        />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  )
}
