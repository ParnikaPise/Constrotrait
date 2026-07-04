'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { formatDate } from '@/lib/utils'

import {
  CalendarDays,
  CheckSquare,
  ClipboardList,
  Bell,
  Clock3,
  CalendarCheck,
  Send,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Plane,
  MessageSquare,
  Calendar,
  Edit2
} from 'lucide-react'

export default function MyDashboardPage() {
  const { currentUser, loading: userLoading } = useCurrentUser()

  const [loading, setLoading] = useState(true)

  const [tasks, setTasks] = useState<any[]>([])
  const [attendance, setAttendance] = useState<any[]>([])
  const [leaves, setLeaves] = useState<any[]>([])
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [eods, setEods] = useState<any[]>([])

  const [calendarDate, setCalendarDate] = useState(new Date())

  useEffect(() => {
    if (currentUser) {
      fetchDashboard()
    }
  }, [currentUser])

  async function fetchDashboard() {
    if (!currentUser) return

    setLoading(true)

    const today = new Date().toISOString().slice(0, 10)
    const monthStart = today.substring(0, 7) + '-01'

    const [
      taskRes,
      attendanceRes,
      leaveRes,
      noticeRes,
      eodRes,
    ] = await Promise.all([
      supabase
        .from('tasks')
        .select('*')
        .contains('assignee_ids', [currentUser.id])
        .neq('status', 'COMPLETED')
        .order('deadline')
        .limit(5),
      supabase
        .from('attendance')
        .select('*')
        .eq('employee_id', currentUser.id)
        .gte('date', monthStart)
        .order('date'),
      supabase
        .from('leaves')
        .select('*')
        .eq('employee_id', currentUser.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('eod_reports')
        .select('*')
        .eq('employee_id', currentUser.id)
        .order('report_date', { ascending: false }),
    ])

    setTasks(taskRes.data || [])
    setAttendance(attendanceRes.data || [])
    setLeaves(leaveRes.data || [])
    setAnnouncements(noticeRes.data || [])
    setEods(eodRes.data || [])

    setLoading(false)
  }

  const greeting = useMemo(() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good Morning'
    if (h < 17) return 'Good Afternoon'
    if (h < 21) return 'Good Evening'
    return 'Good Night'
  }, [])

  const today = new Date().toISOString().slice(0, 10)
  const todayAttendance = attendance.find(a => a.date === today)
  const pendingTasks = tasks.length
  const pendingLeaves = leaves.filter(l => l.status === 'PENDING').length
  const noticeCount = announcements.length

  const monthlyCredit = 2
  const usedLeaves = leaves.filter(l => l.status === 'APPROVED' && l.leave_type === 'PAID').length
  const remainingLeaves = monthlyCredit - usedLeaves

  // Calendar Logic
  const year = calendarDate.getFullYear()
  const month = calendarDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDay = firstDay.getDay()
  const totalDays = lastDay.getDate()
  const prevLast = new Date(year, month, 0).getDate()
  const calendarCells: any[] = []

  for (let i = startDay - 1; i >= 0; i--) {
    calendarCells.push({ day: prevLast - i, other: true, dateStr: null })
  }
  for (let d = 1; d <= totalDays; d++) {
    const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    calendarCells.push({ day: d, other: false, dateStr: dStr })
  }
  while (calendarCells.length < 42) {
    calendarCells.push({ day: calendarCells.length - totalDays - startDay + 1, other: true, dateStr: null })
  }

  const getAttendanceStatus = (dateStr: string) => {
    if (!dateStr) return null
    if (dateStr === today) return 'TODAY'
    const record = attendance.find(a => a.date === dateStr)
    return record?.status || null
  }

  if (userLoading || loading) {
    return (
      <div className="page-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div className="page-content dashboard-page-content" style={{ padding: '32px 40px', maxWidth: '1600px', margin: '0 auto' }}>
      
      {/* Header */}
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            {greeting}, {currentUser?.firstName}! <span style={{ fontSize: '28px' }}>👋</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginTop: '4px' }}>Have a productive day ahead</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--surface)', border: '1px solid var(--border)', padding: '12px 20px', borderRadius: '16px' }}>
          <div style={{ background: 'var(--surface-2)', padding: '10px', borderRadius: '12px' }}>
            <Calendar size={20} color="var(--text-secondary)" />
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px' }}>
              {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Have a great day!</div>
          </div>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="dashboard-stats" style={{ display: 'grid', gap: '20px', marginBottom: '32px' }}>
        
        {/* Tasks */}
        <Link href="/dashboard/tasks/my" style={{ textDecoration: 'none' }}>
          <div style={{ background: 'linear-gradient(135deg, rgba(79,70,229,0.15), rgba(79,70,229,0.05))', border: '1px solid rgba(79,70,229,0.2)', borderRadius: '16px', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'transform 0.2s', cursor: 'pointer' }} className="hover:scale-[1.02]">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ background: 'rgba(79,70,229,0.2)', padding: '16px', borderRadius: '14px', color: '#818cf8' }}>
                <CheckSquare size={28} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ fontSize: '28px', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{pendingTasks}</span>
                  <span style={{ fontSize: '14px', color: '#a5b4fc', fontWeight: 500 }}>Pending Tasks</span>
                </div>
                <div style={{ fontSize: '12px', color: '#818cf8', marginTop: '4px' }}>- Keep going!</div>
              </div>
            </div>
            <ChevronRight color="#818cf8" size={20} />
          </div>
        </Link>

        {/* Attendance */}
        <Link href="/dashboard/attendance/my" style={{ textDecoration: 'none' }}>
          <div style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '16px', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'transform 0.2s', cursor: 'pointer' }} className="hover:scale-[1.02]">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ background: 'rgba(239,68,68,0.2)', padding: '16px', borderRadius: '14px', color: '#fca5a5' }}>
                <CalendarCheck size={28} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ fontSize: '22px', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{todayAttendance?.status || 'Not Marked'}</span>
                </div>
                <div style={{ fontSize: '12px', color: '#fca5a5', marginTop: '4px' }}>Today's Attendance</div>
                <div style={{ fontSize: '11px', color: '#f87171', marginTop: '2px' }}>{todayAttendance ? '- Logged' : 'Please mark your attendance'}</div>
              </div>
            </div>
            <ChevronRight color="#fca5a5" size={20} />
          </div>
        </Link>

        {/* Leaves */}
        <Link href="/dashboard/leaves/my" style={{ textDecoration: 'none' }}>
          <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '16px', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'transform 0.2s', cursor: 'pointer' }} className="hover:scale-[1.02]">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ background: 'rgba(16,185,129,0.2)', padding: '16px', borderRadius: '14px', color: '#6ee7b7' }}>
                <ClipboardList size={28} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ fontSize: '28px', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{pendingLeaves}</span>
                  <span style={{ fontSize: '14px', color: '#6ee7b7', fontWeight: 500 }}>Pending Leave Requests</span>
                </div>
                <div style={{ fontSize: '12px', color: '#34d399', marginTop: '4px' }}>{pendingLeaves === 0 ? '- All caught up!' : '- Awaiting approval'}</div>
              </div>
            </div>
            <ChevronRight color="#6ee7b7" size={20} />
          </div>
        </Link>

        {/* Notices */}
        <Link href="/dashboard/announcements" style={{ textDecoration: 'none' }}>
          <div style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '16px', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'transform 0.2s', cursor: 'pointer' }} className="hover:scale-[1.02]">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ background: 'rgba(245,158,11,0.2)', padding: '16px', borderRadius: '14px', color: '#fcd34d' }}>
                <Bell size={28} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ fontSize: '28px', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{noticeCount}</span>
                  <span style={{ fontSize: '14px', color: '#fcd34d', fontWeight: 500 }}>Notices</span>
                </div>
                <div style={{ fontSize: '12px', color: '#fbbf24', marginTop: '4px' }}>- No new notices</div>
              </div>
            </div>
            <ChevronRight color="#fcd34d" size={20} />
          </div>
        </Link>
      </div>

      <div className="dashboard-main-grid" style={{ display: 'grid', gap: '24px', marginBottom: '24px' }}>
        
        {/* My Tasks */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>My Tasks</h3>
            <Link href="/dashboard/tasks/my" style={{ color: 'var(--primary-light)', fontSize: '13px', textDecoration: 'none', fontWeight: 500 }}>View All →</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {tasks.length > 0 ? tasks.map(task => (
              <div key={task.id} style={{ background: 'var(--surface-2)', padding: '16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', border: '1px solid transparent' }} className="hover:border-primary/50">
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>{task.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Due: {task.deadline ? formatDate(task.deadline) : 'No deadline'}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px' }}>
                    {task.status.replace('_', ' ')}
                  </span>
                  <ChevronRight size={16} color="var(--text-secondary)" />
                </div>
              </div>
            )) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                <CheckSquare size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                <div style={{ fontSize: '14px' }}>No pending tasks 🎉</div>
              </div>
            )}
          </div>
        </div>

        {/* Company Notices */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Company Notices</h3>
            <Link href="/dashboard/announcements" style={{ color: 'var(--primary-light)', fontSize: '13px', textDecoration: 'none', fontWeight: 500 }}>View All →</Link>
          </div>
          {announcements.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {announcements.map(notice => (
                <div key={notice.id} style={{ background: 'var(--surface-2)', padding: '16px', borderRadius: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>{notice.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{formatDate(notice.created_at)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
              <div style={{ background: 'rgba(99,102,241,0.1)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <MessageSquare size={32} color="var(--primary-light)" />
              </div>
              <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-primary)', marginBottom: '4px' }}>No announcements</div>
              <div style={{ fontSize: '13px' }}>You're all caught up! Check back later for updates.</div>
            </div>
          )}
        </div>

        {/* My Attendance */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>My Attendance - {calendarDate.toLocaleString('default', { month: 'short', year: 'numeric' })}</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setCalendarDate(new Date(year, month - 1, 1))} style={{ background: 'var(--surface-2)', border: 'none', color: 'var(--text-primary)', padding: '4px', borderRadius: '6px', cursor: 'pointer' }}><ChevronLeft size={16} /></button>
              <button onClick={() => setCalendarDate(new Date(year, month + 1, 1))} style={{ background: 'var(--surface-2)', border: 'none', color: 'var(--text-primary)', padding: '4px', borderRadius: '6px', cursor: 'pointer' }}><ChevronRight size={16} /></button>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '12px' }}>
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', paddingBottom: '8px' }}>{d}</div>
            ))}
            {calendarCells.map((c, i) => {
              const status = getAttendanceStatus(c.dateStr)
              let dotColor = 'transparent'
              if (status === 'PRESENT') dotColor = '#10b981'
              else if (status === 'ABSENT') dotColor = '#ef4444'
              else if (status === 'LEAVE') dotColor = '#f59e0b'
              else if (status === 'TODAY') dotColor = '#8b5cf6'

              return (
                <div key={i} style={{ 
                  aspectRatio: '1', 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontSize: '13px', 
                  fontWeight: 600,
                  color: c.other ? 'var(--text-muted)' : 'var(--text-primary)',
                  background: status === 'TODAY' ? 'rgba(139,92,246,0.15)' : 'transparent',
                  borderRadius: '8px',
                  position: 'relative'
                }}>
                  {c.day}
                  {dotColor !== 'transparent' && (
                    <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: dotColor, marginTop: '2px' }} />
                  )}
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '16px', padding: '0 8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}/> Present</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }}/> Absent</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }}/> Leave</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#8b5cf6' }}/> Today</div>
          </div>
        </div>

      </div>

      {/* Bottom Section */}
      <div className="dashboard-bottom-grid" style={{ display: 'grid', gap: '24px' }}>
        
        <div>
          {/* Quick Actions */}
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>Quick Actions</h3>
          <div className="dashboard-action-grid" style={{ display: 'grid', gap: '16px', marginBottom: '32px' }}>
            
            <Link href="/dashboard/worklogs" style={{ textDecoration: 'none' }}>
              <div style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', padding: '16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.2s', cursor: 'pointer' }} className="hover:bg-[rgba(99,102,241,0.15)]">
                <div style={{ background: 'var(--primary)', padding: '10px', borderRadius: '10px', color: 'white' }}><Send size={20} /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>Submit EOD Report</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Submit your end of day report</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '4px', borderRadius: '50%', color: 'var(--text-secondary)' }}><ArrowRight size={14} /></div>
              </div>
            </Link>

            <Link href="/dashboard/leaves/my" style={{ textDecoration: 'none' }}>
              <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', padding: '16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.2s', cursor: 'pointer' }} className="hover:bg-[rgba(16,185,129,0.15)]">
                <div style={{ background: '#10b981', padding: '10px', borderRadius: '10px', color: 'white' }}><CalendarDays size={20} /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>Apply for Leave</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Request time off</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '4px', borderRadius: '50%', color: 'var(--text-secondary)' }}><ArrowRight size={14} /></div>
              </div>
            </Link>

            <Link href="/dashboard/tasks/my" style={{ textDecoration: 'none' }}>
              <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', padding: '16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.2s', cursor: 'pointer' }} className="hover:bg-[rgba(59,130,246,0.15)]">
                <div style={{ background: '#3b82f6', padding: '10px', borderRadius: '10px', color: 'white' }}><CheckSquare size={20} /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>View My Tasks</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Check your tasks</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '4px', borderRadius: '50%', color: 'var(--text-secondary)' }}><ArrowRight size={14} /></div>
              </div>
            </Link>

            <Link href="/dashboard/announcements" style={{ textDecoration: 'none' }}>
              <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', padding: '16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.2s', cursor: 'pointer' }} className="hover:bg-[rgba(245,158,11,0.15)]">
                <div style={{ background: '#f59e0b', padding: '10px', borderRadius: '10px', color: 'white' }}><Bell size={20} /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>View Notices</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>See company notices</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '4px', borderRadius: '50%', color: 'var(--text-secondary)' }}><ArrowRight size={14} /></div>
              </div>
            </Link>

          </div>

          {/* Recent Activity */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Recent Activity</h3>
              <Link href="#" style={{ color: 'var(--primary-light)', fontSize: '13px', textDecoration: 'none', fontWeight: 500 }}>View All →</Link>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {eods.length > 0 ? (
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '10px', borderRadius: '50%' }}><CheckCircle2 size={20} /></div>
                  <div style={{ flex: 1, borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>EOD Submitted</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{formatDate(eods[0].created_at)}</div>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>You submitted your EOD report for {eods[0].report_date}</div>
                  </div>
                </div>
              ) : null}
              {tasks.length > 0 ? (
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6', padding: '10px', borderRadius: '50%' }}><Edit2 size={20} /></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>Task Updated</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Today</div>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{tasks[0].title} is {tasks[0].status.replace('_', ' ')}</div>
                  </div>
                </div>
              ) : null}
              {eods.length === 0 && tasks.length === 0 && (
                <div style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>No recent activity.</div>
              )}
            </div>
          </div>
        </div>

        {/* Leave Balance */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', alignSelf: 'start' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Leave Balance</h3>
            <Calendar size={18} color="var(--text-secondary)" />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '24px' }}>
            {/* Donut Chart (CSS) */}
            <div style={{ 
              width: '100px', height: '100px', 
              borderRadius: '50%', 
              background: `conic-gradient(var(--primary) ${remainingLeaves/monthlyCredit * 100}%, var(--surface-2) 0)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <div style={{ width: '80px', height: '80px', background: 'var(--surface)', borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{remainingLeaves}</span>
                <span style={{ fontSize: '10px', color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.2, marginTop: '4px' }}>Remaining<br/>Paid Leaves</span>
              </div>
            </div>
            
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Monthly Credit</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#10b981' }}>{monthlyCredit}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Used This Month</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#f59e0b' }}>{usedLeaves}</span>
              </div>
              <div style={{ height: '1px', background: 'var(--border)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 600 }}>Available Now</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary-light)' }}>{remainingLeaves}</span>
              </div>
            </div>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
            2 leaves credited every month
          </div>
        </div>

      </div>
    </div>
  )
}
