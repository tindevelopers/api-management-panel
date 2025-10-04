export default function TestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-8">
      <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-2xl">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          🎉 Hello World!
        </h1>
        <p className="text-xl text-gray-700 mb-4">
          Tailwind CSS is working correctly!
        </p>
        <div className="space-y-4">
          <div className="bg-blue-100 border-l-4 border-blue-500 p-4 rounded">
            <p className="text-blue-700 font-semibold">✓ PostCSS configured</p>
          </div>
          <div className="bg-green-100 border-l-4 border-green-500 p-4 rounded">
            <p className="text-green-700 font-semibold">✓ Tailwind v4 installed</p>
          </div>
          <div className="bg-purple-100 border-l-4 border-purple-500 p-4 rounded">
            <p className="text-purple-700 font-semibold">✓ Styles are rendering</p>
          </div>
        </div>
        <div className="mt-8 flex gap-4">
          <a 
            href="/login" 
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
          >
            Go to Login
          </a>
          <a 
            href="/dashboard" 
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}
