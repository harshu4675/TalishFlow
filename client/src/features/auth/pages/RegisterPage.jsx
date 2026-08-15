import { Link } from 'react-router-dom'
import RegisterForm from '../components/RegisterForm'
import OAuthButtons from '../components/OAuthButtons'
import useAuth from '../hooks/useAuth'
import { ROUTES } from '@/utils/constants'

export default function RegisterPage() {
  const { registerWithFeedback, isLoading } = useAuth()

  const handleRegister = async (data) => {
    await registerWithFeedback(data)
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-foreground text-[28px] font-extrabold tracking-tight">
          Create your account
        </h1>
        <p className="text-foreground-muted text-sm">
          Already have an account?{' '}
          <Link
            to={ROUTES.LOGIN}
            className="text-primary hover:text-primary-hover font-semibold transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>

      {/* OAuth */}
      <OAuthButtons isLoading={isLoading} />

      {/* Register Form */}
      <RegisterForm onSubmit={handleRegister} isLoading={isLoading} />
    </div>
  )
}
