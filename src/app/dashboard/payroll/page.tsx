'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Check, Download, PlayCircle, Search, DollarSign, Clock } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default function PayrollPage() {
  const [employees, setEmployees] = useState<any[]>([])
  const [payrollRecords, setPayrollRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)) // YYYY-MM
  const [search, setSearch] = useState('')
  const [runningPayroll, setRunningPayroll] = useState(false)

  useEffect(() => {
    fetchData()
  }, [month])

  const fetchData = async () => {
    setLoading(true)
    const [empRes, payRes] = await Promise.all([
      supabase.from('employees').select('id, firstName, lastName, base_salary, designation').eq('status', 'ACTIVE'),
      supabase.from('payroll_records').select('*, employees(firstName, lastName, designation)').eq('payout_month', month)
    ])
    if (empRes.data) setEmployees(empRes.data)
    if (payRes.data) setPayrollRecords(payRes.data)
    setLoading(false)
  }

  const runPayroll = async () => {
    if (!confirm(`Are you sure you want to generate payroll for ${month}? This will create records for all active employees.`)) return
    
    setRunningPayroll(true)
    
    const existingIds = payrollRecords.map(p => p.employee_id)
    const newRecords = employees
      .filter(emp => !existingIds.includes(emp.id))
      .map(emp => ({
        id: crypto.randomUUID(),
        employee_id: emp.id,
        payout_month: month,
        base_salary: emp.base_salary,
        adjustments: 0,
        deductions: 0,
        net_payout: emp.base_salary,
        status: 'PENDING'
      }))

    if (newRecords.length > 0) {
      const { error } = await supabase.from('payroll_records').insert(newRecords)
      if (error) alert('Error generating payroll: ' + error.message)
    } else {
      alert('Payroll is already generated for all active employees for this month.')
    }
    
    await fetchData()
    setRunningPayroll(false)
  }

  const markAsPaid = async (id: string) => {
    await supabase.from('payroll_records').update({ status: 'PAID' }).eq('id', id)
    fetchData()
  }

  const filtered = payrollRecords.filter(p => 
    (p.employees?.firstName + ' ' + p.employees?.lastName).toLowerCase().includes(search.toLowerCase())
  )

  const stats = {
    total: payrollRecords.reduce((s, p) => s + p.net_payout, 0),
    paid: payrollRecords.filter(p => p.status === 'PAID').length,
    pending: payrollRecords.filter(p => p.status === 'PENDING').length
  }

  return (
    <div className="page-content">
      <div className="section-header">
        <div>
          <h1 className="page-title">Payroll Management</h1>
          <p className="page-subtitle">Process salaries and manage compensation</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div className="search-bar">
            <input 
              type="month" 
              value={month}
              onChange={e => setMonth(e.target.value)}
              style={{ colorScheme: 'dark' }}
            />
          </div>
          <button className="btn btn-primary" onClick={runPayroll} disabled={runningPayroll}>
            {runningPayroll ? <div className="spinner" style={{ width: 14, height: 14, margin: 0, borderWidth: 2 }} /> : <PlayCircle size={16} />} 
            Run Payroll
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon purple"><DollarSign size={22} /></div>
          <div><div className="stat-value">{formatCurrency(stats.total)}</div><div className="stat-label">Total Payout ({month})</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><Check size={22} /></div>
          <div><div className="stat-value">{stats.paid}</div><div className="stat-label">Paid</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon amber"><Clock size={22} /></div>
          <div><div className="stat-value">{stats.pending}</div><div className="stat-label">Pending</div></div>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
          <div className="search-bar" style={{ maxWidth: '400px' }}>
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Search employee..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="spinner" />
        ) : (
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Base Salary</th>
                  <th>+/- Adjustments</th>
                  <th>Net Payout</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(record => (
                  <tr key={record.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{record.employees?.firstName} {record.employees?.lastName}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{record.employees?.designation}</div>
                    </td>
                    <td>{formatCurrency(record.base_salary)}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '12px' }}>
                        {record.adjustments > 0 && <span className="income-text">+{formatCurrency(record.adjustments)} (Bonus)</span>}
                        {record.deductions > 0 && <span className="expense-text">-{formatCurrency(record.deductions)} (Deductions)</span>}
                        {record.adjustments === 0 && record.deductions === 0 && <span style={{ color: 'var(--text-muted)' }}>No adjustments</span>}
                      </div>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--primary-light)' }}>
                      {formatCurrency(record.net_payout)}
                    </td>
                    <td>
                      <span className={`badge ${record.status === 'PAID' ? 'badge-active' : 'badge-pending'}`}>
                        {record.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {record.status === 'PENDING' && (
                          <button className="btn btn-success btn-sm" onClick={() => markAsPaid(record.id)}>
                            <Check size={14} /> Pay
                          </button>
                        )}
                        <button className="btn btn-secondary btn-sm" onClick={() => alert('Payslip PDF generation will be implemented soon.')}>
                          <Download size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="empty-state">
                      {payrollRecords.length === 0 
                        ? `No payroll records for ${month}. Click 'Run Payroll' to generate.`
                        : 'No matching records found.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
