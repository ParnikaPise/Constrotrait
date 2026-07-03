'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { UserRole, PERMISSIONS, ROLE_LABELS, getDefaultRoute } from '@/lib/roles'

export interface CurrentUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  roleLabel: string
  branch_id: string | null
  permissions: typeof PERMISSIONS
  defaultRoute: string
  can: (permission: keyof typeof PERMISSIONS) => boolean
}

export function useCurrentUser() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUser()
  }, [])

  const fetchUser = async () => {
    setLoading(true)
    const { data: authData } = await supabase.auth.getUser()
    
    if (!authData.user) {
      setLoading(false)
      return
    }

    const { data: emp } = await supabase
      .from('employees')
      .select('id, firstName, lastName, email, role_id, branch_id')
      .eq('email', authData.user.email)
      .single()

    if (emp) {
      const role = (emp.role_id || 'ENGINEER') as UserRole
      setCurrentUser({
        id: emp.id,
        email: emp.email,
        firstName: emp.firstName,
        lastName: emp.lastName,
        role,
        roleLabel: ROLE_LABELS[role] || role,
        branch_id: emp.branch_id,
        permissions: PERMISSIONS,
        defaultRoute: getDefaultRoute(role),
        can: (permission: keyof typeof PERMISSIONS) => PERMISSIONS[permission](role),
      })
    }

    setLoading(false)
  }

  return { currentUser, loading }
}
