'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { login } from '../auth-actions'
import Link from 'next/link'
import Home from '@/src/components/backtohome'

interface FormData {
  email: string
  password: string
}

interface LoginResult {
  errors?: {
    email?: string[]
    password?: string[]
    server?: string[]
  }
  message: string
  userId?: number
}

export default function LoginPage () {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError
  } = useForm<FormData>()
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const onSubmit = async (data: FormData) => {
    setServerError(null)
    setSuccessMessage(null)

    const formData = new FormData()
    formData.append('email', data.email)
    formData.append('password', data.password)

    const result = (await login(formData)) as LoginResult

    if (result.errors) {
      if ('email' in result.errors && result.errors.email) {
        setError('email', { message: result.errors.email[0] })
      }
      if ('password' in result.errors && result.errors.password) {
        setError('password', { message: result.errors.password[0] })
      }
      if ('server' in result.errors && result.errors.server) {
        setServerError(result.errors.server[0])
      }
    } else {
      setSuccessMessage(result.message)
      setTimeout(() => {
        router.push('/tweet')
      }, 1000)
    }
  }

  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-100'>
      <div className='bg-white p-8 rounded-lg shadow-md w-full max-w-md'>
        <h1 className='text-2xl font-bold mb-6 text-center'>Login</h1>
        {successMessage && (
          <p className='text-green-500 mb-4 text-center'>{successMessage}</p>
        )}
        {serverError && (
          <p className='text-red-500 mb-4 text-center'>{serverError}</p>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
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
              {...register('email', { required: 'Email is required' })}
              className='mt-1 block w-full p-2 border border-gray-300 rounded-md'
            />
            {errors.email && (
              <p className='text-red-500 text-sm mt-1'>
                {errors.email.message}
              </p>
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
              {...register('password', { required: 'Password is required' })}
              className='mt-1 block w-full p-2 border border-gray-300 rounded-md'
            />
            {errors.password && (
              <p className='text-red-500 text-sm mt-1'>
                {errors.password.message}
              </p>
            )}
          </div>
          <button
            type='submit'
            className='w-full bg-neutral-800 text-white py-2 rounded-md hover:bg-neutral-600'
          >
            Login
          </button>
        </form>
        <p className='mt-4 text-center'>
          Don’t have an account?{' '}
          <Link
            href='/create-account'
            className='text-blue-500 hover:underline'
          >
            Create one
          </Link>
        </p>
        <div className='flex items-center justify-center mt-3'>
          <Home />
        </div>
      </div>
    </div>
  )
}
