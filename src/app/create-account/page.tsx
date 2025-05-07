'use client'

import FormButton from '@/src/components/form-btn'
import FormInput from '@/src/components/form-input'
import SocialLogin from '@/src/components/social-login'
import { useFormState } from 'react-dom'
import { createAccount } from './actions'
import Home from '@/src/components/backtohome'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

type ActionState = {
  error?: string
  success?: boolean
  fieldErrors?: {
    username?: string[]
    email?: string[]
    password?: string[]
    confirm_password?: string[]
  }
} | null

export default function CreateAccount () {
  const [state, dispatch] = useFormState<ActionState, FormData>(
    createAccount,
    null
  )
  const router = useRouter()

  // 성공 시 메시지 표시 후 리디렉션
  useEffect(() => {
    if (state?.success) {
      // 2초 후 로그인 페이지로 리디렉션
      const timer = setTimeout(() => {
        router.push('/login')
      })
      return () => clearTimeout(timer)
    }
  }, [state, router])

  return (
    <div className='flex flex-col gap-10 py-8 px-6'>
      <div className='flex flex-col gap-2 *:font-medium'>
        <h1 className='text-2xl'>안녕하세요!</h1>
        <h2 className='text-xl'>Fill in the form below to join!</h2>
      </div>
      <form action={dispatch} className='flex flex-col gap-3'>
        <FormInput
          name='username'
          type='text'
          placeholder='Username'
          required
          errors={state?.fieldErrors?.username}
        />
        <FormInput
          name='email'
          type='email'
          placeholder='Email'
          required
          errors={state?.fieldErrors?.email}
        />
        <FormInput
          name='password'
          type='password'
          placeholder='Password'
          required
          errors={state?.fieldErrors?.password}
        />
        <FormInput
          name='confirm_password'
          type='password'
          placeholder='Confirm Password'
          required
          errors={state?.fieldErrors?.confirm_password}
        />
        {state?.error && <p className='text-red-500'>{state.error}</p>}

        <FormButton text='Create account' />
      </form>
      <SocialLogin />
      <Home />
    </div>
  )
}
