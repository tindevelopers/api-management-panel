import DashboardOverview from '@/components/dashboard/DashboardOverview'

export default async function DashboardPage() {
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

  return <DashboardOverview user={mockUser} />
}