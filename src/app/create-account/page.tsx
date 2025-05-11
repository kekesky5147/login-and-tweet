'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createAccount } from '../auth-actions'
import { useRouter } from 'next/navigation'
import Home from '@/src/components/backtohome'
import Link from 'next/link'

const CreateAccountFormSchema = z.object({
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  password: z
    .string()
    .min(5, 'Password must be at least 5 characters')
    .regex(
      /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{5,}$/,
      'Password must contain at least one uppercase letter, one number, and one special character'
    ),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .regex(
      /^[가-힣a-zA-Z0-9]+$/,
      'Username must contain only Korean, English, or numbers, no special characters'
    ),
  phone: z.string().optional()
})

type CreateAccountFormData = z.infer<typeof CreateAccountFormSchema>

interface CreateAccountResult {
  message: string
  userId?: number
  success?: boolean
  errors?: {
    email?: string[]
    password?: string[]
    username?: string[]
    phone?: string[]
    server?: string[]
  }
}

export default function CreateAccountPage () {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError
  } = useForm<CreateAccountFormData>({
    resolver: zodResolver(CreateAccountFormSchema),
    defaultValues: {
      email: '',
      password: '',
      username: '',
      phone: ''
    }
  })

  const onSubmit = async (data: CreateAccountFormData) => {
    setServerError(null)
    setSuccessMessage(null)

    const formData = new FormData()
    formData.append('email', data.email)
    formData.append('password', data.password)
    formData.append('username', data.username)
    if (data.phone) formData.append('phone', data.phone)

    console.log('Create account form data:', { ...data, password: '***' })

    try {
      const result = (await createAccount(formData)) as CreateAccountResult
      console.log('Create account result:', result)

      if (result.errors) {
        if ('email' in result.errors && result.errors.email) {
          setError('email', { message: result.errors.email[0] })
        }
        if ('password' in result.errors && result.errors.password) {
          setError('password', { message: result.errors.password[0] })
        }
        if ('username' in result.errors && result.errors.username) {
          setError('username', { message: result.errors.username[0] })
        }
        if ('phone' in result.errors && result.errors.phone) {
          setError('phone', { message: result.errors.phone[0] })
        }
        if ('server' in result.errors && result.errors.server) {
          setServerError(result.errors.server[0])
        }
      } else {
        setSuccessMessage(result.message)
        setTimeout(() => {
          router.push('/login')
        }, 1000)
      }
    } catch (error) {
      console.error('Client-side create account error:', error)
      setServerError('Unexpected error occurred. Please try again.')
    }
  }

  return (
    <div className='flex min-h-screen items-center justify-center bg-neutral-100'>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className='w-full max-w-md space-y-6 rounded-lg bg-white p-8 shadow-md'
      >
        <h1 className='text-2xl font-bold text-center'>Create Account</h1>

        {successMessage && (
          <p className='text-green-500 text-center'>{successMessage}</p>
        )}
        {serverError && (
          <p className='text-red-600 text-center'>{serverError}</p>
        )}

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
            {...register('email')}
            className='mt-1 w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none'
          />
          {errors.email && (
            <p className='mt-1 text-sm text-red-600'>{errors.email.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor='password'
            className='block text-sm font-medium text-gray-700'
          >
            Password
          </label>
          <input
            id='password'
            type='password'
            {...register('password')}
            className='mt-1 w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none'
          />
          {errors.password && (
            <p className='mt-1 text-sm text-red-600'>
              {errors.password.message}
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
            {...register('username')}
            className='mt-1 w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none'
          />
          {errors.username && (
            <p className='mt-1 text-sm text-red-600'>
              {errors.username.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor='phone'
            className='block text-sm font-medium text-gray-700'
          >
            Phone (Optional)
          </label>
          <input
            id='phone'
            type='text'
            {...register('phone')}
            className='mt-1 w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none'
          />
          {errors.phone && (
            <p className='mt-1 text-sm text-red-600'>{errors.phone.message}</p>
          )}
        </div>

        <button
          type='submit'
          disabled={isSubmitting}
          className='w-full rounded-md bg-neutral-800 px-4 py-2 text-white hover:bg-neutral-900 disabled:opacity-50'
        >
          {isSubmitting ? 'Creating...' : 'Create Account'}
        </button>
        <div className='flex items-center justify-center gap-8'>
          <Home />
          <Link href='/login' className='hover:underline text-gray-800 text-xs'>
            L O G - I N
          </Link>
        </div>
      </form>
    </div>
  )
}
