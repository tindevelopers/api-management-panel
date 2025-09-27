import Link from 'next/link'

export default function TestPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Page</h1>
      <p>This is a test page to verify the application is working.</p>
      <div className="mt-4">
        <Link href="/admin/organizations" className="text-blue-600 hover:underline">
          Go to Organizations
        </Link>
      </div>
    </div>
  )
}
