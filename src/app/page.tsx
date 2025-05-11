import Link from 'next/link'

export default function Home () {
  return (
    <div className='flex flex-col items-center justify-between min-h-screen p-6'>
      <div className='my-auto flex flex-col items-center gap-2 *:font-medium'>
        <span className='text-5xl'>⚡︎</span>
        <h1 className='text-2xl mt-7 '> Z Z Z Z Z W E E T</h1>
        <h2 className='text-1xl mt-2'>Make your new Tweet!</h2>
      </div>
      <div className='flex flex-col items-center gap-3 w-full mt-10'>
        <Link
          href='/create-account'
          className='w-[550px] bg-neutral-900 text-white text-lg font-medium py-2.5 rounded-md text-center hover:bg-neutral-700 transition-colors'
        >
          시작하기
        </Link>
        <div className='flex gap-5 '>
          <span className='text-neutral-500 mb-10'>이미 계정이 있나요?</span>
          <Link href='/login' className='hover:underline'>
            로그인
          </Link>
        </div>
      </div>
    </div>
  )
}
