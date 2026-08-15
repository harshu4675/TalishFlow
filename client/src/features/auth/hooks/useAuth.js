import { useAuthContext } from '@/contexts/AuthContext'
import { useNotificationContext } from '@/contexts/NotificationContext'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/utils/constants'

export default function useAuth() {
  const auth = useAuthContext()
  const { success, error } = useNotificationContext()
  const navigate = useNavigate()

  const loginWithFeedback = async (credentials) => {
    const result = await auth.login(credentials)

    if (result.success) {
      success('Welcome back!', `Good to see you, ${result.user.name.split(' ')[0]}.`)
      navigate(ROUTES.DASHBOARD, { replace: true })
    } else {
      error('Login failed', result.error)
    }

    return result
  }

  const registerWithFeedback = async (data) => {
    const result = await auth.register(data)

    if (result.success) {
      success(
        'Account created!',
        'Welcome to TalishFlow. Check your email to verify your account.'
      )
      navigate(ROUTES.DASHBOARD, { replace: true })
    } else {
      error('Registration failed', result.error)
    }

    return result
  }

  const logoutWithFeedback = async () => {
    await auth.logout()
  }

  return {
    ...auth,
    loginWithFeedback,
    registerWithFeedback,
    logoutWithFeedback,
  }
}
