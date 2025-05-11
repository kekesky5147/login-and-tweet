'use client'

import { useState, useEffect } from 'react'
import { useFormState } from 'react-dom'
import { smsLogin, logout } from '../actions'
import Input from '@/src/components/input'
import Button from '@/src/components/button'

interface LoginResult {
  message: string
  userId?: number
  success?: boolean
  errors?: {
    phone?: string[]
    server?: string[]
  }
}

export default function SMSLoginPage () {
  const [phone, setPhone] = useState('')
  const [userId, setUserId] = useState<number | null>(null)
  const [state, formAction] = useFormState(smsLogin, {
    message: '',
    success: false
  })

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch('/api/session')
        if (response.ok) {
          const session = await response.json()
          setUserId(session?.userId || null)
          console.log('Session userId:', session?.userId) // Debug log
        }
      } catch {
        setUserId(null)
      }
    }
    fetchSession()
  }, [])

  useEffect(() => {
    if (state.success) {
      window.location.href = '/profile'
    }
  }, [state.success])

  const handleLogout = async () => {
    const result = await logout()
    if (result.success) {
      setUserId(null) // 클라이언트 상태 업데이트
      window.location.href = '/login' // 로그아웃 후 리디렉션
    } else {
      console.error('Logout failed:', result.message)
    }
  }

  return (
    <div className='min-h-screen bg-neutral-100 p-4'>
      {userId && (
        <div className='fixed top-4 right-4'>
          <button
            type='button'
            onClick={handleLogout}
            className='bg-red-500 text-white text-sm px-3 py-1 rounded hover:bg-red-600'
          >
            Logout
          </button>
        </div>
      )}
      <h1 className='text-2xl font-bold'>SMS Login</h1>
      )T
      <form
        action={formAction}
        className='mt-4 flex flex-col gap-3 max-w-lg mx-auto'
      >
        <Input
          name='phone'
          type='text'
          placeholder='Enter your phone number (e.g., 01012345678)'
          required
          value={phone}
          onChange={e => setPhone(e.target.value)}
          className='w-full h-12 text-lg p-3'
        />
        {state.message && !state.success && (
          <p className='text-red-500'>{state.message}</p>
        )}
        <Button text='Login' />
      </form>
    </div>
  )
}
