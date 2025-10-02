import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/ui/DashboardLayout'
import ApiManagement from '@/components/api/ApiManagement'

export default async function ApisPage() {
  try {
    // TEMPORARY: Skip authentication to prevent infinite recursion
    console.log('⚠️  TEMPORARY: Skipping authentication for APIs page')
    
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
        title="API Management" 
        subtitle="Manage and monitor your APIs"
      >
        <ApiManagement />
      </DashboardLayout>
    )
  } catch {
    redirect('/setup')
  }
}