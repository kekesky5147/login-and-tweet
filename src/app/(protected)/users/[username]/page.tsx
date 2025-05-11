'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  getCurrentUser,
  getUserByUsername,
  getTweetsByUsername
} from '@/src/app/auth-actions'

interface User {
  id: number
  email: string
  username: string
  bio: string | null
}

interface Tweet {
  id: number
  content: string
  createdAt: Date
  userId: number
  user: {
    username: string | null
  }
}

interface ProfilePageProps {
  params: { username: string }
}

export default function ProfilePage ({ params }: ProfilePageProps) {
  const [user, setUser] = useState<User | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [tweets, setTweets] = useState<Tweet[]>([])
  const [serverError, setServerError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        console.log('Fetching profile data for username:', params.username)

        // Check session cookie
        const sessionCookie = document.cookie.includes('session=')
        console.log('Session cookie present:', sessionCookie)

        // Fetch profile user
        const profileUser = await getUserByUsername(params.username)
        console.log('Profile user fetched:', profileUser)
        if (!profileUser) {
          setServerError('User not found.')
          return
        }
        setUser(profileUser)

        // Fetch current user
        const loggedInUser = await getCurrentUser()
        console.log('Current user fetched:', loggedInUser)
        setCurrentUser(loggedInUser)

        // Fetch user tweets
        const userTweets = await getTweetsByUsername(params.username)
        console.log('User tweets fetched:', { count: userTweets.length })
        setTweets(userTweets)

        // Log profile data
        console.log('Profile data:', {
          currentUser: loggedInUser,
          user: profileUser,
          isOwnProfile: loggedInUser?.id === profileUser?.id
        })
      } catch (error) {
        console.error('Fetch profile data error:', error)
        setServerError('Failed to load profile data. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [params.username])

  if (serverError) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <p className='text-red-600'>{serverError}</p>
      </div>
    )
  }

  if (isLoading || !user) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <p>Loading...</p>
      </div>
    )
  }

  const isOwnProfile = currentUser?.id === user?.id
  console.log('Rendering Edit button:', isOwnProfile)

  return (
    <div className='flex items-center justify-center pt-8'>
      <div className='w-full max-w-2xl space-y-6 rounded-lg bg-white p-8 shadow-md overflow-visible'>
        <div className='flex justify-between items-center'>
          <h1 className='text-2xl font-bold'>Profile</h1>
          <div className='min-w-[120px]'>
            {isOwnProfile ? (
              <Link
                href={`/users/${user.username}/edit`}
                className='edit-button inline-block rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 transition-colors z-10'
              >
                Edit Profile
              </Link>
            ) : (
              <p className='text-gray-500'>Not your profile</p>
            )}
          </div>
        </div>

        <div className='space-y-2'>
          <p className='text-lg font-semibold'>@{user.username}</p>
          <p className='text-gray-700'>Email: {user.email}</p>
          <p className='text-gray-700'>Bio: {user.bio || 'No bio provided.'}</p>
        </div>

        <div className='space-y-4 mt-6'>
          <h2 className='text-xl font-semibold'>Tweets</h2>
          {tweets.length === 0 ? (
            <p className='text-center text-gray-500'>No tweets yet.</p>
          ) : (
            tweets.map(tweet => (
              <div
                key={tweet.id}
                className='flex justify-between items-start p-4 border-b border-gray-200'
              >
                <div>
                  <p className='font-bold'>
                    @{tweet.user.username || 'unknown'}
                  </p>
                  <p className='text-gray-700'>{tweet.content}</p>
                  <p className='text-sm text-gray-500'>
                    {new Date(tweet.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
