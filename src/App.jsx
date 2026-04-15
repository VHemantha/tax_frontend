import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/common/ProtectedRoute'

// Auth
import Login from './pages/auth/Login'

// Client pages
import ClientLayout from './components/layout/ClientLayout'
import ClientDashboard from './pages/client/Dashboard'
import TaxFormPage from './pages/client/TaxFormPage'
import ClientConfirmation from './pages/client/ClientConfirmation'

// Consultant pages
import ConsultantLayout from './components/layout/ConsultantLayout'
import ConsultantDashboard from './pages/consultant/Dashboard'
import ClientList from './pages/consultant/ClientList'
import RegisterClient from './pages/consultant/RegisterClient'
import ClientDetail from './pages/consultant/ClientDetail'
import TaxCalculation from './pages/consultant/TaxCalculation'
import ArchivePage from './pages/consultant/ArchivePage'
import Portfolio from './pages/consultant/Portfolio'
import StatusDrillDown from './pages/consultant/StatusDrillDown'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Client Routes */}
          <Route element={<ProtectedRoute role="client" />}>
            <Route element={<ClientLayout />}>
              <Route path="/client/dashboard" element={<ClientDashboard />} />
              <Route path="/client/tax-form/:submissionId?" element={<TaxFormPage />} />
              <Route path="/client/confirm/:submissionId" element={<ClientConfirmation />} />
            </Route>
          </Route>

          {/* Consultant Routes */}
          <Route element={<ProtectedRoute role="consultant" />}>
            <Route element={<ConsultantLayout />}>
              <Route path="/consultant/dashboard" element={<ConsultantDashboard />} />
              <Route path="/consultant/clients" element={<ClientList />} />
              <Route path="/consultant/clients/register" element={<RegisterClient />} />
              <Route path="/consultant/clients/:clientId" element={<ClientDetail />} />
              <Route path="/consultant/submissions/:submissionId/calculate" element={<TaxCalculation />} />
              <Route path="/consultant/archive" element={<ArchivePage />} />
              <Route path="/consultant/portfolio" element={<Portfolio />} />
              <Route path="/consultant/status/:statusKey" element={<StatusDrillDown />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
