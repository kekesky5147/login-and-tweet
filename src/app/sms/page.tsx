'use client'

import { useState, useEffect } from 'react'
import { logout } from '../actions'
import Input from '@/src/components/input'
import Button from '@/src/components/button'

interface LoginResult {
  message: string
  success?: boolean
  errors?: {
    server?: string[]
  }
}

export default function SMSLoginPage () {
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<number | null>(null)

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

  const handleSubmit = async (formData: FormData): Promise<void> => {
    try {
      const response = await fetch('/api/sms-login', {
        method: 'POST',
        body: formData
      })
      const data: LoginResult = await response.json() // API 응답 파싱
      if (!response.ok || !data.success) {
        setError(data.message || 'Login failed. Please try again.')
        return
      }
      window.location.href = '/profile'
    } catch {
      setError('Server error. Please try again.')
    }
  }

  const onSubmit: React.FormEventHandler<HTMLFormElement> = async event => {
    event.preventDefault() // 기본 폼 제출 동작 방지
    const formData = new FormData(event.currentTarget)
    await handleSubmit(formData)
  }

  return (
    <div className='min-h-screen bg-neutral-100 p-4'>
      {userId && (
        <form action={logout} className='fixed top-4 right-4'>
          <button
            type='submit'
            className='bg-red-500 text-white text-sm px-3 py-1 rounded hover:bg-red-600'
          >
            Logout
          </button>
        </form>
      )}
      <h1 className='text-2xl font-bold'>SMS Login</h1>
      <form
        onSubmit={onSubmit}
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
        {error && <p className='text-red-500'>{error}</p>}
        <Button text='Login' />
      </form>
    </div>
  )
}
