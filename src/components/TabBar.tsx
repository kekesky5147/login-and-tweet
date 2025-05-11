'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { logout } from '@/src/app/auth-actions'
import {
  HomeIcon,
  ChatBubbleLeftIcon,
  UserIcon,
  ArrowLeftOnRectangleIcon
} from '@heroicons/react/24/outline'

interface TabBarProps {
  currentUserId: number | null
}

export default function TabBar ({ currentUserId }: TabBarProps) {
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleLogout = async () => {
    try {
      const result = await logout()
      if (result.success) {
        router.push('/login')
      } else {
        setError(result.message)
      }
    } catch (err) {
      console.error('Logout error:', err)
      setError('Failed to log out. Please try again.')
    }
  }

  return (
    <nav className='fixed bottom-0 left-0 right-0 bg-white shadow-t-md p-4 flex justify-around items-center'>
      <Link
        href='/newhome'
        className='flex flex-col items-center text-gray-700 hover:text-blue-500'
      >
        <HomeIcon className='h-6 w-6' />
        <span className='text-xs'>Home</span>
      </Link>
      <Link
        href='/tweet'
        className='flex flex-col items-center text-gray-700 hover:text-blue-500'
      >
        <ChatBubbleLeftIcon className='h-6 w-6' />
        <span className='text-xs'>Tweet</span>
      </Link>
      {currentUserId && (
        <Link
          href={`/profile/${currentUserId}`}
          className='flex flex-col items-center text-gray-700 hover:text-blue-500'
        >
          <UserIcon className='h-6 w-6' />
          <span className='text-xs'>Profile</span>
        </Link>
      )}
      <button
        onClick={handleLogout}
        className='flex flex-col items-center text-gray-700 hover:text-red-500'
      >
        <ArrowLeftOnRectangleIcon className='h-6 w-6' />
        <span className='text-xs'>Logout</span>
        {error && <p className='text-red-500 text-xs mt-1'>{error}</p>}
      </button>
    </nav>
  )
}
