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
        <h1 className="text-[28px] font-extrabold text-[#212121] tracking-tight">
          Create your account
        </h1>
        <p className="text-[#878787] text-sm">
          Already have an account?{' '}
          <Link
            to={ROUTES.LOGIN}
            className="text-[#2874F0] font-semibold hover:text-[#2874F0]-hover transition-colors"
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