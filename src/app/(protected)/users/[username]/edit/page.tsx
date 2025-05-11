'use client'

import { useState, useOptimistic, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  updateUserProfile,
  changePassword,
  getCurrentUser
} from '@/src/app/auth-actions'
import { useRouter } from 'next/navigation'

const UpdateProfileFormSchema = z.object({
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .regex(
      /^[가-힣a-zA-Z0-9]+$/,
      'Username must contain only Korean, English, or numbers, no special characters'
    ),
  bio: z
    .string()
    .max(160, 'Bio cannot exceed 160 characters')
    .optional()
    .nullable()
})

const ChangePasswordFormSchema = z.object({
  currentPassword: z.string().min(5, 'Current password is required'),
  newPassword: z
    .string()
    .min(5, 'New password must be at least 5 characters')
    .regex(
      /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{5,}$/,
      'New password must contain at least one uppercase letter, one number, and one special character'
    )
})

type UpdateProfileFormData = z.infer<typeof UpdateProfileFormSchema>
type ChangePasswordFormData = z.infer<typeof ChangePasswordFormSchema>

interface User {
  id: number
  email: string
  username: string
  bio: string | null
}

interface EditProfilePageProps {
  params: { username: string }
}

export default function EditProfilePage ({ params }: EditProfilePageProps) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [optimisticUser, setOptimisticUser] = useOptimistic<User | null>(user)

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors, isSubmitting: isSubmittingProfile },
    reset: resetProfile
  } = useForm<UpdateProfileFormData>({
    resolver: zodResolver(UpdateProfileFormSchema),
    defaultValues: {
      email: user?.email || '',
      username: user?.username || '',
      bio: user?.bio || ''
    }
  })

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors, isSubmitting: isSubmittingPassword },
    reset: resetPassword
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(ChangePasswordFormSchema)
  })

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await getCurrentUser()
        console.log('Edit page - Fetched currentUser:', currentUser)
        if (!currentUser || currentUser.username !== params.username) {
          setServerError('Unauthorized access.')
          return
        }
        setUser(currentUser)
        setOptimisticUser(currentUser)
        resetProfile({
          email: currentUser.email,
          username: currentUser.username,
          bio: currentUser.bio
        })
      } catch (error) {
        console.error('Fetch user error:', error)
        setServerError('Failed to load user data. Please try again.')
      }
    }

    fetchUser()
  }, [params.username, resetProfile])

  const onSubmitProfile = async (data: UpdateProfileFormData) => {
    setServerError(null)
    setSuccessMessage(null)

    setOptimisticUser({
      ...user!,
      email: data.email,
      username: data.username,
      bio: data.bio ?? null
    })

    const formData = new FormData()
    formData.append('email', data.email)
    formData.append('username', data.username)
    if (data.bio) formData.append('bio', data.bio)

    console.log('Update profile form data:', { ...data })

    try {
      const result = await updateUserProfile(formData)
      console.log('Update profile result:', result)

      if (result.errors) {
        if (result.errors.email) {
          setServerError(result.errors.email[0])
        }
        if (result.errors.username) {
          setServerError(result.errors.username[0])
        }
        if (result.errors.bio) {
          setServerError(result.errors.bio[0])
        }
        if (result.errors.server) {
          setServerError(result.errors.server[0])
        }
      } else {
        setSuccessMessage(result.message)
        setTimeout(() => {
          router.push(`/users/${data.username}`)
        }, 1000)
      }
    } catch (error) {
      console.error('Client-side update profile error:', error)
      setServerError('Unexpected error occurred. Please try again.')
    }
  }

  const onSubmitPassword = async (data: ChangePasswordFormData) => {
    setServerError(null)
    setSuccessMessage(null)

    const formData = new FormData()
    formData.append('currentPassword', data.currentPassword)
    formData.append('newPassword', data.newPassword)

    console.log('Change password form data:', {
      currentPassword: '***',
      newPassword: '***'
    })

    try {
      const result = await changePassword(formData)
      console.log('Change password result:', result)

      if (result.errors) {
        if (result.errors.currentPassword) {
          setServerError(result.errors.currentPassword[0])
        }
        if (result.errors.newPassword) {
          setServerError(result.errors.newPassword[0])
        }
        if (result.errors.server) {
          setServerError(result.errors.server[0])
        }
      } else {
        setSuccessMessage(result.message)
        resetPassword()
        setTimeout(() => {
          setSuccessMessage(null)
        }, 2000)
      }
    } catch (error) {
      console.error('Client-side change password error:', error)
      setServerError('Unexpected error occurred. Please try again.')
    }
  }

  if (serverError) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <p className='text-red-600'>{serverError}</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className='flex items-center justify-center pt-8'>
      <div className='w-full max-w-md space-y-6 rounded-lg bg-white p-8 shadow-md'>
        <h1 className='text-2xl font-bold text-center'>Edit Profile</h1>

        {successMessage && (
          <p className='text-green-500 text-center'>{successMessage}</p>
        )}
        {serverError && (
          <p className='text-red-600 text-center'>{serverError}</p>
        )}

        <form
          onSubmit={handleSubmitProfile(onSubmitProfile)}
          className='space-y-4'
        >
          <div>
            <label
              htmlFor='email'
              className='block text-sm font-medium text-gray-700'
            >
              Email
            </label>
            <input
              id='email'
              type='email'
              {...registerProfile('email')}
              className='mt-1 w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none'
              defaultValue={optimisticUser?.email}
            />
            {profileErrors.email && (
              <p className='mt-1 text-sm text-red-600'>
                {profileErrors.email.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor='username'
              className='block text-sm font-medium text-gray-700'
            >
              Username
            </label>
            <input
              id='username'
              type='text'
              {...registerProfile('username')}
              className='mt-1 w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none'
              defaultValue={optimisticUser?.username}
            />
            {profileErrors.username && (
              <p className='mt-1 text-sm text-red-600'>
                {profileErrors.username.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor='bio'
              className='block text-sm font-medium text-gray-700'
            >
              Bio
            </label>
            <textarea
              id='bio'
              {...registerProfile('bio')}
              className='mt-1 w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none'
              rows={4}
              defaultValue={optimisticUser?.bio || ''}
            />
            {profileErrors.bio && (
              <p className='mt-1 text-sm text-red-600'>
                {profileErrors.bio.message}
              </p>
            )}
          </div>

          <button
            type='submit'
            disabled={isSubmittingProfile}
            className='w-full rounded-md bg-neutral-800 px-4 py-2 text-white hover:bg-neutral-900 disabled:opacity-50'
          >
            {isSubmittingProfile ? 'Updating...' : 'Update Profile'}
          </button>
        </form>

        <form
          onSubmit={handleSubmitPassword(onSubmitPassword)}
          className='space-y-4 mt-6'
        >
          <h2 className='text-xl font-semibold'>Change Password</h2>

          <div>
            <label
              htmlFor='currentPassword'
              className='block text-sm font-medium text-gray-700'
            >
              Current Password
            </label>
            <input
              id='currentPassword'
              type='password'
              {...registerPassword('currentPassword')}
              className='mt-1 w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none'
            />
            {passwordErrors.currentPassword && (
              <p className='mt-1 text-sm text-red-600'>
                {passwordErrors.currentPassword.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor='newPassword'
              className='block text-sm font-medium text-gray-700'
            >
              New Password
            </label>
            <input
              id='newPassword'
              type='password'
              {...registerPassword('newPassword')}
              className='mt-1 w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none'
            />
            {passwordErrors.newPassword && (
              <p className='mt-1 text-sm text-red-600'>
                {passwordErrors.newPassword.message}
              </p>
            )}
          </div>

          <button
            type='submit'
            disabled={isSubmittingPassword}
            className='w-full rounded-md bg-neutral-800 px-4 py-2 text-white hover:bg-neutral-900 disabled:opacity-50'
          >
            {isSubmittingPassword ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
