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

  return (
    <AuthProvider>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <Navigate to="/dashboard" replace />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Layout>
                <ProfilePage onMasterKeyReady={setMasterKey} />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tools/achievements"
          element={
            <ProtectedRoute>
              <Layout>
                <AchievementsPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tools/vault"
          element={
            <ProtectedRoute>
              <Layout>
                <VaultPage masterKey={masterKey} />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tools/stoic"
          element={
            <ProtectedRoute>
              <Layout>
                <StoicQuotesPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <Layout>
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
