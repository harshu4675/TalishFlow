import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom'
import { useAuthContext } from '@/context/AuthContext'
import { ROUTES } from '@/utils/constants'

const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'))
const RegisterPage = lazy(() => import('@/features/auth/pages/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('@/features/auth/pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('@/features/auth/pages/ResetPasswordPage'))

const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage'))
const EditorPage = lazy(() => import('@/features/editor/pages/EditorPage'))
const AnalyticsPage = lazy(() => import('@/features/analytics/pages/AnalyticsPage'))
const PublishingPage = lazy(() => import('@/features/publishing/pages/PublishingPage'))
const SettingsPage = lazy(() => import('@/features/settings/pages/SettingsPage'))

const DashboardLayout = lazy(() => import('@/components/layout/DashboardLayout'))
const AuthLayout = lazy(() => import('@/components/layout/AuthLayout'))

function PageLoader() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F1F3F6',
        color: '#2874F0',
        fontSize: '20px',
        fontWeight: 'bold',
      }}
    >
      Loading...
    </div>
  )
}

function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuthContext()

  if (isLoading) return <PageLoader />
  if (!isAuthenticated) return <Navigate to={ROUTES.LOGIN} replace />
  return <Outlet />
}

function PublicRoute() {
  const { isAuthenticated, isLoading } = useAuthContext()

  if (isLoading) return <PageLoader />
  if (isAuthenticated) return <Navigate to={ROUTES.DASHBOARD} replace />
  return <Outlet />
}

function PageWrapper({ children }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>
}

const router = createBrowserRouter([
  {
    element: <PublicRoute />,
    children: [
      {
        element: (
          <PageWrapper>
            <AuthLayout />
          </PageWrapper>
        ),
        children: [
          { path: ROUTES.LOGIN, element: <LoginPage /> },
          { path: ROUTES.REGISTER, element: <RegisterPage /> },
          { path: ROUTES.FORGOT_PASSWORD, element: <ForgotPasswordPage /> },
          { path: ROUTES.RESET_PASSWORD, element: <ResetPasswordPage /> },
        ],
      },
    ],
  },

  {
    element: <ProtectedRoute />,
    children: [
      {
        element: (
          <PageWrapper>
            <DashboardLayout />
          </PageWrapper>
        ),
        children: [
          { path: ROUTES.DASHBOARD, element: <DashboardPage /> },
          { path: ROUTES.ANALYTICS, element: <AnalyticsPage /> },
          { path: ROUTES.PUBLISHING, element: <PublishingPage /> },
          { path: ROUTES.SETTINGS, element: <SettingsPage /> },
          { path: ROUTES.SETTINGS_PROFILE, element: <SettingsPage tab="profile" /> },
          { path: ROUTES.SETTINGS_ACCOUNTS, element: <SettingsPage tab="accounts" /> },
          {
            path: ROUTES.SETTINGS_NOTIFICATIONS,
            element: <SettingsPage tab="notifications" />,
          },
          { path: ROUTES.SETTINGS_SECURITY, element: <SettingsPage tab="security" /> },
        ],
      },
      {
        path: ROUTES.EDITOR,
        element: (
          <PageWrapper>
            <EditorPage />
          </PageWrapper>
        ),
      },
    ],
  },

  {
    path: '/',
    element: <Navigate to={ROUTES.DASHBOARD} replace />,
  },

  {
    path: '*',
    element: (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#F1F3F6',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '48px', color: '#2874F0' }}>404</h1>
          <p>Page not found</p>
          <a href="/login" style={{ color: '#2874F0' }}>
            Go to Login
          </a>
        </div>
      </div>
    ),
  },
])

export default function AppRouter() {
  return <RouterProvider router={router} />
}
