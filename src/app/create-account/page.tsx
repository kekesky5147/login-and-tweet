'use client'

import FormButton from '@/src/components/form-btn'
import FormInput from '@/src/components/form-input'
import SocialLogin from '@/src/components/social-login'
import { useFormState } from 'react-dom'
import { createAccount } from './actions'
import Home from '@/src/components/backtohome'

export default function CreateAccount () {
  const [state, dispatch] = useFormState(createAccount, null)
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
        />
        <FormInput name='email' type='email' placeholder='Email' required />
        <FormInput
          name='password'
          type='password'
          placeholder='Password'
          required
        />
        <FormInput
          name='confirm_password'
          type='password'
          placeholder='Confirm Password'
          required
        />
        <FormButton text='Create account' />
      </form>
      <SocialLogin />
      <Home />
    </div>
  )
}
