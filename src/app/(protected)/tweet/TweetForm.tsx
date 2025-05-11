'use client'

import { useState } from 'react'
import { createTweet } from '@/src/app/actions'
import { CreateTweetResult } from '@/src/lib/types'

interface TweetFormProps {
  onSubmit: () => Promise<void>
}

export default function TweetForm ({ onSubmit }: TweetFormProps) {
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const formData = new FormData()
    formData.append('content', content)

    const result: CreateTweetResult = await createTweet(formData)
    console.log('TweetForm result:', result)
    if (result.errors) {
      setError(
        result.errors.content?.[0] ||
          result.errors.server?.[0] ||
          'Failed to create tweet.'
      )
    } else {
      await onSubmit()
      setContent('')
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className='p-4 bg-neutral-100 sticky top-0 z-10'
    >
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="What's happening?"
        className='w-full p-10 rounded-md border border-gray-300 focus:border-neutral-500 focus:outline-none'
        rows={4}
      />
      {error && <p className='text-sm text-red-600'>{error}</p>}
      <button
        type='submit'
        className='mt-2 w-full rounded-md bg-neutral-800 px-4 py-2 text-white hover:bg-neutral-900'
      >
        Tweet
      </button>
    </form>
  )
}
