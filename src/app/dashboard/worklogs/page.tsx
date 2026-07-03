'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { Plus, Check, FileText, XCircle, Search, X, Clock } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function WorklogsPage() {
  const { currentUser } = useCurrentUser()
  const canApprove = currentUser?.can('approveEOD') ?? false
  const [reports, setReports] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState<any>(null)
  const [search, setSearch] = useState('')
  
  const [formData, setFormData] = useState({
    employee_id: '', report_date: new Date().toISOString().split('T')[0],
    tasks_completed: '', tasks_in_progress: '', blockers: 'None',
    sentiment: 'GOOD', hours_worked: 8
  })

  const [reviewData, setReviewData] = useState({
    approval_status: 'APPROVED', supervisor_remarks: ''
  })

  useEffect(() => {
    if (currentUser) fetchData()
  }, [currentUser])

  const fetchData = async () => {
    if (!currentUser) return
    setLoading(true)
    
    // Build query: managers see all EODs, employees see only their own
    let reportQuery = supabase.from('eod_reports').select('*, employees(firstName, lastName)').order('report_date', { ascending: false })
    if (!currentUser.can('approveEOD')) {
      reportQuery = reportQuery.eq('employee_id', currentUser.id)
    }

    const [reportRes, empRes] = await Promise.all([
      reportQuery,
      supabase.from('employees').select('id, firstName, lastName').eq('status', 'ACTIVE')
    ])
    if (reportRes.data) setReports(reportRes.data)
    if (empRes.data) setEmployees(empRes.data)
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()

  const now = new Date()

    const hours = now.getHours()
    const minutes = now.getMinutes()

    // 12:00 AM नंतर submit बंद
    if (hours === 0 && minutes > 0) {
      alert("Today's EOD submission time has ended.")
      return
    }

  // Employee ID
  const employeeId =
    canApprove
      ? formData.employee_id
      : currentUser?.id || formData.employee_id

  const payload = {
    ...formData,
    employee_id: employeeId,
    approval_status: 'PENDING',
    tasks_completed: formData.tasks_completed
      .split('\n')
      .filter((t) => t.trim() !== ''),
    tasks_in_progress: formData.tasks_in_progress
      .split('\n')
      .filter((t) => t.trim() !== ''),
  }

  // Save EOD
  const { error } = await supabase
    .from('eod_reports')
    .insert([
      {
        id: crypto.randomUUID(),
        ...payload,
      },
    ])

  if (error) {
    alert(error.message)
    return
  }

  // -------------------------------------
  // Attendance Auto Present
  // -------------------------------------

  const today = formData.report_date

  const { data: attendanceRecord } = await supabase
    .from('attendance')
    .select('id')
    .eq('employee_id', employeeId)
    .eq('date', today)
    .maybeSingle()

  if (attendanceRecord) {

    await supabase
      .from('attendance')
      .update({
        status: 'PRESENT',
        check_in: new Date().toISOString(),
        eod_submitted: true,
      })
      .eq('id', attendanceRecord.id)

  } else {

    await supabase
      .from('attendance')
      .insert({
        employee_id: employeeId,
        date: today,
        status: 'PRESENT',
        check_in: new Date().toISOString(),
        eod_submitted: true,
        branch_id: currentUser?.branch_id ?? null,
      })

  }

  alert('EOD Submitted Successfully.')

  setIsSubmitModalOpen(false)

  fetchData()
}

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedReport) return

    const { error } = await supabase.from('eod_reports').update({
      approval_status: reviewData.approval_status,
      supervisor_remarks: reviewData.supervisor_remarks
    }).eq('id', selectedReport.id)

    if (error) alert(error.message)
    setIsReviewModalOpen(false)
    fetchData()
  }

  const filtered = reports.filter(r => 
    (r.employees?.firstName + ' ' + r.employees?.lastName).toLowerCase().includes(search.toLowerCase())
  )

  const todayStr = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const stats = {
    today: reports.filter(r => r.report_date === todayStr).length,
    pending: reports.filter(r => r.approval_status === 'PENDING').length,
    todayHours: reports.filter(r => r.report_date === todayStr).reduce((sum, r) => sum + (Number(r.hours_worked) || 0), 0),
    yesterdayHours: reports.filter(r => r.report_date === yesterdayStr).reduce((sum, r) => sum + (Number(r.hours_worked) || 0), 0)
  }

  return (
    <div className="page-content">
      <div className="section-header">
        <div>
          <h1 className="page-title">EOD Worklogs</h1>
          <p className="page-subtitle">Track daily employee productivity and task progress</p>
        </div>
        <button className="btn btn-primary" onClick={() => {
          setFormData({ employee_id: employees[0]?.id || '', report_date: new Date().toISOString().split('T')[0], tasks_completed: '', tasks_in_progress: '', blockers: 'None', sentiment: 'GOOD', hours_worked: 8 })
          setIsSubmitModalOpen(true)
        }}>
          <Plus size={16} /> Submit EOD
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon purple"><FileText size={22} /></div>
          <div><div className="stat-value">{stats.today}</div><div className="stat-label">Reports Today</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon amber"><XCircle size={22} /></div>
          <div><div className="stat-value">{stats.pending}</div><div className="stat-label">Pending Review</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><Clock size={22} /></div>
          <div><div className="stat-value">{stats.todayHours} hrs</div><div className="stat-label">Total Hours Today</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon gray"><Clock size={22} /></div>
          <div><div className="stat-value">{stats.yesterdayHours} hrs</div><div className="stat-label">Total Hours Yesterday</div></div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="search-bar" style={{ maxWidth: '400px' }}>
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search by employee name..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
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
                  <th>Date & Employee</th>
                  <th>Hours & Mood</th>
                  <th>Tasks Completed</th>
                  <th>Blockers</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(report => (
                  <tr key={report.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{formatDate(report.report_date)}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        {report.employees?.firstName} {report.employees?.lastName}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '13px', fontWeight: 500 }}>{report.hours_worked} hrs</div>
                      <span className={`badge ${
                        report.sentiment === 'GREAT' ? 'badge-active' :
                        report.sentiment === 'STRESSED' ? 'badge-inactive' : 'badge-pending'
                      }`} style={{ marginTop: 4 }}>
                        Feeling: {report.sentiment}
                      </span>
                    </td>
                    <td style={{ fontSize: '13px', maxWidth: '300px' }}>
                      <ul style={{ paddingLeft: '20px', margin: 0, color: 'var(--text-secondary)' }}>
                        {(report.tasks_completed || []).slice(0, 2).map((t: string, i: number) => (
                          <li key={i}>{t}</li>
                        ))}
                        {(report.tasks_completed || []).length > 2 && (
                          <li>...and {(report.tasks_completed || []).length - 2} more</li>
                        )}
                      </ul>
                    </td>
                    <td style={{ fontSize: '13px', color: report.blockers === 'None' ? 'var(--text-muted)' : 'var(--accent-red)' }}>
                      {report.blockers}
                    </td>
                    <td>
                      <span className={`badge ${
                        report.approval_status === 'APPROVED' ? 'badge-approved' : 
                        report.approval_status === 'REJECTED' ? 'badge-inactive' : 'badge-pending'
                      }`}>
                        {report.approval_status || 'PENDING'}
                      </span>
                    </td>
                    <td>
                      {canApprove ? (
                        <button className="btn btn-secondary btn-sm" onClick={() => {
                          setSelectedReport(report)
                          setReviewData({
                            approval_status: report.approval_status || 'APPROVED',
                            supervisor_remarks: report.supervisor_remarks || ''
                          })
                          setIsReviewModalOpen(true)
                        }}>
                          Review
                        </button>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {report.supervisor_remarks ? '💬 ' + report.supervisor_remarks.slice(0, 30) + '...' : '—'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="empty-state">No EOD reports found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isSubmitModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Submit EOD Report</h3>
              <button onClick={() => setIsSubmitModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Employee</label>
                  {canApprove ? (
                    <select className="select" required value={formData.employee_id} onChange={e => setFormData({...formData, employee_id: e.target.value})}>
                      <option value="">Select Employee</option>
                      {employees.map(e => (
                        <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
                      ))}
                    </select>
                  ) : (
                    <input type="text" className="input" disabled value={currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : ''} />
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Report Date</label>
                  <input type="date" className="input" required value={formData.report_date} onChange={e => setFormData({...formData, report_date: e.target.value})} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Tasks Completed (One per line)</label>
                <textarea className="textarea" required rows={3} value={formData.tasks_completed} onChange={e => setFormData({...formData, tasks_completed: e.target.value})} placeholder="- Finished homepage UI&#10;- Fixed API bug..." />
              </div>

              <div className="form-group">
                <label className="form-label">Tasks In Progress (One per line)</label>
                <textarea className="textarea" rows={2} value={formData.tasks_in_progress} onChange={e => setFormData({...formData, tasks_in_progress: e.target.value})} placeholder="- Database migration..." />
              </div>

              <div className="form-group">
                <label className="form-label">Blockers / Issues</label>
                <input type="text" className="input" value={formData.blockers} onChange={e => setFormData({...formData, blockers: e.target.value})} />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">How was your day?</label>
                  <select className="select" required value={formData.sentiment} onChange={e => setFormData({...formData, sentiment: e.target.value})}>
                    <option value="GREAT">Great 🚀</option>
                    <option value="GOOD">Good 👍</option>
                    <option value="OK">Just OK 😐</option>
                    <option value="STRESSED">Stressed 😓</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Total Hours Worked</label>
                  <input type="number" step="0.5" className="input" required value={formData.hours_worked} onChange={e => setFormData({...formData, hours_worked: Number(e.target.value)})} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Submit Report</button>
                <button type="button" className="btn btn-secondary" onClick={() => setIsSubmitModalOpen(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isReviewModalOpen && selectedReport && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Manager Review</h3>
              <button onClick={() => setIsReviewModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleReviewSubmit}>
              <div className="form-group">
                <label className="form-label">Approval Status</label>
                <select className="select" required value={reviewData.approval_status} onChange={e => setReviewData({...reviewData, approval_status: e.target.value})}>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Supervisor Remarks</label>
                <textarea className="textarea" rows={4} value={reviewData.supervisor_remarks} onChange={e => setReviewData({...reviewData, supervisor_remarks: e.target.value})} placeholder="Add your remarks here..." />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Save Review</button>
                <button type="button" className="btn btn-secondary" onClick={() => setIsReviewModalOpen(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
