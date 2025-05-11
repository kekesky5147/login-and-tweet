import { cookies } from 'next/headers'
import TabBar from '@/src/components/TabBar'

export default function ProtectedLayout ({
  children
}: {
  children: React.ReactNode
}) {
  const session = cookies().get('session')?.value
  const currentUserId = session ? JSON.parse(session).userId : null

  return (
    <div className='min-h-screen bg-neutral-100 pb-16'>
      {currentUserId && <TabBar currentUserId={currentUserId} />}
      {children}
    </div>
  )
}
