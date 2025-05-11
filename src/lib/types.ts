export interface Tweet {
  id: number
  content: string
  createdAt: Date
  userId: number
  user: {
    nickname: string
  }
}

export interface UserProfile {
  id: number
  email: string
  nickname: string
  username: string | null
  bio: string | null
  phone: string | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateTweetResult {
  message: string
  tweetId?: number
  errors?: {
    content?: string[]
    server?: string[]
  }
}

export interface DeleteTweetResult {
  message: string
  errors?: {
    server?: string[]
    authorization?: string[]
  }
}

export interface CreateAccountResult {
  message: string
  userId?: number
  success?: boolean
  errors?: {
    email?: string[]
    password?: string[]
    nickname?: string[]
    username?: string[]
    phone?: string[]
    server?: string[]
  }
}
