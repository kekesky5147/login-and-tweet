'use client'

import { useState, useEffect, useRef } from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  createTweet,
  getTweets,
  deleteTweet,
  getCurrentUser
} from '@/src/app/auth-actions'
import DeleteConfirmModal from './DeleteConfirmModal'
import { TrashIcon } from '@heroicons/react/24/outline'
import { debounce } from 'lodash'

const CreateTweetFormSchema = z.object({
  content: z
    .string()
    .min(1, 'Tweet content cannot be empty')
    .max(280, 'Tweet cannot exceed 280 characters')
})

const SearchTweetsFormSchema = z.object({
  keyword: z.string().max(100, 'Keyword too long').optional()
})

type CreateTweetFormData = z.infer<typeof CreateTweetFormSchema>
type SearchTweetsFormData = z.infer<typeof SearchTweetsFormSchema>

interface CreateTweetResult {
  message: string
  tweetId?: number
  success?: boolean
  errors?: {
    content?: string[]
    server?: string[]
  }
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

interface User {
  id: number
  email: string
  username: string | null
}

export default function TweetPage () {
  const [tweets, setTweets] = useState<Tweet[]>([])
  const [filteredTweets, setFilteredTweets] = useState<Tweet[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTweetId, setSelectedTweetId] = useState<number | null>(null)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [keyword, setKeyword] = useState<string>('')
  const inputRef = useRef<HTMLInputElement>(null)

  const {
    register: registerTweet,
    handleSubmit: handleSubmitTweet,
    formState: { errors: tweetErrors, isSubmitting: isSubmittingTweet },
    reset: resetTweet
  } = useForm<CreateTweetFormData>({
    resolver: zodResolver(CreateTweetFormSchema)
  })

  const {
    register: registerSearch,
    handleSubmit: handleSubmitSearch,
    formState: { errors: searchErrors },
    reset: resetSearch,
    setValue: setSearchValue
  } = useForm<SearchTweetsFormData>({
    resolver: zodResolver(SearchTweetsFormSchema),
    defaultValues: {
      keyword: ''
    }
  })

  useEffect(() => {
    // Load search history from localStorage
    const history = JSON.parse(localStorage.getItem('searchHistory') || '[]')
    setSearchHistory(history)
  }, [])

  const saveSearchHistory = (newKeyword: string) => {
    if (!newKeyword) return
    const updatedHistory = [
      newKeyword,
      ...searchHistory.filter(k => k !== newKeyword)
    ].slice(0, 5) // Keep last 5 searches
    setSearchHistory(updatedHistory)
    localStorage.setItem('searchHistory', JSON.stringify(updatedHistory))
  }

  const fetchTweets = async () => {
    try {
      const fetchedTweets = await getTweets()
      console.log('Fetched tweets:', fetchedTweets)
      setTweets(fetchedTweets)
      setFilteredTweets(fetchedTweets) // Initial filtered tweets
    } catch (error) {
      console.error('Fetch tweets error:', error)
      setServerError('Failed to load tweets. Please try again.')
    }
  }

  const fetchCurrentUser = async () => {
    try {
      const user = await getCurrentUser()
      console.log('Current user:', user)
      setCurrentUser(user)
    } catch (error) {
      console.error('Fetch current user error:', error)
      setServerError('Failed to load user data. Please try again.')
    }
  }

  useEffect(() => {
    fetchTweets()
    fetchCurrentUser()
  }, [])

  const debouncedSearch = debounce((searchKeyword: string) => {
    console.log('debouncedSearch triggered:', {
      searchKeyword,
      tweetCount: tweets.length
    })
    if (!searchKeyword) {
      setFilteredTweets(tweets)
      console.log('No keyword, reset filteredTweets:', {
        filteredCount: tweets.length
      })
      return
    }
    const filtered = tweets.filter(tweet =>
      tweet.content.toLowerCase().includes(searchKeyword.toLowerCase())
    )
    setFilteredTweets(filtered)
    console.log('Filtered tweets:', { filteredCount: filtered.length })
    saveSearchHistory(searchKeyword)
  }, 100)

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newKeyword = e.target.value
    setKeyword(newKeyword)
    setSearchValue('keyword', newKeyword)
    debouncedSearch(newKeyword)
  }

  const onSubmitTweet = async (data: CreateTweetFormData) => {
    setServerError(null)
    setSuccessMessage(null)

    const formData = new FormData()
    formData.append('content', data.content)

    console.log('Create tweet form data:', data)

    try {
      const result = (await createTweet(formData)) as CreateTweetResult
      console.log('Create tweet result:', result)

      if (result.errors) {
        if (result.errors.content) {
          setServerError(result.errors.content[0])
        }
        if (result.errors.server) {
          setServerError(result.errors.server[0])
        }
      } else {
        setSuccessMessage(result.message)
        resetTweet()
        await fetchTweets()
        setTimeout(() => {
          setSuccessMessage(null)
        }, 2000)
      }
    } catch (error) {
      console.error('Client-side create tweet error:', error)
      setServerError('Unexpected error occurred. Please try again.')
    }
  }

  const onSubmitSearch: SubmitHandler<SearchTweetsFormData> = async data => {
    if (data.keyword) {
      setKeyword(data.keyword)
      debouncedSearch(data.keyword)
    }
  }

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
        await fetchTweets()
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
        <h1 className='text-2xl font-bold text-center'>Tweet</h1>

        {successMessage && (
          <p className='text-green-500 text-center'>{successMessage}</p>
        )}
        {serverError && (
          <p className='text-red-600 text-center'>{serverError}</p>
        )}

        <form
          onSubmit={handleSubmitSearch(onSubmitSearch)}
          className='space-y-4'
        >
          <div>
            <label
              htmlFor='keyword'
              className='block text-sm font-medium text-gray-700'
            >
              Search Tweets
            </label>
            <input
              id='keyword'
              type='text'
              {...registerSearch('keyword')}
              onChange={handleSearchInput}
              ref={inputRef}
              className='mt-1 w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none'
              placeholder='Enter keyword...'
            />
            {searchErrors.keyword && (
              <p className='mt-1 text-sm text-red-600'>
                {searchErrors.keyword.message}
              </p>
            )}
          </div>
        </form>

        <form onSubmit={handleSubmitTweet(onSubmitTweet)} className='space-y-4'>
          <div>
            <label
              htmlFor='content'
              className='block text-sm font-medium text-gray-700'
            >
              What's on your mind?
            </label>
            <textarea
              id='content'
              {...registerTweet('content')}
              className='mt-1 w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none'
              rows={4}
              placeholder='Write your tweet...'
            />
            {tweetErrors.content && (
              <p className='mt-1 text-sm text-red-600'>
                {tweetErrors.content.message}
              </p>
            )}
          </div>

          <button
            type='submit'
            disabled={isSubmittingTweet}
            className='w-full rounded-md bg-neutral-800 px-4 py-2 text-white hover:bg-neutral-900 disabled:opacity-50'
          >
            {isSubmittingTweet ? 'Posting...' : 'Post Tweet'}
          </button>
        </form>

        <div className='space-y-4 mt-6'>
          {filteredTweets.length === 0 ? (
            <p className='text-center text-gray-500'>
              {keyword ? `No tweets found for "${keyword}".` : 'No tweets yet.'}
            </p>
          ) : (
            filteredTweets.map(tweet => (
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
