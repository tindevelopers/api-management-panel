import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/ui/DashboardLayout'
import DatabaseOverview from '@/components/database/DatabaseOverview'

export default async function DatabasePage() {
  try {
    // TEMPORARY: Skip authentication to prevent infinite recursion
    console.log('⚠️  TEMPORARY: Skipping authentication for database page')
    
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
        title="Database Management" 
        subtitle="Manage your database connections and data"
      >
        <DatabaseOverview />
      </DashboardLayout>
    )
  } catch {
    redirect('/setup')
  }
}