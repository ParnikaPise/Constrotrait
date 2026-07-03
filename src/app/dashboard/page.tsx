'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import {
  Users, GitBranch, CalendarCheck, Clock, TrendingUp,
  TrendingDown, DollarSign, AlertCircle, CheckSquare,
  FileText, Activity, BarChart2
} from 'lucide-react'
import Link from 'next/link'

export default function ExecutiveDashboard() {
  const [stats, setStats] = useState({
    totalEmployees: 0, activeBranches: 0,
    presentToday: 0, pendingLeaves: 0,
    pendingEODs: 0, pendingTasks: 0,
    totalIncome: 0, totalExpenses: 0,
  })
  const [recentActivities, setRecentActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    const today = new Date().toISOString().slice(0, 10)
    const thisMonth = today.slice(0, 7)

    const [empRes, branchRes, attRes, leaveRes, eodRes, taskRes, incomeRes, expRes] = await Promise.all([
      supabase.from('employees').select('id', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
      supabase.from('branches').select('id', { count: 'exact', head: true }),
      supabase.from('attendance').select('id', { count: 'exact', head: true }).eq('date', today).eq('status', 'PRESENT'),
      supabase.from('leaves').select('id', { count: 'exact', head: true }).eq('status', 'PENDING'),
      supabase.from('eod_reports').select('id', { count: 'exact', head: true }).eq('status', 'SUBMITTED'),
      supabase.from('tasks').select('id', { count: 'exact', head: true }).neq('status', 'COMPLETED'),
      supabase.from('income').select('amount').eq('status', 'RECEIVED').gte('date', `${thisMonth}-01`),
      supabase.from('expenses').select('amount').gte('date', `${thisMonth}-01`),
    ])

    const totalIncome = incomeRes.data?.reduce((s: number, r: any) => s + (r.amount || 0), 0) || 0
    const totalExpenses = expRes.data?.reduce((s: number, r: any) => s + (r.amount || 0), 0) || 0

    setStats({
      totalEmployees: empRes.count || 0,
      activeBranches: branchRes.count || 0,
      presentToday: attRes.count || 0,
      pendingLeaves: leaveRes.count || 0,
      pendingEODs: eodRes.count || 0,
      pendingTasks: taskRes.count || 0,
      totalIncome, totalExpenses,
    })
    setLoading(false)
  }

  const statCards = [
    { label: 'Total Employees', value: stats.totalEmployees, icon: Users, color: 'purple', href: '/dashboard/employees' },
    { label: 'Active Branches', value: stats.activeBranches, icon: GitBranch, color: 'blue', href: '/dashboard/branches' },
    { label: 'Present Today', value: stats.presentToday, icon: CalendarCheck, color: 'green', href: '/dashboard/attendance' },
    { label: 'Pending Leaves', value: stats.pendingLeaves, icon: Clock, color: 'amber', href: '/dashboard/leaves' },
    { label: 'Pending EODs', value: stats.pendingEODs, icon: FileText, color: 'red', href: '/dashboard/worklogs' },
    { label: 'Active Tasks', value: stats.pendingTasks, icon: CheckSquare, color: 'purple', href: '/dashboard/tasks' },
    { label: 'Monthly Income', value: formatCurrency(stats.totalIncome), icon: TrendingUp, color: 'green', href: '/dashboard/finance/income' },
    { label: 'Monthly Expenses', value: formatCurrency(stats.totalExpenses), icon: TrendingDown, color: 'red', href: '/dashboard/finance/expenses' },
  ]

  return (
    <div className="page-content">
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '6px' }}>
          Executive Dashboard
        </h1>
        <p suppressHydrationWarning style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {loading ? (
        <div className="spinner" />
      ) : (
        <>
          {/* Stats Grid */}
          <div className="stats-grid">
            {statCards.map((s) => {
              const Icon = s.icon
              return (
                <Link key={s.label} href={s.href} style={{ textDecoration: 'none' }}>
                  <div className="stat-card">
                    <div className={`stat-icon ${s.color}`}>
                      <Icon size={22} />
                    </div>
                    <div>
                      <div className="stat-value">{s.value}</div>
                      <div className="stat-label">{s.label}</div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Financial Summary */}
          <div className="grid-2" style={{ marginBottom: '24px' }}>
            <div className="card">
              <div className="section-header" style={{ marginBottom: '16px' }}>
                <h3 className="section-title" style={{ fontSize: '16px' }}>Financial Summary (This Month)</h3>
                <BarChart2 size={20} color="var(--text-muted)" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TrendingUp size={14} color="var(--accent-green)" /> Income
                  </span>
                  <span className="income-text" style={{ fontWeight: '700' }}>{formatCurrency(stats.totalIncome)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TrendingDown size={14} color="var(--accent-red)" /> Expenses
                  </span>
                  <span className="expense-text" style={{ fontWeight: '700' }}>{formatCurrency(stats.totalExpenses)}</span>
                </div>
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <DollarSign size={14} color="var(--primary-light)" /> Net Profit
                  </span>
                  <span className={stats.totalIncome - stats.totalExpenses >= 0 ? 'income-text' : 'expense-text'} style={{ fontWeight: '800', fontSize: '16px' }}>
                    {formatCurrency(stats.totalIncome - stats.totalExpenses)}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="card">
              <div className="section-header" style={{ marginBottom: '16px' }}>
                <h3 className="section-title" style={{ fontSize: '16px' }}>Quick Actions</h3>
                <Activity size={20} color="var(--text-muted)" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { label: 'Mark Today\'s Attendance', href: '/dashboard/attendance', color: 'var(--accent-green)' },
                  { label: 'Submit EOD Report', href: '/dashboard/worklogs', color: 'var(--primary-light)' },
                  { label: 'Add Income Entry', href: '/dashboard/finance/income', color: 'var(--accent-green)' },
                  { label: 'Add Expense Entry', href: '/dashboard/finance/expenses', color: 'var(--accent-red)' },
                  { label: 'View Pending Leaves', href: '/dashboard/leaves', color: 'var(--accent)' },
                  { label: 'Run Payroll', href: '/dashboard/payroll', color: 'var(--primary-light)' },
                ].map(link => (
                  <Link key={link.label} href={link.href} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', borderRadius: '8px',
                    background: 'var(--surface-2)', border: '1px solid var(--border)',
                    textDecoration: 'none', color: 'var(--text-primary)',
                    fontSize: '13px', fontWeight: '500',
                    transition: 'all 0.2s'
                  }}>
                    <span>{link.label}</span>
                    <span style={{ color: link.color, fontSize: '12px' }}>→</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
