import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom'
import { useAuthContext } from '@/contexts/AuthContext'
import { ROUTES } from '@/utils/constants'
import PageLoader from '@/components/common/PageLoader'
import RouteErrorBoundary from './RouteErrorBoundary'

const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'))
const RegisterPage = lazy(() => import('@/features/auth/pages/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('@/features/auth/pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('@/features/auth/pages/ResetPasswordPage'))
const NotFoundPage = lazy(() => import('@/features/misc/pages/NotFoundPage'))

const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage'))
const EditorPage = lazy(() => import('@/features/editor/pages/EditorPage'))
const AnalyticsPage = lazy(() => import('@/features/analytics/pages/AnalyticsPage'))
const PublishingPage = lazy(() => import('@/features/publishing/pages/PublishingPage'))
const SettingsPage = lazy(() => import('@/features/settings/pages/SettingsPage'))

const DashboardLayout = lazy(() => import('@/layouts/DashboardLayout'))
const AuthLayout = lazy(() => import('@/layouts/AuthLayout'))

function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuthContext()

  if (isLoading) return <PageLoader label="Preparing your workspace" />
  if (!isAuthenticated) return <Navigate to={ROUTES.LOGIN} replace />
  return <Outlet />
}

function PublicRoute() {
  const { isAuthenticated, isLoading } = useAuthContext()

  if (isLoading) return <PageLoader label="Loading" />
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
    errorElement: <RouteErrorBoundary />,
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
      <PageWrapper>
        <NotFoundPage />
      </PageWrapper>
    ),
  },
])

export default function AppRouter() {
  return <RouterProvider router={router} />
}
