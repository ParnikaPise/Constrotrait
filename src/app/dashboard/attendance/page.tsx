'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Check, X, Clock, Calendar as CalendarIcon, Save } from 'lucide-react'

export default function AttendancePage() {
  const [employees, setEmployees] = useState<any[]>([])
  const [attendance, setAttendance] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [saving, setSaving] = useState(false)

  // Local state to track selections before saving
  const [selections, setSelections] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchData()
  }, [date])

  const fetchData = async () => {
    setLoading(true)
    const [empRes, attRes] = await Promise.all([
      supabase.from('employees').select('id, firstName, lastName, branch_id, branches!branch_id(name)').eq('status', 'ACTIVE'),
      supabase.from('attendance').select('*').eq('date', date)
    ])
    
    if (empRes.data) setEmployees(empRes.data)
    
    const attMap: Record<string, string> = {}
    if (attRes.data) {
      setAttendance(attRes.data)
      attRes.data.forEach(a => {
        attMap[a.employee_id] = a.status
      })
    }
    setSelections(attMap)
    setLoading(false)
  }

  const handleStatusChange = (empId: string, status: string) => {
    setSelections(prev => ({ ...prev, [empId]: status }))
  }

  const handleSave = async () => {
    setSaving(true)
    
    const updates = []
    const inserts = []

    for (const [employee_id, status] of Object.entries(selections)) {
      const emp = employees.find(e => e.id === employee_id)
      const existing = attendance.find(a => a.employee_id === employee_id)
      
      if (existing) {
        updates.push({ id: existing.id, status })
      } else {
        inserts.push({
          id: crypto.randomUUID(),
          employee_id,
          date,
          status,
          branch_id: emp?.branch_id
        })
      }
    }

    if (updates.length > 0) {
      for (const update of updates) {
        await supabase.from('attendance').update({ status: update.status }).eq('id', update.id)
      }
    }
    
    if (inserts.length > 0) {
      await supabase.from('attendance').insert(inserts)
    }

    await fetchData()
    setSaving(false)
    alert('Attendance saved successfully!')
  }

  const getStats = () => {
    const present = Object.values(selections).filter(s => s === 'PRESENT').length
    const absent = Object.values(selections).filter(s => s === 'ABSENT').length
    const late = Object.values(selections).filter(s => s === 'LATE').length
    const leave = Object.values(selections).filter(s => s === 'LEAVE').length
    return { present, absent, late, leave }
  }

  const stats = getStats()

  return (
    <div className="page-content">
      <div className="section-header">
        <div>
          <h1 className="page-title">Daily Attendance</h1>
          <p className="page-subtitle">Mark and manage employee attendance</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div className="search-bar">
            <CalendarIcon size={18} />
            <input 
              type="date" 
              value={date}
              onChange={e => setDate(e.target.value)}
              style={{ colorScheme: 'dark' }}
            />
          </div>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || Object.keys(selections).length === 0}>
            {saving ? <div className="spinner" style={{ width: 14, height: 14, margin: 0, borderWidth: 2 }} /> : <Save size={16} />} 
            {saving ? 'Saving...' : 'Save Attendance'}
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon green"><Check size={22} /></div>
          <div><div className="stat-value">{stats.present}</div><div className="stat-label">Present</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><X size={22} /></div>
          <div><div className="stat-value">{stats.absent}</div><div className="stat-label">Absent</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon amber"><Clock size={22} /></div>
          <div><div className="stat-value">{stats.late}</div><div className="stat-label">Late</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><CalendarIcon size={22} /></div>
          <div><div className="stat-value">{stats.leave}</div><div className="stat-label">On Leave</div></div>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="spinner" />
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Branch</th>
                  <th>Attendance Status</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => {
                  const currentStatus = selections[emp.id]
                  return (
                    <tr key={emp.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div className="avatar" style={{ width: 32, height: 32, fontSize: 12 }}>{emp.firstName[0]}{emp.lastName[0]}</div>
                          <div style={{ fontWeight: 600 }}>{emp.firstName} {emp.lastName}</div>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {emp.branches?.name || 'No Branch'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {['PRESENT', 'ABSENT', 'LATE', 'LEAVE'].map(status => (
                            <button
                              key={status}
                              onClick={() => handleStatusChange(emp.id, status)}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                border: '1px solid',
                                background: currentStatus === status 
                                  ? (status === 'PRESENT' ? 'rgba(16,185,129,0.2)' : status === 'ABSENT' ? 'rgba(239,68,68,0.2)' : status === 'LATE' ? 'rgba(245,158,11,0.2)' : 'rgba(99,102,241,0.2)')
                                  : 'transparent',
                                borderColor: currentStatus === status
                                  ? (status === 'PRESENT' ? 'var(--accent-green)' : status === 'ABSENT' ? 'var(--accent-red)' : status === 'LATE' ? 'var(--accent)' : 'var(--primary)')
                                  : 'var(--border)',
                                color: currentStatus === status
                                  ? (status === 'PRESENT' ? 'var(--accent-green)' : status === 'ABSENT' ? 'var(--accent-red)' : status === 'LATE' ? 'var(--accent)' : 'var(--primary-light)')
                                  : 'var(--text-secondary)',
                                transition: 'all 0.2s'
                              }}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {employees.length === 0 && (
                  <tr>
                    <td colSpan={3} className="empty-state">No active employees found.</td>
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
