import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-pink-50 to-white">
      <div className="text-center space-y-6 max-w-md">
        <h1 className="text-4xl font-bold text-gray-800">
          Oh My Baby
        </h1>
        <p className="text-gray-600 text-lg">
          소중한 순간을 가족과 함께
        </p>
        
        <div className="space-y-3 pt-6">
          <Link
            href="/login"
            className="block w-full py-3 px-6 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
          >
            로그인
          </Link>
          <Link
            href="/register"
            className="block w-full py-3 px-6 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg font-medium transition-colors"
          >
            회원가입
          </Link>
        </div>
      </div>
    </main>
  )
}
