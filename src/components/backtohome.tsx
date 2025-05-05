import Link from 'next/link'
import { HomeIcon } from '@heroicons/react/20/solid'

export default function Home () {
  return (
    <Link
      href='/'
      className='flex items-center justify-center text-xs hover:underline gap-2'
    >
      <HomeIcon className='h-6 w-6 text-gray-500' />
      <span>H O M E</span>
    </Link>
  )
}
