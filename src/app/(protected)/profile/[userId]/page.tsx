'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  getTweetsByUsername,
  deleteTweet,
  getCurrentUser
} from '@/src/app/auth-actions'
import DeleteConfirmModal from '../../tweet/DeleteConfirmModal'
import { TrashIcon } from '@heroicons/react/24/outline'

interface Tweet {
  id: number
  content: string
  createdAt: Date
  userId: number
  user: {
    username: string | null
  }
}

interface User {
  id: number
  email: string
  username: string | null
}

interface ProfilePageProps {
  params: { userId: string }
}

export default function ProfilePage ({ params }: ProfilePageProps) {
  const [tweets, setTweets] = useState<Tweet[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTweetId, setSelectedTweetId] = useState<number | null>(null)

  const fetchUserTweets = useCallback(async (username: string) => {
    try {
      const fetchedTweets = await getTweetsByUsername(username)
      console.log('Fetched user tweets:', fetchedTweets)
      setTweets(fetchedTweets)
    } catch (error) {
      console.error('Fetch user tweets error:', error)
      setServerError('Failed to load tweets. Please try again.')
    }
  }, [])

  const fetchCurrentUser = useCallback(async () => {
    try {
      const user = await getCurrentUser()
      console.log('Current user:', user)
      if (user) {
        setCurrentUser(user)
        await fetchUserTweets(user.username || '')
      } else {
        setServerError('User not found. Please log in.')
      }
    } catch (error) {
      console.error('Fetch current user error:', error)
      setServerError('Failed to load user data. Please try again.')
    }
  }, [fetchUserTweets])

  useEffect(() => {
    fetchCurrentUser()
  }, [fetchCurrentUser])

  const handleDeleteClick = (tweetId: number) => {
    setSelectedTweetId(tweetId)
    setIsModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedTweetId) return

    try {
      const result = await deleteTweet(selectedTweetId)
      console.log('Delete tweet result:', result)

      if (result.errors) {
        setServerError(result.errors.server?.[0] || 'Failed to delete tweet.')
      } else {
        setSuccessMessage(result.message)
        if (currentUser) {
          await fetchUserTweets(currentUser.username || '')
        }
        setTimeout(() => {
          setSuccessMessage(null)
        }, 2000)
      }
    } catch (error) {
      console.error('Delete tweet error:', error)
      setServerError('Failed to delete tweet. Please try again.')
    }

    setIsModalOpen(false)
    setSelectedTweetId(null)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedTweetId(null)
  }

  return (
    <div className='flex items-center justify-center pt-8'>
      <div className='w-full max-w-2xl space-y-6 rounded-lg bg-white p-8 shadow-md'>
        <h1 className='text-2xl font-bold text-center'>Profile</h1>

        {currentUser && (
          <div className='text-center'>
            <p className='font-bold'>@{currentUser.username || 'unknown'}</p>
            <p className='text-gray-500'>{currentUser.email}</p>
          </div>
        )}

        {successMessage && (
          <p className='text-green-500 text-center'>{successMessage}</p>
        )}
        {serverError && (
          <p className='text-red-600 text-center'>{serverError}</p>
        )}

        <div className='space-y-4 mt-6'>
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
                {currentUser && tweet.userId === currentUser.id && (
                  <button
                    onClick={() => handleDeleteClick(tweet.id)}
                    className='text-red-500 hover:text-red-700'
                    title='Delete Tweet'
                  >
                    <TrashIcon className='h-5 w-5' />
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        <DeleteConfirmModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onConfirm={handleDeleteConfirm}
        />
      </div>
    </div>
  )
}
