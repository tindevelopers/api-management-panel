'use client'

import React from 'react'
import OrganizationManagement from '@/components/admin/OrganizationManagement'
import { SubscriptionPlan } from '@/types/multi-role'

export default function TestOrgPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Organization Management</h1>
      <p>Testing the OrganizationManagement component locally.</p>
      <div className="mt-4">
        <OrganizationManagement 
          initialOrganizations={[
            {
              id: '1',
              name: 'Test Organization',
              slug: 'test-org',
              description: 'A test organization',
              subscription_plan: SubscriptionPlan.FREE,
              max_users: 10,
              max_apis: 5,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ]}
        />
      </div>
    </div>
  )
}
