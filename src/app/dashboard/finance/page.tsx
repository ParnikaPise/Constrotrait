'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { TrendingUp, TrendingDown, DollarSign, Wallet, Activity, CreditCard } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'

export default function FinanceDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpense: 0,
    netProfit: 0,
    pendingReceivables: 0
  })
  
  const [recentTransactions, setRecentTransactions] = useState<any[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    
    // In a real app, you would filter by date range (e.g., current month)
    const [incomeRes, expenseRes] = await Promise.all([
      supabase.from('income').select('amount, source, date, created_at, status').order('date', { ascending: false }),
      supabase.from('expenses').select('amount, category, date, created_at, status').order('date', { ascending: false })
    ])

    const income = incomeRes.data || []
    const expenses = expenseRes.data || []

    const totalIncome = income.filter(i => i.status === 'RECEIVED').reduce((sum, i) => sum + i.amount, 0)
    const pendingReceivables = income.filter(i => i.status === 'PENDING').reduce((sum, i) => sum + i.amount, 0)
    const totalExpense = expenses.filter(e => e.status !== 'CANCELLED').reduce((sum, e) => sum + e.amount, 0)

    setStats({
      totalIncome,
      totalExpense,
      netProfit: totalIncome - totalExpense,
      pendingReceivables
    })

    // Combine and sort recent transactions
    const combined = [
      ...income.map(i => ({ ...i, type: 'INCOME', label: i.source })),
      ...expenses.map(e => ({ ...e, type: 'EXPENSE', label: e.category }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
     .slice(0, 10) // Get top 10 most recent

    setRecentTransactions(combined)
    setLoading(false)
  }

  return (
    <div className="page-content">
      <div className="section-header">
        <div>
          <h1 className="page-title">Finance Dashboard</h1>
          <p className="page-subtitle">Overview of company financials</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/dashboard/finance/income" className="btn btn-primary">
            <TrendingUp size={16} /> Add Income
          </Link>
          <Link href="/dashboard/finance/expenses" className="btn btn-secondary">
            <TrendingDown size={16} /> Add Expense
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="spinner" />
      ) : (
        <>
          <div className="stats-grid" style={{ marginBottom: '24px' }}>
            <div className="stat-card">
              <div className="stat-icon" style={{ color: 'var(--accent)', background: 'rgba(245, 158, 11, 0.1)' }}>
                <Wallet size={24} />
              </div>
              <div className="stat-value">{formatCurrency(stats.netProfit)}</div>
              <div className="stat-label">Net Profit</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon" style={{ color: 'var(--primary-light)', background: 'var(--surface-3)' }}>
                <TrendingUp size={24} />
              </div>
              <div className="stat-value">{formatCurrency(stats.totalIncome)}</div>
              <div className="stat-label">Total Income (Received)</div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ color: 'var(--accent-red)', background: 'rgba(239, 68, 68, 0.1)' }}>
                <TrendingDown size={24} />
              </div>
              <div className="stat-value">{formatCurrency(stats.totalExpense)}</div>
              <div className="stat-label">Total Expenses</div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ color: 'var(--text-secondary)', background: 'var(--surface-2)' }}>
                <Activity size={24} />
              </div>
              <div className="stat-value">{formatCurrency(stats.pendingReceivables)}</div>
              <div className="stat-label">Pending Receivables</div>
            </div>
          </div>

          <div className="grid-2">
            <div className="card" style={{ padding: 0 }}>
              <div style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Recent Transactions</h3>
              </div>
              <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions.map((t, idx) => (
                      <tr key={idx}>
                        <td style={{ fontSize: '13px' }}>{formatDate(t.date)}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {t.type === 'INCOME' ? 
                              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary-light)' }} /> : 
                              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-red)' }} />
                            }
                            <span style={{ fontWeight: 500 }}>{t.label}</span>
                          </div>
                        </td>
                        <td style={{ 
                          fontWeight: 600, 
                          color: t.type === 'INCOME' ? 'var(--primary-light)' : 'var(--text-primary)' 
                        }}>
                          {t.type === 'INCOME' ? '+' : '-'}{formatCurrency(t.amount)}
                        </td>
                      </tr>
                    ))}
                    {recentTransactions.length === 0 && (
                      <tr>
                        <td colSpan={3} className="empty-state">No recent transactions</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Quick Actions</h3>
              
              <Link href="/dashboard/finance/reports" className="btn btn-secondary" style={{ justifyContent: 'flex-start', padding: '16px' }}>
                <CreditCard size={18} style={{ marginRight: '12px' }} /> Generate Financial Reports
              </Link>
              
              <Link href="/dashboard/payroll" className="btn btn-secondary" style={{ justifyContent: 'flex-start', padding: '16px' }}>
                <DollarSign size={18} style={{ marginRight: '12px' }} /> Process Payroll
              </Link>
              
              <div style={{ marginTop: 'auto', padding: '16px', background: 'var(--surface-2)', borderRadius: '8px' }}>
                <h4 style={{ fontSize: '14px', marginBottom: '8px', color: 'var(--text-primary)' }}>Financial Health</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  The business is currently operating at a {stats.netProfit >= 0 ? 'profit' : 'loss'} of {formatCurrency(Math.abs(stats.netProfit))}. 
                  Make sure to follow up on the {formatCurrency(stats.pendingReceivables)} in pending receivables.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
