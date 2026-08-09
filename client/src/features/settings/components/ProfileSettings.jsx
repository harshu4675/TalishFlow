import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Camera } from 'lucide-react'
import { useAuthContext } from '@/context/AuthContext'
import { useNotificationContext } from '@/context/NotificationContext'
import { apiClient } from '@/services/api'
import { cn } from '@/utils/cn'
import { getInitials } from '@/utils/formatters'

const schema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(60, 'Name cannot exceed 60 characters'),
  email: z.string().email(),
})

export default function ProfileSettings() {
  const { user, updateUser } = useAuthContext()
  const { success, error } = useNotificationContext()
  const [isSaving, setIsSaving] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
    },
  })

  const onSubmit = async (data) => {
    setIsSaving(true)
    try {
      const response = await apiClient.patch('/settings/profile', { name: data.name })
      updateUser(response.data.data.user)
      success('Profile updated', 'Your profile has been saved.')
    } catch (err) {
      error('Update failed', err.userMessage || 'Failed to update profile.')
    } finally {
      setIsSaving(false)
    }
  }

  const inputClass = (hasError) =>
    cn(
      'w-full px-4 py-3 rounded-xl text-sm',
      'bg-[#F8F9FA] border transition-all duration-150',
      'text-[#212121] placeholder:text-[#878787]',
      'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-[#2874F0]',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      hasError
        ? 'border-[#FF6161] focus:ring-danger/30 focus:border-[#FF6161]'
        : 'border-[#E0E0E0] hover:border-[#2874F0]/30'
    )

  return (
    <div>
      <div className="px-6 py-5 border-b border-[#E0E0E0]">
        <h2 className="text-[15px] font-bold text-[#212121]">Profile</h2>
        <p className="text-xs text-[#878787] mt-0.5">
          Update your personal information.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-6 flex flex-col gap-6">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-[#2874F0]/10 flex items-center justify-center overflow-hidden">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xl font-bold text-[#2874F0]">
                  {getInitials(user?.name || 'User')}
                </span>
              )}
            </div>
            <button
              type="button"
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#2874F0] flex items-center justify-center shadow-md"
              aria-label="Change avatar"
            >
              <Camera className="w-3 h-3 text-white" aria-hidden="true" />
            </button>
          </div>
          <div>
            <p className="text-sm font-bold text-[#212121]">{user?.name}</p>
            <p className="text-xs text-[#878787] mt-0.5">{user?.email}</p>
            {user?.isEmailVerified && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#22C55E] bg-[#22C55E]/10 px-2 py-0.5 rounded-full mt-1.5">
                Verified
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[#212121]" htmlFor="name">
              Full name
            </label>
            <input
              id="name"
              type="text"
              {...register('name')}
              className={inputClass(!!errors.name)}
            />
            {errors.name && (
              <p className="text-xs text-[#EF4444] font-medium">{errors.name.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[#212121]" htmlFor="email">
              Email address
            </label>
            <input
              id="email"
              type="email"
              {...register('email')}
              disabled
              className={inputClass(false)}
            />
            <p className="text-xs text-[#878787]">Email cannot be changed.</p>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-[#E0E0E0]">
          <button
            type="submit"
            disabled={isSaving || !isDirty}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-xl',
              'bg-[#2874F0] hover:bg-[#1B5FCC] text-white text-sm font-semibold',
              'transition-all duration-150 shadow-md shadow-primary/20',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50'
            )}
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
            {isSaving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  )
}