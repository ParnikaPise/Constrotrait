'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { FileText, Download, Filter, TrendingUp, TrendingDown, Calendar } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function FinanceReportsPage() {
  const [loading, setLoading] = useState(false)
  const [reportType, setReportType] = useState('ALL') // ALL, INCOME, EXPENSE
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)) // YYYY-MM
  
  const [data, setData] = useState<{income: any[], expenses: any[]}>({ income: [], expenses: [] })

  const generateReport = async () => {
    setLoading(true)
    
    // Filter by month
    const startDate = `${month}-01`
    const endDate = new Date(new Date(startDate).getFullYear(), new Date(startDate).getMonth() + 1, 0).toISOString().split('T')[0]

    let incomeQuery = supabase.from('income').select('*').gte('date', startDate).lte('date', endDate).order('date', { ascending: true })
    let expenseQuery = supabase.from('expenses').select('*').gte('date', startDate).lte('date', endDate).order('date', { ascending: true })

    const [incomeRes, expenseRes] = await Promise.all([incomeQuery, expenseQuery])

    setData({
      income: incomeRes.data || [],
      expenses: expenseRes.data || []
    })
    
    setLoading(false)
  }

  // Load initial data for current month
  useEffect(() => {
    generateReport()
  }, [])

  const handlePrint = () => {
    window.print()
  }

  const totalIncome = data.income.reduce((sum, i) => sum + i.amount, 0)
  const totalExpense = data.expenses.reduce((sum, e) => sum + e.amount, 0)
  const netProfit = totalIncome - totalExpense

  return (
    <div className="page-content report-container">
      {/* Hide controls when printing */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          .no-print { display: none !important; }
          .report-container { padding: 0 !important; }
          .page-content { background: white !important; }
          .card { box-shadow: none !important; border: 1px solid #eee !important; margin-bottom: 20px !important; }
        }
      `}} />

      <div className="section-header no-print">
        <div>
          <h1 className="page-title">Financial Reports</h1>
          <p className="page-subtitle">Generate and print financial statements</p>
        </div>
        <button className="btn btn-primary" onClick={handlePrint} disabled={loading || (data.income.length === 0 && data.expenses.length === 0)}>
          <Download size={16} /> Print / Save PDF
        </button>
      </div>

      <div className="card no-print" style={{ marginBottom: '24px' }}>
        <div className="grid-2" style={{ alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Report Month</label>
            <input 
              type="month" 
              className="input" 
              value={month}
              onChange={e => setMonth(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Report Type</label>
            <select className="select" value={reportType} onChange={e => setReportType(e.target.value)}>
              <option value="ALL">Comprehensive (Income & Expenses)</option>
              <option value="INCOME">Income Only</option>
              <option value="EXPENSE">Expenses Only</option>
            </select>
          </div>
        </div>
        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={generateReport}>
            <Filter size={16} /> Generate Report
          </button>
        </div>
      </div>

      {loading ? (
        <div className="spinner" />
      ) : (
        <div id="printable-report">
          {/* Report Header */}
          <div style={{ textAlign: 'center', marginBottom: '40px', paddingBottom: '20px', borderBottom: '2px solid var(--border)' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
              CONSTROTRAIT MATERIAL TESTING
            </h1>
            <h2 style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>
              Financial Report: {new Date(month + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
            </h2>
          </div>

          {/* Summary Section */}
          <div className="grid-2" style={{ marginBottom: '40px' }}>
            <div className="card" style={{ background: 'var(--surface-2)', border: 'none' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                Summary
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Total Income:</span>
                  <span style={{ fontWeight: 600, color: 'var(--primary-light)' }}>{formatCurrency(totalIncome)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Total Expenses:</span>
                  <span style={{ fontWeight: 600, color: 'var(--accent-red)' }}>{formatCurrency(totalExpense)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '4px' }}>
                  <span style={{ fontWeight: 600 }}>Net Profit/Loss:</span>
                  <span style={{ fontWeight: 700, fontSize: '16px', color: netProfit >= 0 ? 'var(--accent)' : 'var(--accent-red)' }}>
                    {formatCurrency(netProfit)}
                  </span>
                </div>
              </div>
            </div>
            <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', textAlign: 'center' }}>
              <FileText size={48} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                Generated on {new Date().toLocaleDateString('en-IN')}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                System Generated Report
              </div>
            </div>
          </div>

          {/* Income Section */}
          {(reportType === 'ALL' || reportType === 'INCOME') && (
            <div style={{ marginBottom: '40px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--primary-light)' }}>
                <TrendingUp size={20} /> Income Breakdown
              </h3>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Source / Client</th>
                      <th>Category</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.income.map(item => (
                      <tr key={item.id}>
                        <td>{formatDate(item.date)}</td>
                        <td style={{ fontWeight: 500 }}>{item.source}</td>
                        <td>{item.category}</td>
                        <td>{item.status}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.amount)}</td>
                      </tr>
                    ))}
                    {data.income.length === 0 && (
                      <tr><td colSpan={5} className="empty-state">No income records for this period</td></tr>
                    )}
                  </tbody>
                  {data.income.length > 0 && (
                    <tfoot>
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'right', fontWeight: 600 }}>Total Income:</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary-light)' }}>{formatCurrency(totalIncome)}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}

          {/* Expenses Section */}
          {(reportType === 'ALL' || reportType === 'EXPENSE') && (
            <div style={{ marginBottom: '40px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--accent-red)' }}>
                <TrendingDown size={20} /> Expense Breakdown
              </h3>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Category</th>
                      <th>Description</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.expenses.map(item => (
                      <tr key={item.id}>
                        <td>{formatDate(item.date)}</td>
                        <td style={{ fontWeight: 500 }}>{item.category}</td>
                        <td>{item.description}</td>
                        <td>{item.status}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.amount)}</td>
                      </tr>
                    ))}
                    {data.expenses.length === 0 && (
                      <tr><td colSpan={5} className="empty-state">No expense records for this period</td></tr>
                    )}
                  </tbody>
                  {data.expenses.length > 0 && (
                    <tfoot>
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'right', fontWeight: 600 }}>Total Expenses:</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--accent-red)' }}>{formatCurrency(totalExpense)}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}
          
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', marginTop: '40px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
            <p>End of Report</p>
            <p>© {new Date().getFullYear()} Constrotrait Material Testing. All rights reserved.</p>
          </div>
        </div>
      )}
    </div>
  )
}
