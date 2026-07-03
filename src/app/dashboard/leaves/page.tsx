'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, Plus, Check, X, Clock, Calendar } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function LeavesPage() {
  const [leaves, setLeaves] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('ALL')
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const [formData, setFormData] = useState({
    employee_id: '', start_date: '', end_date: '', type: 'CASUAL', reason: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const [leaveRes, empRes] = await Promise.all([
      supabase.from('leaves').select('*, employees(firstName, lastName)').order('created_at', { ascending: false }),
      supabase.from('employees').select('id, firstName, lastName').eq('status', 'ACTIVE')
    ])
    if (leaveRes.data) setLeaves(leaveRes.data)
    if (empRes.data) setEmployees(empRes.data)
    setLoading(false)
  }

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.from('leaves').insert([{ id: crypto.randomUUID(), ...formData, status: 'PENDING' }])
    if (error) alert(error.message)
    setIsModalOpen(false)
    fetchData()
  }

  const handleAction = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    await supabase.from('leaves').update({ status }).eq('id', id)
    fetchData()
  }

  const filtered = tab === 'ALL' ? leaves : leaves.filter(l => l.status === tab)

  const stats = {
    pending: leaves.filter(l => l.status === 'PENDING').length,
    approved: leaves.filter(l => l.status === 'APPROVED').length,
    rejected: leaves.filter(l => l.status === 'REJECTED').length
  }

  return (
    <div className="page-content">
      <div className="section-header">
        <div>
          <h1 className="page-title">Leave Management</h1>
          <p className="page-subtitle">Track and approve employee leave requests</p>
        </div>
        <button className="btn btn-primary" onClick={() => {
          setFormData({ employee_id: employees[0]?.id || '', start_date: '', end_date: '', type: 'CASUAL', reason: '' })
          setIsModalOpen(true)
        }}>
          <Plus size={16} /> Apply Leave
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon amber"><Clock size={22} /></div>
          <div><div className="stat-value">{stats.pending}</div><div className="stat-label">Pending Approval</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><Check size={22} /></div>
          <div><div className="stat-value">{stats.approved}</div><div className="stat-label">Approved</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><X size={22} /></div>
          <div><div className="stat-value">{stats.rejected}</div><div className="stat-label">Rejected</div></div>
        </div>
      </div>

      <div className="tab-list" style={{ maxWidth: '400px' }}>
        {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(t => (
          <button 
            key={t} 
            className={`tab ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
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
                  <th>Leave Type</th>
                  <th>Duration</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(leave => (
                  <tr key={leave.id}>
                    <td style={{ fontWeight: 600 }}>
                      {leave.employees?.firstName} {leave.employees?.lastName}
                    </td>
                    <td>
                      <span className="badge" style={{ background: 'var(--surface-3)', color: 'var(--text-primary)' }}>
                        {leave.type}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={14} color="var(--text-secondary)" />
                        {formatDate(leave.start_date)} - {formatDate(leave.end_date)}
                      </div>
                    </td>
                    <td style={{ maxWidth: '200px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {leave.reason}
                    </td>
                    <td>
                      <span className={`badge ${
                        leave.status === 'APPROVED' ? 'badge-approved' : 
                        leave.status === 'REJECTED' ? 'badge-rejected' : 'badge-pending'
                      }`}>
                        {leave.status}
                      </span>
                    </td>
                    <td>
                      {leave.status === 'PENDING' ? (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="btn btn-success btn-sm" onClick={() => handleAction(leave.id, 'APPROVED')}>
                            <Check size={14} /> Approve
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleAction(leave.id, 'REJECTED')}>
                            <X size={14} /> Reject
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Actioned</span>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="empty-state">No leave records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Apply for Leave</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleApply}>
              <div className="form-group">
                <label className="form-label">Employee</label>
                <select className="select" required value={formData.employee_id} onChange={e => setFormData({...formData, employee_id: e.target.value})}>
                  <option value="">Select Employee</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
                  ))}
                </select>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input type="date" className="input" required value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input type="date" className="input" required value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Leave Type</label>
                <select className="select" required value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                  <option value="CASUAL">Casual Leave</option>
                  <option value="SICK">Sick Leave</option>
                  <option value="COMPENSATORY">Compensatory Off</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Reason</label>
                <textarea className="textarea" required rows={3} value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Submit Request</button>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
