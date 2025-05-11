import Link from 'next/link'

export default function GotoLogin () {
  return (
    <Link
      href='/login'
      className='flex items-center justify-center text-xs hover:underline gap-2'
    >
      <span>L o g - i n</span>
    </Link>
  )
}
