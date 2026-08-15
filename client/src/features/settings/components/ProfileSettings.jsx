import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Camera, CheckCircle2, Info } from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import { useNotificationContext } from '@/contexts/NotificationContext'
import { settingsService } from '@/services/settingsService'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Input from '@/components/ui/input'
import Label from '@/components/ui/label'
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
      const updatedUser = await settingsService.updateProfile({ name: data.name })
      updateUser(updatedUser)
      success('Profile updated', 'Your profile has been saved.')
    } catch (err) {
      error('Update failed', err.userMessage || 'Failed to update profile.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div>
      <div className="border-border-subtle border-b px-6 py-5">
        <h2 className="text-foreground text-[15px] font-bold">Profile</h2>
        <p className="text-foreground-muted mt-0.5 text-xs">
          Update your personal information.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 px-6 py-6">
        <div className="flex items-center gap-4">
          <Avatar className="ring-border-subtle h-16 w-16 rounded-2xl ring-2">
            {user?.avatar ? (
              <AvatarImage src={user.avatar} alt={user.name || 'User'} />
            ) : (
              <AvatarFallback className="rounded-2xl text-xl">
                {getInitials(user?.name || 'User')}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="min-w-0">
            <p className="text-foreground truncate text-sm font-bold">{user?.name}</p>
            <p className="text-foreground-muted truncate text-xs">{user?.email}</p>
            <div className="mt-1.5 flex items-center gap-2">
              {user?.isEmailVerified ? (
                <Badge variant="success">
                  <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                  Verified
                </Badge>
              ) : (
                <Badge variant="warning">Unverified</Badge>
              )}
              <button
                type="button"
                className="text-foreground-muted hover:bg-surface-muted hover:text-foreground flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-semibold transition-colors"
              >
                <Camera className="h-3 w-3" aria-hidden="true" />
                Change photo
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" type="text" hasError={!!errors.name} {...register('name')} />
            {errors.name && (
              <p className="text-error text-xs font-medium" role="alert">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email address</Label>
            <Input id="email" type="email" disabled {...register('email')} />
            <p className="text-foreground-faint flex items-center gap-1 text-xs">
              <Info className="h-3 w-3" aria-hidden="true" />
              Email cannot be changed for security reasons.
            </p>
          </div>
        </div>

        <div className="border-border-subtle flex justify-end border-t pt-5">
          <Button type="submit" loading={isSaving} disabled={!isDirty}>
            {isSaving ? 'Saving...' : 'Save changes'}
          </Button>
        </div>
      </form>
    </div>
  )
}
