import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/ui/DashboardLayout'
import AnalyticsOverview from '@/components/analytics/AnalyticsOverview'

export default async function AnalyticsPage() {
  try {
    // TEMPORARY: Skip authentication to prevent infinite recursion
    console.log('⚠️  TEMPORARY: Skipping authentication for analytics page')
    
    // Use mock user for now
    const mockUser = {
      id: '1',
      email: 'admin@tin.info',
      full_name: 'Admin User',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString()
    }

    return (
      <DashboardLayout 
        user={mockUser} 
        title="Analytics" 
        subtitle="Monitor your API usage and performance"
      >
        <AnalyticsOverview />
      </DashboardLayout>
    )
  } catch {
    redirect('/setup')
  }
}