import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAdminAuth } from '@/contexts/AuthContext'
import AdminLayout from '@/components/layout/AdminLayout'
import { FiLoader } from 'react-icons/fi'

const LoginPage         = lazy(() => import('@/pages/LoginPage'))
const DashboardPage     = lazy(() => import('@/pages/DashboardPage'))
const UsersPage         = lazy(() => import('@/pages/UsersPage'))
const CastCallsPage     = lazy(() => import('@/pages/CastCallsPage'))
const ProductionsPage   = lazy(() => import('@/pages/ProductionsPage'))
const TalentsPage       = lazy(() => import('@/pages/TalentsPage'))
const AgenciesPage      = lazy(() => import('@/pages/AgenciesPage'))
const CompaniesPage     = lazy(() => import('@/pages/CompaniesPage'))
const AuditionsPage     = lazy(() => import('@/pages/AuditionsPage'))
const BookingsPage      = lazy(() => import('@/pages/BookingsPage'))
const PlatformFeesPage  = lazy(() => import('@/pages/PlatformFeesPage'))
const WithdrawalsPage   = lazy(() => import('@/pages/WithdrawalsPage'))
const SubPlansPage      = lazy(() => import('@/pages/SubPlansPage'))
const SubUsersPage      = lazy(() => import('@/pages/SubUsersPage'))
const RoleChangeRequestsPage = lazy(() => import('@/pages/RoleChangeRequestsPage'))
const LocationsPage     = lazy(() => import('@/pages/LocationsPage'))
const TrustPage         = lazy(() => import('@/pages/TrustPage'))

const Spin = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <FiLoader className="w-8 h-8 animate-spin text-brand-primary" />
  </div>
)

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAdminAuth()
  if (isLoading) return <Spin />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Suspense fallback={<Spin />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/*" element={
          <PrivateRoute>
            <AdminLayout>
              <Routes>
                <Route path="/"              element={<DashboardPage />} />
                <Route path="/users"         element={<UsersPage />} />
                <Route path="/role-requests" element={<RoleChangeRequestsPage />} />
                <Route path="/cast-calls"    element={<CastCallsPage />} />
                <Route path="/productions"   element={<ProductionsPage />} />
                <Route path="/talents"       element={<TalentsPage />} />
                <Route path="/agencies"      element={<AgenciesPage />} />
                <Route path="/companies"     element={<CompaniesPage />} />
                <Route path="/auditions"     element={<AuditionsPage />} />
                <Route path="/bookings"      element={<BookingsPage />} />
                <Route path="/locations"     element={<LocationsPage />} />
                <Route path="/trust"         element={<TrustPage />} />
                <Route path="/sub-plans"     element={<SubPlansPage />} />
                <Route path="/sub-users"     element={<SubUsersPage />} />
                <Route path="/platform-fees" element={<PlatformFeesPage />} />
                <Route path="/withdrawals"   element={<WithdrawalsPage />} />
                <Route path="*"              element={<Navigate to="/" replace />} />
              </Routes>
            </AdminLayout>
          </PrivateRoute>
        } />
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
