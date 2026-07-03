import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import SignIn from '@/pages/SignIn'
import SignUp from '@/pages/SignUp'
import Dashboard from '@/pages/Dashboard'
import { useAuth } from '@/context/AuthContext'

function ProtectedRoute({ children }) {
  const { session, loading } = useAuth()
  if (loading) return null
  return session ? children : <Navigate to="/signin" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/signin" replace />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/signin" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
