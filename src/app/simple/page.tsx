export default function SimplePage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Simple Test Page</h1>
      <p>This page should work without authentication.</p>
      <div className="mt-4 space-y-2">
        <div>
          <a href="/test" className="text-blue-600 hover:underline block">
            Go to Test Page
          </a>
        </div>
        <div>
          <a href="/admin/organizations" className="text-blue-600 hover:underline block">
            Go to Organizations (should redirect to login)
          </a>
        </div>
      </div>
    </div>
  )
}
