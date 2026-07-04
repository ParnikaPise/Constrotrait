// // 'use client'
// // import { useEffect, useState } from 'react'
// // import { usePathname, useRouter } from 'next/navigation'
// // import Link from 'next/link'
// // import { supabase } from '@/lib/supabase'
// // import { useCurrentUser } from '@/hooks/useCurrentUser'
// // import { UserRole, PERMISSIONS } from '@/lib/roles'
// // import {
// //   LayoutDashboard, Users, GitBranch, CalendarCheck, FileText,
// //   ClipboardList, CheckSquare, MessageSquare, BookOpen,
// //   TrendingUp, TrendingDown, DollarSign, ReceiptText, BarChart3,
// //   LogOut, Bell, Menu, X, Briefcase, Home
// // } from 'lucide-react'

// // // Define all possible menu items with role requirements
// // const ALL_MENU_ITEMS = [
// //   {
// //     section: 'Operations',
// //     items: [
// //       { label: 'Exec Dashboard',  href: '/dashboard',              icon: LayoutDashboard, permission: 'viewExecutiveDashboard' as keyof typeof PERMISSIONS },
// //       { label: 'My Dashboard',    href: '/dashboard/my',           icon: Home,            permission: null, onlyFor: ['ENGINEER', 'LAB_ASSISTANT', 'ADMIN_STAFF'] as UserRole[] },
// //       { label: 'Employees',       href: '/dashboard/employees',    icon: Users,           permission: 'manageEmployees' as keyof typeof PERMISSIONS },
// //       { label: 'Branches',        href: '/dashboard/branches',     icon: GitBranch,       permission: 'manageBranches' as keyof typeof PERMISSIONS },
// //       { label: 'Attendance',      href: '/dashboard/attendance',   icon: CalendarCheck,   permission: 'manageAttendance' as keyof typeof PERMISSIONS },
// //       { label: 'My Attendance',   href: '/dashboard/attendance/my',icon: CalendarCheck,   permission: null, onlyFor: ['ENGINEER', 'LAB_ASSISTANT', 'ADMIN_STAFF'] as UserRole[] },
// //       { label: 'Leave Management',href: '/dashboard/leaves',       icon: FileText,        permission: 'approveLeaves' as keyof typeof PERMISSIONS },
// //       { label: 'My Leaves',       href: '/dashboard/leaves/my',    icon: FileText,        permission: null, onlyFor: ['ENGINEER', 'LAB_ASSISTANT', 'ADMIN_STAFF'] as UserRole[] },
// //       { label: 'Worklogs & EOD',  href: '/dashboard/worklogs',     icon: ClipboardList,   permission: null }, // Everyone sees, but filtered by role inside page
// //       { label: 'Task Management', href: '/dashboard/tasks',        icon: CheckSquare,     permission: 'manageTasks' as keyof typeof PERMISSIONS },
// //       { label: 'My Tasks',        href: '/dashboard/tasks/my',     icon: CheckSquare,     permission: null, onlyFor: ['ENGINEER', 'LAB_ASSISTANT', 'ADMIN_STAFF'] as UserRole[] },
// //       { label: 'Comm. Center',    href: '/dashboard/announcements',icon: MessageSquare,   permission: null }, // Everyone
// //       { label: 'Rulebook',        href: '/dashboard/rulebook',     icon: BookOpen,        permission: null }, // Everyone
// //     ]
// //   },
// //   {
// //     section: 'Finance',
// //     items: [
// //       { label: 'Finance Dashboard',href: '/dashboard/finance',          icon: BarChart3,    permission: 'viewFinance' as keyof typeof PERMISSIONS },
// //       { label: 'Income',           href: '/dashboard/finance/income',   icon: TrendingUp,   permission: 'viewFinance' as keyof typeof PERMISSIONS },
// //       { label: 'Expenses',         href: '/dashboard/finance/expenses', icon: TrendingDown, permission: 'viewFinance' as keyof typeof PERMISSIONS },
// //       { label: 'Receivables',      href: '/dashboard/finance/receivables', icon: ReceiptText, permission: 'viewFinance' as keyof typeof PERMISSIONS },
// //       { label: 'Reports',          href: '/dashboard/finance/reports',  icon: FileText,     permission: 'viewFinance' as keyof typeof PERMISSIONS },
// //     ]
// //   },
// //   {
// //     section: 'HR & Payroll',
// //     items: [
// //       { label: 'Payroll',   href: '/dashboard/payroll',   icon: DollarSign, permission: 'managePayroll' as keyof typeof PERMISSIONS },
// //       { label: 'Projects',  href: '/dashboard/projects',  icon: Briefcase,  permission: 'manageTasks' as keyof typeof PERMISSIONS },
// //     ]
// //   }
// // ]

// // export default function DashboardLayout({ children }: { children: React.ReactNode }) {
// //   const pathname = usePathname()
// //   const router = useRouter()
// //   const { currentUser, loading: userLoading } = useCurrentUser()
// //   const [sidebarOpen, setSidebarOpen] = useState(true)

// //   useEffect(() => {
// //     supabase.auth.getUser().then(({ data }) => {
// //       if (!data.user) router.push('/login')
// //     })
// //   }, [])

// //   // Redirect user based on their role when they land on /dashboard
// //   useEffect(() => {
// //     if (userLoading) return // Still loading, wait
    
// //     if (!currentUser) {
// //       // User is authenticated but has no employee record yet — check auth state
// //       supabase.auth.getUser().then(({ data }) => {
// //         if (!data.user) router.push('/login')
// //         // If logged in but no employee profile, stay (or show limited view)
// //       })
// //       return
// //     }

// //     if (pathname === '/dashboard' && !currentUser.can('viewExecutiveDashboard')) {
// //       router.replace(currentUser.defaultRoute)
// //     }
// //   }, [userLoading, currentUser, pathname])

// //   const handleLogout = async () => {
// //     await supabase.auth.signOut()
// //     router.push('/login')
// //   }

// //   // Role → which section name should appear first
// //   const SECTION_PRIORITY: Partial<Record<string, string>> = {
// //     HR:         'HR & Payroll',
// //     ACCOUNTANT: 'Finance',
// //     // SUPER_ADMIN / CEO see everything, keep default order
// //   }

// //   // Filter menu items based on user role, then reorder sections by priority
// //   const getVisibleMenu = () => {
// //     if (!currentUser) {
// //       // Fallback: show minimal menu while loading or if no employee profile
// //       return [{
// //         section: 'General',
// //         priority: false,
// //         items: [
// //           { label: 'Comm. Center', href: '/dashboard/announcements', icon: MessageSquare },
// //           { label: 'Rulebook', href: '/dashboard/rulebook', icon: BookOpen },
// //         ]
// //       }]
// //     }

// //     // 1. Filter items per group
// //     const filtered = ALL_MENU_ITEMS.map(group => {
// //       const visibleItems = group.items.filter(item => {
// //         if ('onlyFor' in item && item.onlyFor) {
// //           return item.onlyFor.includes(currentUser.role)
// //         }
// //         if (item.permission) {
// //           return currentUser.can(item.permission)
// //         }
// //         return true
// //       })
// //       return { ...group, priority: false, items: visibleItems }
// //     }).filter(group => group.items.length > 0)

// //     // 2. Reorder: move the role's priority section to the top
// //     const prioritySection = SECTION_PRIORITY[currentUser.role]
// //     if (prioritySection) {
// //       const idx = filtered.findIndex(g => g.section === prioritySection)
// //       if (idx > 0) {
// //         const [topGroup] = filtered.splice(idx, 1)
// //         topGroup.priority = true   // flag to render a highlight on the label
// //         filtered.unshift(topGroup)
// //       }
// //     }

// //     return filtered
// //   }

// //   const visibleMenu = getVisibleMenu()
// //   const displayName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : ''
// //   const initials = currentUser 
// //     ? `${currentUser.firstName?.[0] || ''}${currentUser.lastName?.[0] || ''}`.toUpperCase()
// //     : '??'

// //   return (
// //     <div className="app-layout">
// //       {/* Sidebar */}
// //       <aside className="sidebar" style={{ transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)' }}>
// //         <div className="sidebar-logo">
// //           <div className="sidebar-logo-icon">C</div>
// //           <div>
// //             <div className="sidebar-logo-text">Constrotrait</div>
// //             <div className="sidebar-logo-sub">Material Testing</div>
// //           </div>
// //         </div>

// //         <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
// //           {visibleMenu.map((group) => (
// //             <div key={group.section} className="sidebar-section">
// //               <div
// //                 className="sidebar-section-label"
// //                 style={group.priority ? {
// //                   color: 'var(--accent, #7c6ef5)',
// //                   display: 'flex',
// //                   alignItems: 'center',
// //                   gap: '6px',
// //                 } : undefined}
// //               >
// //                 {group.priority && (
// //                   <span style={{
// //                     display: 'inline-block',
// //                     width: '6px',
// //                     height: '6px',
// //                     borderRadius: '50%',
// //                     background: 'var(--accent, #7c6ef5)',
// //                     flexShrink: 0,
// //                   }} />
// //                 )}
// //                 {group.section}
// //               </div>
// //               {group.items.map((item) => {
// //                 const isActive = pathname === item.href
// //                 const Icon = item.icon
// //                 return (
// //                   <Link key={item.href} href={item.href} className={`sidebar-item ${isActive ? 'active' : ''}`}>
// //                     <Icon size={16} />
// //                     {item.label}
// //                   </Link>
// //                 )
// //               })}
// //             </div>
// //           ))}
// //         </nav>

// //         {/* User section */}
// //         <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
// //           <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
// //             <div className="avatar">{initials}</div>
// //             <div style={{ flex: 1, overflow: 'hidden' }}>
// //               <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
// //                 {displayName || currentUser?.email}
// //               </div>
// //               <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
// //                 {currentUser?.roleLabel || 'Loading...'}
// //               </div>
// //             </div>
// //           </div>
// //           <button onClick={handleLogout} className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
// //             <LogOut size={14} /> Sign Out
// //           </button>
// //         </div>
// //       </aside>

// //       {/* Main */}
// //       <main className="main-content">
// //         {/* Top bar */}
// //         <div className="topbar">
// //           <button
// //             onClick={() => setSidebarOpen(!sidebarOpen)}
// //             style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px' }}
// //           >
// //             {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
// //           </button>
// //           <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
// //             <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', position: 'relative' }}>
// //               <Bell size={20} />
// //             </button>
// //             <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '11px' }}>{initials}</div>
// //           </div>
// //         </div>
// //         <div>{children}</div>
// //       </main>
// //     </div>
// //   )
// // }


// 'use client'
// import { useEffect, useState } from 'react'
// import { usePathname, useRouter } from 'next/navigation'
// import Link from 'next/link'
// import { supabase } from '@/lib/supabase'
// import { useCurrentUser } from '@/hooks/useCurrentUser'
// import { UserRole, PERMISSIONS } from '@/lib/roles'
// import {
//   LayoutDashboard, Users, GitBranch, CalendarCheck, FileText,
//   ClipboardList, CheckSquare, MessageSquare, BookOpen,
//   TrendingUp, TrendingDown, DollarSign, ReceiptText, BarChart3,
//   LogOut, Bell, Menu, X, Briefcase, Home
// } from 'lucide-react'

// // Define all possible menu items with role requirements
// const ALL_MENU_ITEMS = [
//   {
//     section: 'Operations',
//     items: [
//       { label: 'Exec Dashboard',  href: '/dashboard',               icon: LayoutDashboard, permission: 'viewExecutiveDashboard' as keyof typeof PERMISSIONS },
//       { label: 'My Dashboard',    href: '/dashboard/my',            icon: Home,            permission: null, onlyFor: ['ENGINEER', 'LAB_ASSISTANT', 'ADMIN_STAFF'] as UserRole[] },
//       { label: 'Employees',       href: '/dashboard/employees',     icon: Users,           permission: 'manageEmployees' as keyof typeof PERMISSIONS },
//       { label: 'Branches',        href: '/dashboard/branches',      icon: GitBranch,       permission: 'manageBranches' as keyof typeof PERMISSIONS },
//       { label: 'Attendance',      href: '/dashboard/attendance',    icon: CalendarCheck,   permission: 'manageAttendance' as keyof typeof PERMISSIONS },
//       { label: 'My Attendance',   href: '/dashboard/attendance/my', icon: CalendarCheck,   permission: null, onlyFor: ['ENGINEER', 'LAB_ASSISTANT', 'ADMIN_STAFF'] as UserRole[] },
//       { label: 'Leave Management',href: '/dashboard/leaves',        icon: FileText,        permission: 'approveLeaves' as keyof typeof PERMISSIONS },
//       { label: 'My Leaves',       href: '/dashboard/leaves/my',     icon: FileText,        permission: null, onlyFor: ['ENGINEER', 'LAB_ASSISTANT', 'ADMIN_STAFF'] as UserRole[] },
//       { label: 'Worklogs & EOD',  href: '/dashboard/worklogs',      icon: ClipboardList,   permission: null },
//       { label: 'Task Management', href: '/dashboard/tasks',         icon: CheckSquare,     permission: 'manageTasks' as keyof typeof PERMISSIONS },
//       { label: 'My Tasks',        href: '/dashboard/tasks/my',      icon: CheckSquare,     permission: null, onlyFor: ['ENGINEER', 'LAB_ASSISTANT', 'ADMIN_STAFF'] as UserRole[] },
//       { label: 'Comm. Center',    href: '/dashboard/announcements', icon: MessageSquare,   permission: null },
//       { label: 'Rulebook',        href: '/dashboard/rulebook',      icon: BookOpen,        permission: null },
//     ]
//   },
//   {
//     section: 'Finance',
//     items: [
//       { label: 'Finance Dashboard', href: '/dashboard/finance',             icon: BarChart3,    permission: 'viewFinance' as keyof typeof PERMISSIONS },
//       { label: 'Income',            href: '/dashboard/finance/income',      icon: TrendingUp,   permission: 'viewFinance' as keyof typeof PERMISSIONS },
//       { label: 'Expenses',          href: '/dashboard/finance/expenses',    icon: TrendingDown, permission: 'viewFinance' as keyof typeof PERMISSIONS },
//       { label: 'Receivables',       href: '/dashboard/finance/receivables', icon: ReceiptText,  permission: 'viewFinance' as keyof typeof PERMISSIONS },
//       { label: 'Reports',           href: '/dashboard/finance/reports',     icon: FileText,     permission: 'viewFinance' as keyof typeof PERMISSIONS },
//     ]
//   },
//   {
//     section: 'HR & Payroll',
//     items: [
//       { label: 'Payroll',  href: '/dashboard/payroll',  icon: DollarSign, permission: 'managePayroll' as keyof typeof PERMISSIONS },
//       { label: 'Projects', href: '/dashboard/projects', icon: Briefcase,  permission: 'manageTasks'   as keyof typeof PERMISSIONS },
//     ]
//   }
// ]

// // Role → which section floats to the TOP of the sidebar
// // To add a new role, just add another entry here
// const SECTION_PRIORITY: Partial<Record<string, string>> = {
//   HR:         'HR & Payroll',
//   ACCOUNTANT: 'Finance',
// }

// export default function DashboardLayout({ children }: { children: React.ReactNode }) {
//   const pathname = usePathname()
//   const router   = useRouter()
//   const { currentUser, loading: userLoading } = useCurrentUser()
//   const [sidebarOpen, setSidebarOpen] = useState(true)

//   useEffect(() => {
//     supabase.auth.getUser().then(({ data }) => {
//       if (!data.user) router.push('/login')
//     })
//   }, [])

//   useEffect(() => {
//     if (userLoading) return

//     if (!currentUser) {
//       supabase.auth.getUser().then(({ data }) => {
//         if (!data.user) router.push('/login')
//       })
//       return
//     }

//     if (pathname === '/dashboard' && !currentUser.can('viewExecutiveDashboard')) {
//       router.replace(currentUser.defaultRoute)
//     }
//   }, [userLoading, currentUser, pathname])

//   const handleLogout = async () => {
//     await supabase.auth.signOut()
//     router.push('/login')
//   }

//   const getVisibleMenu = () => {
//     if (!currentUser) {
//       return [{
//         section: 'General',
//         priority: false,
//         items: [
//           { label: 'Comm. Center', href: '/dashboard/announcements', icon: MessageSquare },
//           { label: 'Rulebook',     href: '/dashboard/rulebook',      icon: BookOpen },
//         ]
//       }]
//     }

//     // Step 1: filter items based on role/permissions
//     const filtered = ALL_MENU_ITEMS.map(group => {
//       const visibleItems = group.items.filter(item => {
//         if ('onlyFor' in item && item.onlyFor) {
//           return item.onlyFor.includes(currentUser.role)
//         }
//         if (item.permission) {
//           return currentUser.can(item.permission)
//         }
//         return true
//       })
//       return { ...group, priority: false, items: visibleItems }
//     }).filter(group => group.items.length > 0)

//     // Step 2: move the role's priority section to the top
//     const prioritySection = SECTION_PRIORITY[currentUser.role]
//     if (prioritySection) {
//       const idx = filtered.findIndex(g => g.section === prioritySection)
//       if (idx > 0) {
//         const [topGroup] = filtered.splice(idx, 1)
//         topGroup.priority = true
//         filtered.unshift(topGroup)
//       }
//     }

//     return filtered
//   }

//   const visibleMenu = getVisibleMenu()
//   const displayName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : ''
//   const initials    = currentUser
//     ? `${currentUser.firstName?.[0] || ''}${currentUser.lastName?.[0] || ''}`.toUpperCase()
//     : '??'

//   return (
//     <div className="app-layout">

//       {/* Sidebar */}
//       <aside className="sidebar" style={{ transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)' }}>

//         <div className="sidebar-logo">
//           <div className="sidebar-logo-icon">C</div>
//           <div>
//             <div className="sidebar-logo-text">Constrotrait</div>
//             <div className="sidebar-logo-sub">Material Testing</div>
//           </div>
//         </div>

//         <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
//           {visibleMenu.map((group) => (
//             <div key={group.section} className="sidebar-section">

//               {/* Section label — highlighted for priority section */}
//               <div
//                 className="sidebar-section-label"
//                 style={group.priority ? {
//                   color:      'var(--accent, #7c6ef5)',
//                   display:    'flex',
//                   alignItems: 'center',
//                   gap:        '6px',
//                 } : undefined}
//               >
//                 {group.priority && (
//                   <span style={{
//                     display:      'inline-block',
//                     width:        '6px',
//                     height:       '6px',
//                     borderRadius: '50%',
//                     background:   'var(--accent, #7c6ef5)',
//                     flexShrink:   0,
//                   }} />
//                 )}
//                 {group.section}
//               </div>

//               {group.items.map((item) => {
//                 const isActive = pathname === item.href
//                 const Icon = item.icon
//                 return (
//                   <Link
//                     key={item.href}
//                     href={item.href}
//                     className={`sidebar-item ${isActive ? 'active' : ''}`}
//                   >
//                     <Icon size={16} />
//                     {item.label}
//                   </Link>
//                 )
//               })}
//             </div>
//           ))}
//         </nav>

//         {/* User / logout */}
//         <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
//           <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
//             <div className="avatar">{initials}</div>
//             <div style={{ flex: 1, overflow: 'hidden' }}>
//               <div style={{
//                 fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)',
//                 whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
//               }}>
//                 {displayName || currentUser?.email}
//               </div>
//               <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
//                 {currentUser?.roleLabel || 'Loading...'}
//               </div>
//             </div>
//           </div>
//           <button
//             onClick={handleLogout}
//             className="btn btn-secondary btn-sm"
//             style={{ width: '100%', justifyContent: 'center' }}
//           >
//             <LogOut size={14} /> Sign Out
//           </button>
//         </div>

//       </aside>

//       {/* Main content */}
//       <main className="main-content">
//         <div className="topbar">
//           <button
//             onClick={() => setSidebarOpen(!sidebarOpen)}
//             style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px' }}
//           >
//             {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
//           </button>
//           <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
//             <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', position: 'relative' }}>
//               <Bell size={20} />
//             </button>
//             <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '11px' }}>
//               {initials}
//             </div>
//           </div>
//         </div>
//         <div>{children}</div>
//       </main>

//     </div>
//   )
// }

// 'use client'
// import { useEffect, useState } from 'react'
// import { usePathname, useRouter } from 'next/navigation'
// import Link from 'next/link'
// import { supabase } from '@/lib/supabase'
// import { useCurrentUser } from '@/hooks/useCurrentUser'
// import { UserRole, PERMISSIONS } from '@/lib/roles'
// import {
//   LayoutDashboard, Users, GitBranch, CalendarCheck, FileText,
//   ClipboardList, CheckSquare, MessageSquare, BookOpen,
//   TrendingUp, TrendingDown, DollarSign, ReceiptText, BarChart3,
//   LogOut, Bell, Menu, X, Briefcase, Home
// } from 'lucide-react'

// // Define all possible menu items with role requirements
// const ALL_MENU_ITEMS = [
//   {
//     section: 'Operations',
//     items: [
//       { label: 'Exec Dashboard',  href: '/dashboard',               icon: LayoutDashboard, permission: 'viewExecutiveDashboard' as keyof typeof PERMISSIONS },
//       { label: 'My Dashboard',    href: '/dashboard/my',            icon: Home,            permission: null, onlyFor: ['ENGINEER', 'LAB_ASSISTANT', 'ADMIN_STAFF'] as UserRole[] },
//       { label: 'Employees',       href: '/dashboard/employees',     icon: Users,           permission: 'manageEmployees' as keyof typeof PERMISSIONS },
//       { label: 'Branches',        href: '/dashboard/branches',      icon: GitBranch,       permission: 'manageBranches' as keyof typeof PERMISSIONS },
//       { label: 'Attendance',      href: '/dashboard/attendance',    icon: CalendarCheck,   permission: 'manageAttendance' as keyof typeof PERMISSIONS },
//       { label: 'My Attendance',   href: '/dashboard/attendance/my', icon: CalendarCheck,   permission: null, onlyFor: ['ENGINEER', 'LAB_ASSISTANT', 'ADMIN_STAFF'] as UserRole[] },
//       { label: 'Leave Management',href: '/dashboard/leaves',        icon: FileText,        permission: 'approveLeaves' as keyof typeof PERMISSIONS },
//       { label: 'My Leaves',       href: '/dashboard/leaves/my',     icon: FileText,        permission: null, onlyFor: ['ENGINEER', 'LAB_ASSISTANT', 'ADMIN_STAFF'] as UserRole[] },
//       { label: 'Worklogs & EOD',  href: '/dashboard/worklogs',      icon: ClipboardList,   permission: null },
//       { label: 'Task Management', href: '/dashboard/tasks',         icon: CheckSquare,     permission: 'manageTasks' as keyof typeof PERMISSIONS },
//       { label: 'My Tasks',        href: '/dashboard/tasks/my',      icon: CheckSquare,     permission: null, onlyFor: ['ENGINEER', 'LAB_ASSISTANT', 'ADMIN_STAFF'] as UserRole[] },
//       { label: 'Comm. Center',    href: '/dashboard/announcements', icon: MessageSquare,   permission: null },
//       { label: 'Rulebook',        href: '/dashboard/rulebook',      icon: BookOpen,        permission: null },
//     ]
//   },
//   {
//     section: 'Finance',
//     items: [
//       { label: 'Finance Dashboard', href: '/dashboard/finance',             icon: BarChart3,    permission: 'viewFinance' as keyof typeof PERMISSIONS },
//       { label: 'Income',            href: '/dashboard/finance/income',      icon: TrendingUp,   permission: 'viewFinance' as keyof typeof PERMISSIONS },
//       { label: 'Expenses',          href: '/dashboard/finance/expenses',    icon: TrendingDown, permission: 'viewFinance' as keyof typeof PERMISSIONS },
//       { label: 'Receivables',       href: '/dashboard/finance/receivables', icon: ReceiptText,  permission: 'viewFinance' as keyof typeof PERMISSIONS },
//       { label: 'Reports',           href: '/dashboard/finance/reports',     icon: FileText,     permission: 'viewFinance' as keyof typeof PERMISSIONS },
//     ]
//   },
//   {
//     section: 'HR & Payroll',
//     items: [
//       { label: 'Payroll',  href: '/dashboard/payroll',  icon: DollarSign, permission: 'managePayroll'  as keyof typeof PERMISSIONS },
//       { label: 'Projects', href: '/dashboard/projects', icon: Briefcase,  permission: 'manageProjects' as keyof typeof PERMISSIONS },
//     ]
//   }
// ]

// // Role → which section floats to the TOP of the sidebar
// // To add a new role, just add another entry here
// const SECTION_PRIORITY: Partial<Record<string, string>> = {
//   HR:         'HR & Payroll',
//   ACCOUNTANT: 'Finance',
// }

// export default function DashboardLayout({ children }: { children: React.ReactNode }) {
//   const pathname = usePathname()
//   const router   = useRouter()
//   const { currentUser, loading: userLoading } = useCurrentUser()
//   const [sidebarOpen, setSidebarOpen] = useState(true)

//   useEffect(() => {
//     supabase.auth.getUser().then(({ data }) => {
//       if (!data.user) router.push('/login')
//     })
//   }, [])

//   useEffect(() => {
//     if (userLoading) return

//     if (!currentUser) {
//       supabase.auth.getUser().then(({ data }) => {
//         if (!data.user) router.push('/login')
//       })
//       return
//     }

//     if (pathname === '/dashboard' && !currentUser.can('viewExecutiveDashboard')) {
//       router.replace(currentUser.defaultRoute)
//     }
//   }, [userLoading, currentUser, pathname])

//   const handleLogout = async () => {
//     await supabase.auth.signOut()
//     router.push('/login')
//   }

//   const getVisibleMenu = () => {
//     if (!currentUser) {
//       return [{
//         section: 'General',
//         priority: false,
//         items: [
//           { label: 'Comm. Center', href: '/dashboard/announcements', icon: MessageSquare },
//           { label: 'Rulebook',     href: '/dashboard/rulebook',      icon: BookOpen },
//         ]
//       }]
//     }

//     // Step 1: filter items based on role/permissions
//     const filtered = ALL_MENU_ITEMS.map(group => {
//       const visibleItems = group.items.filter(item => {
//         if ('onlyFor' in item && item.onlyFor) {
//           return item.onlyFor.includes(currentUser.role)
//         }
//         if (item.permission) {
//           return currentUser.can(item.permission)
//         }
//         return true
//       })
//       return { ...group, priority: false, items: visibleItems }
//     }).filter(group => group.items.length > 0)

//     // Step 2: move the role's priority section to the top
//     const prioritySection = SECTION_PRIORITY[currentUser.role]
//     if (prioritySection) {
//       const idx = filtered.findIndex(g => g.section === prioritySection)
//       if (idx > 0) {
//         const [topGroup] = filtered.splice(idx, 1)
//         topGroup.priority = true
//         filtered.unshift(topGroup)
//       }
//     }

//     return filtered
//   }

//   const visibleMenu = getVisibleMenu()
//   const displayName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : ''
//   const initials    = currentUser
//     ? `${currentUser.firstName?.[0] || ''}${currentUser.lastName?.[0] || ''}`.toUpperCase()
//     : '??'

//   return (
//     <div className="app-layout">

//       {/* Sidebar */}
//       <aside className="sidebar" style={{ transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)' }}>

//         <div className="sidebar-logo">
//           <div className="sidebar-logo-icon">C</div>
//           <div>
//             <div className="sidebar-logo-text">Constrotrait</div>
//             <div className="sidebar-logo-sub">Material Testing</div>
//           </div>
//         </div>

//         <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
//           {visibleMenu.map((group) => (
//             <div key={group.section} className="sidebar-section">

//               {/* Section label — highlighted for priority section */}
//               <div
//                 className="sidebar-section-label"
//                 style={group.priority ? {
//                   color:      'var(--accent, #7c6ef5)',
//                   display:    'flex',
//                   alignItems: 'center',
//                   gap:        '6px',
//                 } : undefined}
//               >
//                 {group.priority && (
//                   <span style={{
//                     display:      'inline-block',
//                     width:        '6px',
//                     height:       '6px',
//                     borderRadius: '50%',
//                     background:   'var(--accent, #7c6ef5)',
//                     flexShrink:   0,
//                   }} />
//                 )}
//                 {group.section}
//               </div>

//               {group.items.map((item) => {
//                 const isActive = pathname === item.href
//                 const Icon = item.icon
//                 return (
//                   <Link
//                     key={item.href}
//                     href={item.href}
//                     className={`sidebar-item ${isActive ? 'active' : ''}`}
//                   >
//                     <Icon size={16} />
//                     {item.label}
//                   </Link>
//                 )
//               })}
//             </div>
//           ))}
//         </nav>

//         {/* User / logout */}
//         <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
//           <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
//             <div className="avatar">{initials}</div>
//             <div style={{ flex: 1, overflow: 'hidden' }}>
//               <div style={{
//                 fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)',
//                 whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
//               }}>
//                 {displayName || currentUser?.email}
//               </div>
//               <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
//                 {currentUser?.roleLabel || 'Loading...'}
//               </div>
//             </div>
//           </div>
//           <button
//             onClick={handleLogout}
//             className="btn btn-secondary btn-sm"
//             style={{ width: '100%', justifyContent: 'center' }}
//           >
//             <LogOut size={14} /> Sign Out
//           </button>
//         </div>

//       </aside>

//       {/* Main content */}
//       <main className="main-content">
//         <div className="topbar">
//           <button
//             onClick={() => setSidebarOpen(!sidebarOpen)}
//             style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px' }}
//           >
//             {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
//           </button>
//           <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
//             <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', position: 'relative' }}>
//               <Bell size={20} />
//             </button>
//             <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '11px' }}>
//               {initials}
//             </div>
//           </div>
//         </div>
//         <div>{children}</div>
//       </main>

//     </div>
//   )
// }


'use client'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { UserRole, PERMISSIONS } from '@/lib/roles'
import {
  LayoutDashboard, Users, GitBranch, CalendarCheck, FileText,
  ClipboardList, CheckSquare, MessageSquare, BookOpen,
  TrendingUp, TrendingDown, DollarSign, ReceiptText, BarChart3,
  LogOut, Bell, Menu, X, Briefcase, Home
} from 'lucide-react'

// Define all possible menu items with role requirements
const ALL_MENU_ITEMS = [
  {
    section: 'Operations',
    items: [
      { label: 'Exec Dashboard',  href: '/dashboard',               icon: LayoutDashboard, permission: 'viewExecutiveDashboard' as keyof typeof PERMISSIONS },
      { label: 'My Dashboard',    href: '/dashboard/my',            icon: Home,            permission: null, onlyFor: ['ENGINEER', 'LAB_ASSISTANT', 'ADMIN_STAFF'] as UserRole[] },
      { label: 'Employees',       href: '/dashboard/employees',     icon: Users,           permission: 'manageEmployees' as keyof typeof PERMISSIONS },
      { label: 'Branches',        href: '/dashboard/branches',      icon: GitBranch,       permission: 'manageBranches' as keyof typeof PERMISSIONS },
      { label: 'Attendance',      href: '/dashboard/attendance',    icon: CalendarCheck,   permission: 'manageAttendance' as keyof typeof PERMISSIONS },
      { label: 'My Attendance',   href: '/dashboard/attendance/my', icon: CalendarCheck,   permission: null, onlyFor: ['ENGINEER', 'LAB_ASSISTANT', 'ADMIN_STAFF'] as UserRole[] },
      { label: 'Leave Management',href: '/dashboard/leaves',        icon: FileText,        permission: 'approveLeaves' as keyof typeof PERMISSIONS },
      { label: 'My Leaves',       href: '/dashboard/leaves/my',     icon: FileText,        permission: null, onlyFor: ['ENGINEER', 'LAB_ASSISTANT', 'ADMIN_STAFF'] as UserRole[] },
      { label: 'Worklogs & EOD',  href: '/dashboard/worklogs',      icon: ClipboardList,   permission: null },
      { label: 'Task Management', href: '/dashboard/tasks',         icon: CheckSquare,     permission: 'manageTasks' as keyof typeof PERMISSIONS },
      { label: 'My Tasks',        href: '/dashboard/tasks/my',      icon: CheckSquare,     permission: null, onlyFor: ['ENGINEER', 'LAB_ASSISTANT', 'ADMIN_STAFF'] as UserRole[] },
      { label: 'Comm. Center',    href: '/dashboard/announcements', icon: MessageSquare,   permission: null },
      { label: 'Rulebook',        href: '/dashboard/rulebook',      icon: BookOpen,        permission: null },
    ]
  },
  {
    section: 'Finance',
    items: [
      { label: 'Finance Dashboard', href: '/dashboard/finance',             icon: BarChart3,    permission: 'viewFinance' as keyof typeof PERMISSIONS },
      { label: 'Income',            href: '/dashboard/finance/income',      icon: TrendingUp,   permission: 'viewFinance' as keyof typeof PERMISSIONS },
      { label: 'Expenses',          href: '/dashboard/finance/expenses',    icon: TrendingDown, permission: 'viewFinance' as keyof typeof PERMISSIONS },
      { label: 'Receivables',       href: '/dashboard/finance/receivables', icon: ReceiptText,  permission: 'viewFinance' as keyof typeof PERMISSIONS },
      { label: 'Reports',           href: '/dashboard/finance/reports',     icon: FileText,     permission: 'viewFinance' as keyof typeof PERMISSIONS },
    ]
  },
  {
    section: 'HR & Payroll',
    items: [
      { label: 'Payroll',  href: '/dashboard/payroll',  icon: DollarSign, permission: 'managePayroll'  as keyof typeof PERMISSIONS },
      { label: 'Projects', href: '/dashboard/projects', icon: Briefcase,  permission: 'manageProjects' as keyof typeof PERMISSIONS },
    ]
  }
]

// Role → which section floats to the TOP of the sidebar
const SECTION_PRIORITY: Partial<Record<string, string>> = {
  HR:         'HR & Payroll',
  ACCOUNTANT: 'Finance',
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()
  const { currentUser, loading: userLoading } = useCurrentUser()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/login')
    })
  }, [])

  useEffect(() => {
    if (userLoading) return

    if (!currentUser) {
      supabase.auth.getUser().then(({ data }) => {
        if (!data.user) router.push('/login')
      })
      return
    }

    if (pathname === '/dashboard' && !currentUser.can('viewExecutiveDashboard')) {
      router.replace(currentUser.defaultRoute)
    }
  }, [userLoading, currentUser, pathname])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const getVisibleMenu = () => {
    if (!currentUser) {
      return [{
        section: 'General',
        priority: false,
        items: [
          { label: 'Comm. Center', href: '/dashboard/announcements', icon: MessageSquare },
          { label: 'Rulebook',     href: '/dashboard/rulebook',      icon: BookOpen },
        ]
      }]
    }

    // Step 1: filter items based on role/permissions
    const filtered = ALL_MENU_ITEMS.map(group => {
      const visibleItems = group.items.filter(item => {
        if ('onlyFor' in item && item.onlyFor) {
          return item.onlyFor.includes(currentUser.role)
        }
        if (item.permission) {
          return currentUser.can(item.permission)
        }
        return true
      })
      return { ...group, priority: false, items: visibleItems }
    }).filter(group => group.items.length > 0)

    // Step 2: move the role's priority section to the top
    const prioritySection = SECTION_PRIORITY[currentUser.role]
    if (prioritySection) {
      const idx = filtered.findIndex(g => g.section === prioritySection)
      if (idx > 0) {
        const [topGroup] = filtered.splice(idx, 1)
        topGroup.priority = true
        filtered.unshift(topGroup)
      }
    }

    return filtered
  }

  const visibleMenu = getVisibleMenu()
  const displayName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : ''
  const initials    = currentUser
    ? `${currentUser.firstName?.[0] || ''}${currentUser.lastName?.[0] || ''}`.toUpperCase()
    : '??'

  return (
    <div className="app-layout">

      {/* Sidebar */}
      <aside className="sidebar" style={{ transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)' }}>

        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">C</div>
          <div>
            <div className="sidebar-logo-text">Constrotrait</div>
            <div className="sidebar-logo-sub">Material Testing</div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
          {visibleMenu.map((group) => (
            <div key={group.section} className="sidebar-section">

              {/* Section label — highlighted for priority section */}
              <div
                className="sidebar-section-label"
                style={group.priority ? {
                  color:      'var(--accent, #7c6ef5)',
                  display:    'flex',
                  alignItems: 'center',
                  gap:        '6px',
                } : undefined}
              >
                {group.priority && (
                  <span style={{
                    display:      'inline-block',
                    width:        '6px',
                    height:       '6px',
                    borderRadius: '50%',
                    background:   'var(--accent, #7c6ef5)',
                    flexShrink:   0,
                  }} />
                )}
                {group.section}
              </div>

              {group.items.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`sidebar-item ${isActive ? 'active' : ''}`}
                  >
                    <Icon size={16} />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* User / logout */}
        <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div className="avatar">{initials}</div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{
                fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
              }}>
                {displayName || currentUser?.email}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {currentUser?.roleLabel || 'Loading...'}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="btn btn-secondary btn-sm"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>

      </aside>

      {/* Main content */}
      <main className="main-content">
        <div className="topbar">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px' }}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', position: 'relative' }}>
              <Bell size={20} />
            </button>
            <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '11px' }}>
              {initials}
            </div>
          </div>
        </div>
        <div>{children}</div>
      </main>

    </div>
  )
}