export default function DebugEnv() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Environment Debug</h1>
      <div className="space-y-2">
        <p><strong>NEXT_PUBLIC_SUPABASE_URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET'}</p>
        <p><strong>NEXT_PUBLIC_SUPABASE_ANON_KEY:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET'}</p>
        <p><strong>NODE_ENV:</strong> {process.env.NODE_ENV || 'NOT SET'}</p>
      </div>
    </div>
  )
}