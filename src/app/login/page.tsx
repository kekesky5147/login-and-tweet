'use client'

import FormButton from '@/src/components/form-btn'
import FormInput from '@/src/components/form-input'
import SocialLogin from '@/src/components/social-login'
import { useFormState } from 'react-dom'
import { login } from './actions'
import Home from '@/src/components/backtohome'

// ActionState 타입 정의 (또는 actions.ts에서 가져오기)
// 별도 파일(/src/types/action-state.ts)로 분리 권장:
// import { ActionState } from '@/src/types/action-state';
type ActionState = {
  error?: string
  success?: boolean
  fieldErrors?: {
    email?: string[]
    password?: string[]
  }
} | null

export default function Login () {
  const [state, dispatch] = useFormState<ActionState, FormData>(login, null)

  return (
    <div className='flex flex-col gap-10 py-8 px-6'>
      <div className='flex flex-col gap-2 *:font-medium'>
        <h1 className='text-2xl'>안녕하세요!</h1>
        <h2 className='text-xl'>Log in to your account</h2>
      </div>
      <form action={dispatch} className='flex flex-col gap-3'>
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
        {state?.error && <p className='text-red-500'>{state.error}</p>}
        <FormButton text='Log in' />
      </form>
      <SocialLogin />
      <Home />
    </div>
  )
}
