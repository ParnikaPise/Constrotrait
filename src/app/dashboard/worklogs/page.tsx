// 'use client'
// import { useEffect, useState } from 'react'
// import { supabase } from '@/lib/supabase'
// import { useCurrentUser } from '@/hooks/useCurrentUser'
// import { Plus, Check, FileText, XCircle, Search, X, Clock } from 'lucide-react'
// import { formatDate } from '@/lib/utils'

// export default function WorklogsPage() {
//   const { currentUser } = useCurrentUser()
//   const canApprove = currentUser?.can('approveEOD') ?? false
//   const [reports, setReports] = useState<any[]>([])
//   const [employees, setEmployees] = useState<any[]>([])
//   const [loading, setLoading] = useState(true)
//   const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false)
//   const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
//   const [selectedReport, setSelectedReport] = useState<any>(null)
//   const [search, setSearch] = useState('')

//   const [formData, setFormData] = useState({
//     employee_id: '', report_date: new Date().toISOString().split('T')[0],
//     tasks_completed: '', tasks_in_progress: '', blockers: 'None',
//     sentiment: 'GOOD', hours_worked: 8
//   })

//   const [reviewData, setReviewData] = useState({
//     approval_status: 'APPROVED', supervisor_remarks: ''
//   })

//   useEffect(() => {
//     if (currentUser) fetchData()
//   }, [currentUser])

//   const fetchData = async () => {
//     if (!currentUser) return
//     setLoading(true)

//     // Build query: managers see all EODs, employees see only their own
//     let reportQuery = supabase.from('eod_reports').select('*, employees(firstName, lastName)').order('report_date', { ascending: false })
//     if (!currentUser.can('approveEOD')) {
//       reportQuery = reportQuery.eq('employee_id', currentUser.id)
//     }

//     const [reportRes, empRes] = await Promise.all([
//       reportQuery,
//       supabase.from('employees').select('id, firstName, lastName').eq('status', 'ACTIVE')
//     ])
//     if (reportRes.data) setReports(reportRes.data)
//     if (empRes.data) setEmployees(empRes.data)
//     setLoading(false)
//   }

//   const handleSubmit = async (e: React.FormEvent) => {
//   e.preventDefault()

//   const now = new Date()

//     const hours = now.getHours()
//     const minutes = now.getMinutes()

//     // 12:00 AM नंतर submit बंद
//     if (hours === 0 && minutes > 0) {
//       alert("Today's EOD submission time has ended.")
//       return
//     }

//   // Employee ID
//   const employeeId =
//     canApprove
//       ? formData.employee_id
//       : currentUser?.id || formData.employee_id

//   const payload = {
//     ...formData,
//     employee_id: employeeId,
//     approval_status: 'PENDING',
//     tasks_completed: formData.tasks_completed
//       .split('\n')
//       .filter((t) => t.trim() !== ''),
//     tasks_in_progress: formData.tasks_in_progress
//       .split('\n')
//       .filter((t) => t.trim() !== ''),
//   }

//   // Save EOD
//   const { error } = await supabase
//     .from('eod_reports')
//     .insert([
//       {
//         id: crypto.randomUUID(),
//         ...payload,
//       },
//     ])

//   if (error) {
//     alert(error.message)
//     return
//   }

//   // -------------------------------------
//   // Attendance Auto Present
//   // -------------------------------------

//   const today = formData.report_date

//   const { data: attendanceRecord } = await supabase
//     .from('attendance')
//     .select('id')
//     .eq('employee_id', employeeId)
//     .eq('date', today)
//     .maybeSingle()

//   if (attendanceRecord) {

//     await supabase
//       .from('attendance')
//       .update({
//         status: 'PRESENT',
//         check_in: new Date().toISOString(),
//         eod_submitted: true,
//       })
//       .eq('id', attendanceRecord.id)

//   } else {

//     await supabase
//       .from('attendance')
//       .insert({
//         employee_id: employeeId,
//         date: today,
//         status: 'PRESENT',
//         check_in: new Date().toISOString(),
//         eod_submitted: true,
//         branch_id: currentUser?.branch_id ?? null,
//       })

//   }

//   alert('EOD Submitted Successfully.')

//   setIsSubmitModalOpen(false)

//   fetchData()
// }

//   const handleReviewSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     if (!selectedReport) return

//     const { error } = await supabase.from('eod_reports').update({
//       approval_status: reviewData.approval_status,
//       supervisor_remarks: reviewData.supervisor_remarks
//     }).eq('id', selectedReport.id)

//     if (error) alert(error.message)
//     setIsReviewModalOpen(false)
//     fetchData()
//   }

//   const filtered = reports.filter(r =>
//     (r.employees?.firstName + ' ' + r.employees?.lastName).toLowerCase().includes(search.toLowerCase())
//   )

//   const todayStr = new Date().toISOString().split('T')[0];
//   const yesterday = new Date();
//   yesterday.setDate(yesterday.getDate() - 1);
//   const yesterdayStr = yesterday.toISOString().split('T')[0];

//   const stats = {
//     today: reports.filter(r => r.report_date === todayStr).length,
//     pending: reports.filter(r => r.approval_status === 'PENDING').length,
//     todayHours: reports.filter(r => r.report_date === todayStr).reduce((sum, r) => sum + (Number(r.hours_worked) || 0), 0),
//     yesterdayHours: reports.filter(r => r.report_date === yesterdayStr).reduce((sum, r) => sum + (Number(r.hours_worked) || 0), 0)
//   }

//   return (
//     <div className="page-content">
//       <div className="section-header">
//         <div>
//           <h1 className="page-title">EOD Worklogs</h1>
//           <p className="page-subtitle">Track daily employee productivity and task progress</p>
//         </div>
//         <button className="btn btn-primary" onClick={() => {
//           setFormData({ employee_id: employees[0]?.id || '', report_date: new Date().toISOString().split('T')[0], tasks_completed: '', tasks_in_progress: '', blockers: 'None', sentiment: 'GOOD', hours_worked: 8 })
//           setIsSubmitModalOpen(true)
//         }}>
//           <Plus size={16} /> Submit EOD
//         </button>
//       </div>

//       <div className="stats-grid">
//         <div className="stat-card">
//           <div className="stat-icon purple"><FileText size={22} /></div>
//           <div><div className="stat-value">{stats.today}</div><div className="stat-label">Reports Today</div></div>
//         </div>
//         <div className="stat-card">
//           <div className="stat-icon amber"><XCircle size={22} /></div>
//           <div><div className="stat-value">{stats.pending}</div><div className="stat-label">Pending Review</div></div>
//         </div>
//         <div className="stat-card">
//           <div className="stat-icon blue"><Clock size={22} /></div>
//           <div><div className="stat-value">{stats.todayHours} hrs</div><div className="stat-label">Total Hours Today</div></div>
//         </div>
//         <div className="stat-card">
//           <div className="stat-icon gray"><Clock size={22} /></div>
//           <div><div className="stat-value">{stats.yesterdayHours} hrs</div><div className="stat-label">Total Hours Yesterday</div></div>
//         </div>
//       </div>

//       <div className="card" style={{ marginBottom: '20px' }}>
//         <div className="search-bar" style={{ maxWidth: '400px' }}>
//           <Search size={18} />
//           <input
//             type="text"
//             placeholder="Search by employee name..."
//             value={search}
//             onChange={e => setSearch(e.target.value)}
//           />
//         </div>
//       </div>

//       <div className="card" style={{ padding: 0 }}>
//         {loading ? (
//           <div className="spinner" />
//         ) : (
//           <div className="table-container">
//             <table>
//               <thead>
//                 <tr>
//                   <th>Date & Employee</th>
//                   <th>Hours & Mood</th>
//                   <th>Tasks Completed</th>
//                   <th>Blockers</th>
//                   <th>Status</th>
//                   <th>Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {filtered.map(report => (
//                   <tr key={report.id}>
//                     <td>
//                       <div style={{ fontWeight: 600 }}>{formatDate(report.report_date)}</div>
//                       <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
//                         {report.employees?.firstName} {report.employees?.lastName}
//                       </div>
//                     </td>
//                     <td>
//                       <div style={{ fontSize: '13px', fontWeight: 500 }}>{report.hours_worked} hrs</div>
//                       <span className={`badge ${
//                         report.sentiment === 'GREAT' ? 'badge-active' :
//                         report.sentiment === 'STRESSED' ? 'badge-inactive' : 'badge-pending'
//                       }`} style={{ marginTop: 4 }}>
//                         Feeling: {report.sentiment}
//                       </span>
//                     </td>
//                     <td style={{ fontSize: '13px', maxWidth: '300px' }}>
//                       <ul style={{ paddingLeft: '20px', margin: 0, color: 'var(--text-secondary)' }}>
//                         {(report.tasks_completed || []).slice(0, 2).map((t: string, i: number) => (
//                           <li key={i}>{t}</li>
//                         ))}
//                         {(report.tasks_completed || []).length > 2 && (
//                           <li>...and {(report.tasks_completed || []).length - 2} more</li>
//                         )}
//                       </ul>
//                     </td>
//                     <td style={{ fontSize: '13px', color: report.blockers === 'None' ? 'var(--text-muted)' : 'var(--accent-red)' }}>
//                       {report.blockers}
//                     </td>
//                     <td>
//                       <span className={`badge ${
//                         report.approval_status === 'APPROVED' ? 'badge-approved' :
//                         report.approval_status === 'REJECTED' ? 'badge-inactive' : 'badge-pending'
//                       }`}>
//                         {report.approval_status || 'PENDING'}
//                       </span>
//                     </td>
//                     <td>
//                       {canApprove ? (
//                         <button className="btn btn-secondary btn-sm" onClick={() => {
//                           setSelectedReport(report)
//                           setReviewData({
//                             approval_status: report.approval_status || 'APPROVED',
//                             supervisor_remarks: report.supervisor_remarks || ''
//                           })
//                           setIsReviewModalOpen(true)
//                         }}>
//                           Review
//                         </button>
//                       ) : (
//                         <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
//                           {report.supervisor_remarks ? '💬 ' + report.supervisor_remarks.slice(0, 30) + '...' : '—'}
//                         </span>
//                       )}
//                     </td>
//                   </tr>
//                 ))}
//                 {filtered.length === 0 && (
//                   <tr>
//                     <td colSpan={6} className="empty-state">No EOD reports found.</td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>

//       {isSubmitModalOpen && (
//         <div className="modal-overlay">
//           <div className="modal">
//             <div className="modal-header">
//               <h3 className="modal-title">Submit EOD Report</h3>
//               <button onClick={() => setIsSubmitModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
//                 <X size={20} />
//               </button>
//             </div>

//             <form onSubmit={handleSubmit}>
//               <div className="grid-2">
//                 <div className="form-group">
//                   <label className="form-label">Employee</label>
//                   {canApprove ? (
//                     <select className="select" required value={formData.employee_id} onChange={e => setFormData({...formData, employee_id: e.target.value})}>
//                       <option value="">Select Employee</option>
//                       {employees.map(e => (
//                         <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
//                       ))}
//                     </select>
//                   ) : (
//                     <input type="text" className="input" disabled value={currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : ''} />
//                   )}
//                 </div>
//                 <div className="form-group">
//                   <label className="form-label">Report Date</label>
//                   <input type="date" className="input" required value={formData.report_date} onChange={e => setFormData({...formData, report_date: e.target.value})} />
//                 </div>
//               </div>

//               <div className="form-group">
//                 <label className="form-label">Tasks Completed (One per line)</label>
//                 <textarea className="textarea" required rows={3} value={formData.tasks_completed} onChange={e => setFormData({...formData, tasks_completed: e.target.value})} placeholder="- Finished homepage UI&#10;- Fixed API bug..." />
//               </div>

//               <div className="form-group">
//                 <label className="form-label">Tasks In Progress (One per line)</label>
//                 <textarea className="textarea" rows={2} value={formData.tasks_in_progress} onChange={e => setFormData({...formData, tasks_in_progress: e.target.value})} placeholder="- Database migration..." />
//               </div>

//               <div className="form-group">
//                 <label className="form-label">Blockers / Issues</label>
//                 <input type="text" className="input" value={formData.blockers} onChange={e => setFormData({...formData, blockers: e.target.value})} />
//               </div>

//               <div className="grid-2">
//                 <div className="form-group">
//                   <label className="form-label">How was your day?</label>
//                   <select className="select" required value={formData.sentiment} onChange={e => setFormData({...formData, sentiment: e.target.value})}>
//                     <option value="GREAT">Great 🚀</option>
//                     <option value="GOOD">Good 👍</option>
//                     <option value="OK">Just OK 😐</option>
//                     <option value="STRESSED">Stressed 😓</option>
//                   </select>
//                 </div>
//                 <div className="form-group">
//                   <label className="form-label">Total Hours Worked</label>
//                   <input type="number" step="0.5" className="input" required value={formData.hours_worked} onChange={e => setFormData({...formData, hours_worked: Number(e.target.value)})} />
//                 </div>
//               </div>

//               <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
//                 <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Submit Report</button>
//                 <button type="button" className="btn btn-secondary" onClick={() => setIsSubmitModalOpen(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}

//       {isReviewModalOpen && selectedReport && (
//         <div className="modal-overlay">
//           <div className="modal">
//             <div className="modal-header">
//               <h3 className="modal-title">Manager Review</h3>
//               <button onClick={() => setIsReviewModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
//                 <X size={20} />
//               </button>
//             </div>

//             <form onSubmit={handleReviewSubmit}>
//               <div className="form-group">
//                 <label className="form-label">Approval Status</label>
//                 <select className="select" required value={reviewData.approval_status} onChange={e => setReviewData({...reviewData, approval_status: e.target.value})}>
//                   <option value="PENDING">Pending</option>
//                   <option value="APPROVED">Approved</option>
//                   <option value="REJECTED">Rejected</option>
//                 </select>
//               </div>

//               <div className="form-group">
//                 <label className="form-label">Supervisor Remarks</label>
//                 <textarea className="textarea" rows={4} value={reviewData.supervisor_remarks} onChange={e => setReviewData({...reviewData, supervisor_remarks: e.target.value})} placeholder="Add your remarks here..." />
//               </div>

//               <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
//                 <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Save Review</button>
//                 <button type="button" className="btn btn-secondary" onClick={() => setIsReviewModalOpen(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }

// 'use client'

// import { useEffect, useState } from 'react'
// import { supabase } from '@/lib/supabase'
// import { useCurrentUser } from '@/hooks/useCurrentUser'
// import {
//   Plus, Check, FileText, XCircle, Search, X, Clock,
//   Calendar, Users, BarChart3, TrendingUp, AlertTriangle, Smile
// } from 'lucide-react'
// import { formatDate } from '@/lib/utils'

// export default function WorklogsPage(): import("react").JSX.Element {
//   const { currentUser } = useCurrentUser()
//   const canApprove = currentUser?.can('approveEOD') ?? false
//   const [reports, setReports] = useState<any[]>([])
//   const [employees, setEmployees] = useState<any[]>([])
//   const [loading, setLoading] = useState(true)
//   const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false)
//   const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
//   const [selectedReport, setSelectedReport] = useState<any>(null)
//   const [search, setSearch] = useState('')
//   const [activeTab, setActiveTab] = useState<'daily' | 'weekly-monthly' | 'contribution' | 'productivity'>('daily')
//   const [reportTimeframe, setReportTimeframe] = useState<'weekly' | 'monthly'>('weekly')

//   // Selected details for a period popup in Weekly/Monthly tab
//   const [selectedPeriodDetails, setSelectedPeriodDetails] = useState<any | null>(null)

//   const [formData, setFormData] = useState({
//     employee_id: '', report_date: new Date().toISOString().split('T')[0],
//     tasks_completed: '', tasks_in_progress: '', blockers: 'None',
//     sentiment: 'GOOD', hours_worked: 8
//   })

//   const [reviewData, setReviewData] = useState({
//     approval_status: 'APPROVED', supervisor_remarks: ''
//   })

//   useEffect(() => {
//     if (currentUser) fetchData()
//   }, [currentUser])

//   const fetchData = async () => {
//     if (!currentUser) return
//     setLoading(true)

//     // Build query: managers see all EODs, employees see only their own
//     let reportQuery = supabase.from('eod_reports').select('*, employees(firstName, lastName)').order('report_date', { ascending: false })
//     if (!currentUser.can('approveEOD')) {
//       reportQuery = reportQuery.eq('employee_id', currentUser.id)
//     }

//     const [reportRes, empRes] = await Promise.all([
//       reportQuery,
//       supabase.from('employees').select('id, firstName, lastName').eq('status', 'ACTIVE')
//     ])
//     if (reportRes.data) setReports(reportRes.data)
//     if (empRes.data) setEmployees(empRes.data)
//     setLoading(false)
//   }

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()

//     const now = new Date()
//     const hours = now.getHours()
//     const minutes = now.getMinutes()

//     // 12:00 AM after submit closed
//     if (hours === 0 && minutes > 0) {
//       alert("Today's EOD submission time has ended.")
//       return
//     }

//     // Employee ID
//     const employeeId =
//       canApprove
//         ? formData.employee_id
//         : currentUser?.id || formData.employee_id

//     const payload = {
//       ...formData,
//       employee_id: employeeId,
//       approval_status: 'PENDING',
//       tasks_completed: formData.tasks_completed
//         .split('\n')
//         .filter((t) => t.trim() !== ''),
//       tasks_in_progress: formData.tasks_in_progress
//         .split('\n')
//         .filter((t) => t.trim() !== ''),
//     }

//     // Save EOD
//     const { error } = await supabase
//       .from('eod_reports')
//       .insert([
//         {
//           id: crypto.randomUUID(),
//           ...payload,
//         },
//       ])

//     if (error) {
//       alert(error.message)
//       return
//     }

//     // Attendance Auto Present
//     const today = formData.report_date

//     const { data: attendanceRecord } = await supabase
//       .from('attendance')
//       .select('id')
//       .eq('employee_id', employeeId)
//       .eq('date', today)
//       .maybeSingle()

//     if (attendanceRecord) {
//       await supabase
//         .from('attendance')
//         .update({
//           status: 'PRESENT',
//           check_in: new Date().toISOString(),
//           eod_submitted: true,
//         })
//         .eq('id', attendanceRecord.id)
//     } else {
//       await supabase
//         .from('attendance')
//         .insert({
//           employee_id: employeeId,
//           date: today,
//           status: 'PRESENT',
//           check_in: new Date().toISOString(),
//           eod_submitted: true,
//           branch_id: currentUser?.branch_id ?? null,
//         })
//     }

//     alert('EOD Submitted Successfully.')
//     setIsSubmitModalOpen(false)
//     fetchData()
//   }

//   const handleReviewSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     if (!selectedReport) return

//     const { error } = await supabase.from('eod_reports').update({
//       approval_status: reviewData.approval_status,
//       supervisor_remarks: reviewData.supervisor_remarks
//     }).eq('id', selectedReport.id)

//     if (error) alert(error.message)
//     setIsReviewModalOpen(false)
//     fetchData()
//   }

//   const filtered = reports.filter(r =>
//     ((r.employees?.firstName || '') + ' ' + (r.employees?.lastName || '')).toLowerCase().includes(search.toLowerCase())
//   )

//   const todayStr = new Date().toISOString().split('T')[0];
//   const yesterday = new Date();
//   yesterday.setDate(yesterday.getDate() - 1);
//   const yesterdayStr = yesterday.toISOString().split('T')[0];

//   const stats = {
//     today: reports.filter(r => r.report_date === todayStr).length,
//     pending: reports.filter(r => r.approval_status === 'PENDING').length,
//     todayHours: reports.filter(r => r.report_date === todayStr).reduce((sum, r) => sum + (Number(r.hours_worked) || 0), 0),
//     yesterdayHours: reports.filter(r => r.report_date === yesterdayStr).reduce((sum, r) => sum + (Number(r.hours_worked) || 0), 0)
//   }

//   // --- Date Utility Helpers for Report Period Mapping ---
//   const getWeekStart = (dateStr: string) => {
//     const d = new Date(dateStr)
//     const day = d.getDay()
//     const diff = d.getDate() - day + (day === 0 ? -6 : 1) // adjust to Monday
//     const start = new Date(d.setDate(diff))
//     return start.toISOString().split('T')[0]
//   }

//   const getMonthYear = (dateStr: string) => {
//     return dateStr.substring(0, 7) // "YYYY-MM"
//   }

//   // --- Aggregate: Weekly & Monthly Periods ---
//   const getPeriodSummaries = () => {
//     const summaries: Record<string, any> = {}

//     reports.forEach(report => {
//       const dateStr = report.report_date
//       let periodKey = ''
//       let displayLabel = ''

//       if (reportTimeframe === 'weekly') {
//         const weekStart = getWeekStart(dateStr)
//         periodKey = weekStart
//         displayLabel = `Week of ${formatDate(weekStart)}`
//       } else {
//         const my = getMonthYear(dateStr)
//         periodKey = my
//         const [year, month] = my.split('-')
//         const monthName = new Date(Number(year), Number(month) - 1, 1).toLocaleString('default', { month: 'long' })
//         displayLabel = `${monthName} ${year}`
//       }

//       if (!summaries[periodKey]) {
//         summaries[periodKey] = {
//           key: periodKey,
//           label: displayLabel,
//           reportsCount: 0,
//           totalHours: 0,
//           sentimentCounts: { GREAT: 0, GOOD: 0, OK: 0, STRESSED: 0 },
//           blockerCount: 0,
//           blockersList: [] as string[],
//           employeeDetails: {} as Record<string, { name: string; hours: number; count: number }>
//         }
//       }

//       const sum = summaries[periodKey]
//       sum.reportsCount += 1
//       sum.totalHours += Number(report.hours_worked) || 0

//       // Sentiment
//       const sent = (report.sentiment || 'GOOD').toUpperCase()
//       if (sum.sentimentCounts[sent] !== undefined) {
//         sum.sentimentCounts[sent] += 1
//       } else {
//         sum.sentimentCounts['GOOD'] += 1
//       }

//       // Blockers
//       if (report.blockers && report.blockers.toLowerCase() !== 'none' && report.blockers.trim() !== '') {
//         sum.blockerCount += 1
//         const empName = report.employees ? `${report.employees.firstName} ${report.employees.lastName}` : 'Unknown'
//         sum.blockersList.push(`${empName}: ${report.blockers} (${formatDate(dateStr)})`)
//       }

//       // Employee breakdown
//       const empId = report.employee_id
//       const empName = report.employees ? `${report.employees.firstName} ${report.employees.lastName}` : 'Unknown'
//       if (!sum.employeeDetails[empId]) {
//         sum.employeeDetails[empId] = { name: empName, hours: 0, count: 0 }
//       }
//       sum.employeeDetails[empId].hours += Number(report.hours_worked) || 0
//       sum.employeeDetails[empId].count += 1
//     })

//     return Object.values(summaries).sort((a, b) => b.key.localeCompare(a.key))
//   }

//   // --- Aggregate: Employee Contribution Analysis ---
//   const getEmployeeContributions = () => {
//     const contributions: Record<string, any> = {}

//     reports.forEach(report => {
//       const empId = report.employee_id
//       const empName = report.employees ? `${report.employees.firstName} ${report.employees.lastName}` : 'Unknown'

//       if (!contributions[empId]) {
//         contributions[empId] = {
//           id: empId,
//           name: empName,
//           totalHours: 0,
//           reportCount: 0,
//           completedTasksCount: 0,
//           inProgressTasksCount: 0,
//           sentimentCounts: { GREAT: 0, GOOD: 0, OK: 0, STRESSED: 0 },
//           blockers: [] as string[],
//           averageHours: 0,
//           productivityScore: 0
//         }
//       }

//       const c = contributions[empId]
//       c.reportCount += 1
//       c.totalHours += Number(report.hours_worked) || 0

//       const completed = Array.isArray(report.tasks_completed) ? report.tasks_completed : []
//       const inProgress = Array.isArray(report.tasks_in_progress) ? report.tasks_in_progress : []
//       c.completedTasksCount += completed.length
//       c.inProgressTasksCount += inProgress.length

//       const sent = (report.sentiment || 'GOOD').toUpperCase()
//       if (c.sentimentCounts[sent] !== undefined) {
//         c.sentimentCounts[sent] += 1
//       } else {
//         c.sentimentCounts['GOOD'] += 1
//       }

//       if (report.blockers && report.blockers.toLowerCase() !== 'none' && report.blockers.trim() !== '') {
//         c.blockers.push(report.blockers)
//       }
//     })

//     return Object.values(contributions).map(c => {
//       c.averageHours = c.reportCount > 0 ? Number((c.totalHours / c.reportCount).toFixed(1)) : 0

//       // Weights: GREAT = 100%, GOOD = 85%, OK = 65%, STRESSED = 40%
//       let scoreSum = 0
//       let totalSentiments = 0
//       const weights: Record<string, number> = { GREAT: 100, GOOD: 85, OK: 65, STRESSED: 40 }

//       Object.entries(c.sentimentCounts).forEach(([sentiment, count]) => {
//         scoreSum += (weights[sentiment] || 85) * (count as number)
//         totalSentiments += (count as number)
//       })

//       // Subtract blocker rate penalty (up to 15 points)
//       const blockerRate = c.reportCount > 0 ? c.blockers.length / c.reportCount : 0
//       const blockerPenalty = Math.min(15, blockerRate * 20)

//       c.productivityScore = totalSentiments > 0
//         ? Math.max(10, Math.round((scoreSum / totalSentiments) - blockerPenalty))
//         : 80

//       return c
//     }).sort((a, b) => b.totalHours - a.totalHours)
//   }

//   // --- Aggregate: Productivity & Hours Overview Dashboard ---
//   const getProductivityMetrics = () => {
//     if (reports.length === 0) {
//       return {
//         avgHoursPerEod: 0,
//         totalHoursLogged: 0,
//         totalTasksDone: 0,
//         averageProductivity: 0,
//         sentimentSplits: { GREAT: 0, GOOD: 0, OK: 0, STRESSED: 0 },
//         blockerRate: 0
//       }
//     }

//     const totalHours = reports.reduce((sum, r) => sum + (Number(r.hours_worked) || 0), 0)
//     const avgHours = totalHours / reports.length

//     let totalTasks = 0
//     let totalBlockers = 0
//     const sentiments = { GREAT: 0, GOOD: 0, OK: 0, STRESSED: 0 }

//     reports.forEach(r => {
//       totalTasks += Array.isArray(r.tasks_completed) ? r.tasks_completed.length : 0

//       if (r.blockers && r.blockers.toLowerCase() !== 'none' && r.blockers.trim() !== '') {
//         totalBlockers += 1
//       }

//       const sent = (r.sentiment || 'GOOD').toUpperCase()
//       if (sentiments[sent as keyof typeof sentiments] !== undefined) {
//         sentiments[sent as keyof typeof sentiments] += 1
//       } else {
//         sentiments['GOOD'] += 1
//       }
//     })

//     const weights: Record<string, number> = { GREAT: 100, GOOD: 85, OK: 65, STRESSED: 40 }
//     let scoreSum = 0
//     Object.entries(sentiments).forEach(([s, count]) => {
//       scoreSum += (weights[s] || 85) * count
//     })

//     const blockerPercentage = (totalBlockers / reports.length) * 100
//     const averageProductivity = Math.max(10, Math.round((scoreSum / reports.length) - (totalBlockers / reports.length * 15)))

//     return {
//       avgHoursPerEod: Number(avgHours.toFixed(1)),
//       totalHoursLogged: totalHours,
//       totalTasksDone: totalTasks,
//       averageProductivity,
//       sentimentSplits: {
//         GREAT: Math.round((sentiments.GREAT / reports.length) * 100),
//         GOOD: Math.round((sentiments.GOOD / reports.length) * 100),
//         OK: Math.round((sentiments.OK / reports.length) * 100),
//         STRESSED: Math.round((sentiments.STRESSED / reports.length) * 100)
//       },
//       blockerRate: Math.round(blockerPercentage)
//     }
//   }

//   const periodSummaries = getPeriodSummaries()
//   const employeeContributions = getEmployeeContributions()
//   const productivityMetrics = getProductivityMetrics()

//   return (
//     <div className="page-content">
//       {/* Dynamic Embedded Styles for CSS charts, tabs and custom premium layouts */}
//       <style>{`
//         .tab-navigation {
//           display: flex;
//           gap: 4px;
//           border-bottom: 1px solid var(--border-color, #e2e8f0);
//           margin-bottom: 24px;
//           padding-bottom: 2px;
//         }
//         .tab-navigation button {
//           background: none;
//           border: none;
//           padding: 8px 16px;
//           font-size: 14px;
//           font-weight: 500;
//           color: var(--text-secondary, #64748b);
//           cursor: pointer;
//           border-bottom: 2px solid transparent;
//           transition: all 0.2s ease;
//           display: flex;
//           align-items: center;
//           gap: 8px;
//         }
//         .tab-navigation button:hover {
//           color: var(--text-primary, #0f172a);
//           background-color: var(--bg-hover, #f8fafc);
//           border-radius: 4px 4px 0 0;
//         }
//         .tab-navigation button.active {
//           color: var(--primary-color, #6366f1);
//           border-bottom-color: var(--primary-color, #6366f1);
//           font-weight: 600;
//         }
//         .grid-3 {
//           display: grid;
//           grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
//           gap: 20px;
//           margin-bottom: 20px;
//         }
//         .dashboard-card {
//           background: var(--card-bg, #ffffff);
//           border: 1px solid var(--border-color, #e2e8f0);
//           border-radius: 8px;
//           padding: 20px;
//           box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
//         }
//         .dashboard-card-title {
//           font-size: 14px;
//           font-weight: 600;
//           color: var(--text-secondary, #64748b);
//           text-transform: uppercase;
//           letter-spacing: 0.05em;
//           margin-bottom: 16px;
//           display: flex;
//           align-items: center;
//           gap: 6px;
//         }
//         .metric-highlight {
//           font-size: 32px;
//           font-weight: 700;
//           color: var(--text-primary, #0f172a);
//           margin-bottom: 8px;
//         }
//         .progress-bar-container {
//           background-color: #f1f5f9;
//           border-radius: 9999px;
//           height: 10px;
//           width: 100%;
//           overflow: hidden;
//           margin-top: 8px;
//         }
//         .progress-bar-fill {
//           height: 100%;
//           border-radius: 9999px;
//           transition: width 0.4s ease-out;
//         }
//         .sentiment-ratio-bar {
//           display: flex;
//           height: 24px;
//           border-radius: 6px;
//           overflow: hidden;
//           margin-bottom: 16px;
//         }
//         .sentiment-segment {
//           height: 100%;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           color: #ffffff;
//           font-size: 10px;
//           font-weight: bold;
//         }
//         .chart-list {
//           display: flex;
//           flex-direction: column;
//           gap: 12px;
//         }
//         .chart-row {
//           display: flex;
//           align-items: center;
//           gap: 12px;
//           font-size: 13px;
//         }
//         .chart-label {
//           width: 120px;
//           text-overflow: ellipsis;
//           overflow: hidden;
//           white-space: nowrap;
//           font-weight: 500;
//         }
//         .chart-track {
//           flex: 1;
//           background-color: #f1f5f9;
//           height: 12px;
//           border-radius: 6px;
//           overflow: hidden;
//         }
//         .chart-bar {
//           height: 100%;
//           background-color: var(--primary-color, #6366f1);
//           border-radius: 6px;
//         }
//         .chart-value {
//           width: 60px;
//           text-align: right;
//           font-weight: 600;
//           color: var(--text-secondary);
//         }
//         .employee-contrib-card {
//           border: 1px solid var(--border-color, #e2e8f0);
//           border-radius: 8px;
//           background: #ffffff;
//           padding: 16px;
//           transition: box-shadow 0.2s ease;
//         }
//         .employee-contrib-card:hover {
//           box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
//         }
//         .card-header-flex {
//           display: flex;
//           justify-content: space-between;
//           align-items: flex-start;
//           margin-bottom: 12px;
//         }
//         .card-header-name {
//           font-size: 16px;
//           font-weight: 600;
//           color: var(--text-primary, #0f172a);
//         }
//         .stats-badge-grid {
//           display: grid;
//           grid-template-columns: repeat(2, 1fr);
//           gap: 8px;
//           margin-bottom: 16px;
//           font-size: 12px;
//         }
//         .stats-badge {
//           background-color: #f8fafc;
//           border: 1px solid #f1f5f9;
//           padding: 6px;
//           border-radius: 4px;
//           display: flex;
//           flex-direction: column;
//         }
//         .badge-number {
//           font-weight: 600;
//           font-size: 14px;
//           color: var(--text-primary);
//         }
//         .badge-label {
//           color: var(--text-muted, #94a3b8);
//           font-size: 10px;
//         }
//         .blockers-scroller {
//           max-height: 80px;
//           overflow-y: auto;
//           font-size: 11px;
//           border-top: 1px solid #f1f5f9;
//           padding-top: 8px;
//           margin-top: 8px;
//           color: var(--text-secondary);
//         }
//         .blockers-scroller ul {
//           margin: 0;
//           padding-left: 14px;
//         }
//         .toggle-container {
//           display: flex;
//           background-color: #f1f5f9;
//           border-radius: 6px;
//           padding: 2px;
//           width: fit-content;
//         }
//         .toggle-btn {
//           border: none;
//           background: none;
//           padding: 6px 12px;
//           font-size: 12px;
//           font-weight: 500;
//           cursor: pointer;
//           border-radius: 4px;
//           color: var(--text-secondary);
//           transition: all 0.15s ease;
//         }
//         .toggle-btn.active {
//           background-color: #ffffff;
//           color: var(--text-primary);
//           box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
//         }
//       `}</style>

//       {/* Main Header */}
//       <div className="section-header">
//         <div>
//           <h1 className="page-title">EOD Worklogs & Performance</h1>
//           <p className="page-subtitle">Track daily employee productivity, project blockers, and contribution reports</p>
//         </div>
//         <button className="btn btn-primary" onClick={() => {
//           setFormData({ employee_id: employees[0]?.id || '', report_date: new Date().toISOString().split('T')[0], tasks_completed: '', tasks_in_progress: '', blockers: 'None', sentiment: 'GOOD', hours_worked: 8 })
//           setIsSubmitModalOpen(true)
//         }}>
//           <Plus size={16} /> Submit EOD
//         </button>
//       </div>

//       {/* Tab Controls */}
//       <div className="tab-navigation">
//         <button className={activeTab === 'daily' ? 'active' : ''} onClick={() => setActiveTab('daily')}>
//           <FileText size={16} /> Daily Worklogs
//         </button>
//         <button className={activeTab === 'weekly-monthly' ? 'active' : ''} onClick={() => setActiveTab('weekly-monthly')}>
//           <Calendar size={16} /> Weekly / Monthly Reports
//         </button>
//         <button className={activeTab === 'contribution' ? 'active' : ''} onClick={() => setActiveTab('contribution')}>
//           <Users size={16} /> Employee Contribution
//         </button>
//         <button className={activeTab === 'productivity' ? 'active' : ''} onClick={() => setActiveTab('productivity')}>
//           <BarChart3 size={16} /> Hour & Productivity Tracking
//         </button>
//       </div>

//       {/* RENDER TAB 1: DAILY WORKLOGS (EXISTING DESIGN WITH STATS) */}
//       {activeTab === 'daily' && (
//         <>
//           <div className="stats-grid">
//             <div className="stat-card">
//               <div className="stat-icon purple"><FileText size={22} /></div>
//               <div><div className="stat-value">{stats.today}</div><div className="stat-label">Reports Today</div></div>
//             </div>
//             <div className="stat-card">
//               <div className="stat-icon amber"><XCircle size={22} /></div>
//               <div><div className="stat-value">{stats.pending}</div><div className="stat-label">Pending Review</div></div>
//             </div>
//             <div className="stat-card">
//               <div className="stat-icon blue"><Clock size={22} /></div>
//               <div><div className="stat-value">{stats.todayHours} hrs</div><div className="stat-label">Total Hours Today</div></div>
//             </div>
//             <div className="stat-card">
//               <div className="stat-icon gray"><Clock size={22} /></div>
//               <div><div className="stat-value">{stats.yesterdayHours} hrs</div><div className="stat-label">Total Hours Yesterday</div></div>
//             </div>
//           </div>

//           <div className="card" style={{ marginBottom: '20px' }}>
//             <div className="search-bar" style={{ maxWidth: '400px' }}>
//               <Search size={18} />
//               <input
//                 type="text"
//                 placeholder="Search by employee name..."
//                 value={search}
//                 onChange={e => setSearch(e.target.value)}
//               />
//             </div>
//           </div>

//           <div className="card" style={{ padding: 0 }}>
//             {loading ? (
//               <div className="spinner" />
//             ) : (
//               <div className="table-container">
//                 <table>
//                   <thead>
//                     <tr>
//                       <th>Date & Employee</th>
//                       <th>Hours & Mood</th>
//                       <th>Tasks Completed</th>
//                       <th>Blockers</th>
//                       <th>Status</th>
//                       <th>Actions</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {filtered.map(report => (
//                       <tr key={report.id}>
//                         <td>
//                           <div style={{ fontWeight: 600 }}>{formatDate(report.report_date)}</div>
//                           <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
//                             {report.employees?.firstName} {report.employees?.lastName}
//                           </div>
//                         </td>
//                         <td>
//                           <div style={{ fontSize: '13px', fontWeight: 500 }}>{report.hours_worked} hrs</div>
//                           <span className={`badge ${
//                             report.sentiment === 'GREAT' ? 'badge-active' :
//                             report.sentiment === 'STRESSED' ? 'badge-inactive' : 'badge-pending'
//                           }`} style={{ marginTop: 4 }}>
//                             Feeling: {report.sentiment}
//                           </span>
//                         </td>
//                         <td style={{ fontSize: '13px', maxWidth: '300px' }}>
//                           <ul style={{ paddingLeft: '20px', margin: 0, color: 'var(--text-secondary)' }}>
//                             {(report.tasks_completed || []).slice(0, 2).map((t: string, i: number) => (
//                               <li key={i}>{t}</li>
//                             ))}
//                             {(report.tasks_completed || []).length > 2 && (
//                               <li>...and {(report.tasks_completed || []).length - 2} more</li>
//                             )}
//                           </ul>
//                         </td>
//                         <td style={{ fontSize: '13px', color: report.blockers === 'None' ? 'var(--text-muted)' : 'var(--accent-red)' }}>
//                           {report.blockers}
//                         </td>
//                         <td>
//                           <span className={`badge ${
//                             report.approval_status === 'APPROVED' ? 'badge-approved' :
//                             report.approval_status === 'REJECTED' ? 'badge-inactive' : 'badge-pending'
//                           }`}>
//                             {report.approval_status || 'PENDING'}
//                           </span>
//                         </td>
//                         <td>
//                           {canApprove ? (
//                             <button className="btn btn-secondary btn-sm" onClick={() => {
//                               setSelectedReport(report)
//                               setReviewData({
//                                 approval_status: report.approval_status || 'APPROVED',
//                                 supervisor_remarks: report.supervisor_remarks || ''
//                               })
//                               setIsReviewModalOpen(true)
//                             }}>
//                               Review
//                             </button>
//                           ) : (
//                             <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
//                               {report.supervisor_remarks ? '💬 ' + report.supervisor_remarks.slice(0, 30) + '...' : '—'}
//                             </span>
//                           )}
//                         </td>
//                       </tr>
//                     ))}
//                     {filtered.length === 0 && (
//                       <tr>
//                         <td colSpan={6} className="empty-state">No EOD reports found.</td>
//                       </tr>
//                     )}
//                   </tbody>
//                 </table>
//               </div>
//             )}
//           </div>
//         </>
//       )}

//       {/* RENDER TAB 2: WEEKLY & MONTHLY REPORTS */}
//       {activeTab === 'weekly-monthly' && (
//         <div className="card" style={{ padding: '24px' }}>
//           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
//             <div>
//               <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Aggregated Performance Periods</h2>
//               <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
//                 Summary of submissions, work hours, and sentiments grouped by time blocks
//               </p>
//             </div>
//             <div className="toggle-container">
//               <button
//                 className={`toggle-btn ${reportTimeframe === 'weekly' ? 'active' : ''}`}
//                 onClick={() => setReportTimeframe('weekly')}
//               >
//                 Weekly
//               </button>
//               <button
//                 className={`toggle-btn ${reportTimeframe === 'monthly' ? 'active' : ''}`}
//                 onClick={() => setReportTimeframe('monthly')}
//               >
//                 Monthly
//               </button>
//             </div>
//           </div>

//           <div className="table-container">
//             <table>
//               <thead>
//                 <tr>
//                   <th>Period</th>
//                   <th>Total Submissions</th>
//                   <th>Hours Logged</th>
//                   <th>Mood Distribution</th>
//                   <th>Blockers Logged</th>
//                   <th>Action</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {periodSummaries.map(p => {
//                   const total = p.reportsCount
//                   const greatPct = total > 0 ? Math.round((p.sentimentCounts.GREAT / total) * 100) : 0
//                   const goodPct = total > 0 ? Math.round((p.sentimentCounts.GOOD / total) * 100) : 0
//                   const okPct = total > 0 ? Math.round((p.sentimentCounts.OK / total) * 100) : 0
//                   const stressedPct = total > 0 ? Math.round((p.sentimentCounts.STRESSED / total) * 100) : 0

//                   return (
//                     <tr key={p.key}>
//                       <td style={{ fontWeight: 600 }}>{p.label}</td>
//                       <td>{p.reportsCount} reports</td>
//                       <td style={{ fontWeight: 500 }}>{p.totalHours} hrs</td>
//                       <td style={{ minWidth: '150px' }}>
//                         <div style={{ display: 'flex', gap: '3px', fontSize: '11px', color: '#fff', height: '18px', borderRadius: '4px', overflow: 'hidden' }}>
//                           {greatPct > 0 && <div style={{ backgroundColor: '#a855f7', width: `${greatPct}%`, textAlign: 'center', lineHeight: '18px' }} title={`Great: ${greatPct}%`}>🚀</div>}
//                           {goodPct > 0 && <div style={{ backgroundColor: '#3b82f6', width: `${goodPct}%`, textAlign: 'center', lineHeight: '18px' }} title={`Good: ${goodPct}%`}>👍</div>}
//                           {okPct > 0 && <div style={{ backgroundColor: '#f59e0b', width: `${okPct}%`, textAlign: 'center', lineHeight: '18px' }} title={`Ok: ${okPct}%`}>😐</div>}
//                           {stressedPct > 0 && <div style={{ backgroundColor: '#ef4444', width: `${stressedPct}%`, textAlign: 'center', lineHeight: '18px' }} title={`Stressed: ${stressedPct}%`}>😓</div>}
//                           {total === 0 && <span style={{ color: 'var(--text-muted)' }}>—</span>}
//                         </div>
//                       </td>
//                       <td style={{ color: p.blockerCount > 0 ? 'var(--accent-red)' : 'var(--text-muted)' }}>
//                         {p.blockerCount} blockers
//                       </td>
//                       <td>
//                         <button className="btn btn-secondary btn-sm" onClick={() => setSelectedPeriodDetails(p)}>
//                           View Details
//                         </button>
//                       </td>
//                     </tr>
//                   )
//                 })}
//                 {periodSummaries.length === 0 && (
//                   <tr>
//                     <td colSpan={6} className="empty-state">No summaries available. Submit EOD reports to generate stats.</td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       )}

//       {/* RENDER TAB 3: EMPLOYEE CONTRIBUTION ANALYSIS */}
//       {activeTab === 'contribution' && (
//         <div>
//           <div style={{ marginBottom: '20px' }}>
//             <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Team Performance Matrix</h2>
//             <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
//               Track completed objectives, average working styles, and blocker details per member
//             </p>
//           </div>

//           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
//             {employeeContributions.map(emp => {
//               return (
//                 <div key={emp.id} className="employee-contrib-card">
//                   <div className="card-header-flex">
//                     <div>
//                       <div className="card-header-name">{emp.name}</div>
//                       <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
//                         Avg: {emp.averageHours} hrs/day
//                       </div>
//                     </div>
//                     <span className={`badge ${
//                       emp.productivityScore >= 80 ? 'badge-approved' :
//                       emp.productivityScore >= 60 ? 'badge-pending' : 'badge-inactive'
//                     }`}>
//                       Productivity: {emp.productivityScore}%
//                     </span>
//                   </div>

//                   <div className="stats-badge-grid">
//                     <div className="stats-badge">
//                       <span className="badge-number">{emp.totalHours} hrs</span>
//                       <span className="badge-label">Hours Logged</span>
//                     </div>
//                     <div className="stats-badge">
//                       <span className="badge-number">{emp.reportCount}</span>
//                       <span className="badge-label">EOD Reports</span>
//                     </div>
//                     <div className="stats-badge">
//                       <span className="badge-number" style={{ color: '#22c55e' }}>{emp.completedTasksCount}</span>
//                       <span className="badge-label">Completed Tasks</span>
//                     </div>
//                     <div className="stats-badge">
//                       <span className="badge-number" style={{ color: '#eab308' }}>{emp.inProgressTasksCount}</span>
//                       <span className="badge-label">In-Progress Tasks</span>
//                     </div>
//                   </div>

//                   <div>
//                     <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Sentiment Ratio:</div>
//                     <div style={{ display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#f1f5f9', marginBottom: '14px' }}>
//                       {Object.entries(emp.sentimentCounts).map(([sentiment, count]) => {
//                         const countNum = count as number
//                         if (countNum === 0) return null
//                         const pct = Math.round((countNum / emp.reportCount) * 100)
//                         let color = '#3b82f6' // GOOD (blue)
//                         if (sentiment === 'GREAT') color = '#a855f7' // purple
//                         if (sentiment === 'OK') color = '#f59e0b' // amber
//                         if (sentiment === 'STRESSED') color = '#ef4444' // red
//                         return (
//                           <div
//                             key={sentiment}
//                             style={{ width: `${pct}%`, backgroundColor: color }}
//                             title={`${sentiment}: ${pct}%`}
//                           />
//                         )
//                       })}
//                     </div>
//                   </div>

//                   <div>
//                     <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
//                       <AlertTriangle size={12} style={{ color: emp.blockers.length > 0 ? 'var(--accent-red)' : 'var(--text-muted)' }} />
//                       Blockers Encountered ({emp.blockers.length})
//                     </div>
//                     {emp.blockers.length > 0 ? (
//                       <div className="blockers-scroller">
//                         <ul>
//                           {emp.blockers.map((b: string, idx: number) => (
//                             <li key={idx} style={{ marginBottom: '4px' }}>{b}</li>
//                           ))}
//                         </ul>
//                       </div>
//                     ) : (
//                       <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', fontStyle: 'italic' }}>
//                         No current blockers reported.
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               )
//             })}

//             {employeeContributions.length === 0 && (
//               <div className="dashboard-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
//                 <p style={{ color: 'var(--text-muted)' }}>No employee contributions loaded yet. Submit EOD reports to analyze.</p>
//               </div>
//             )}
//           </div>
//         </div>
//       )}

//       {/* RENDER TAB 4: HOUR & PRODUCTIVITY TRACKING (DASHBOARD CHARTS) */}
//       {activeTab === 'productivity' && (
//         <div>
//           <div className="grid-3">
//             {/* Metric 1 */}
//             <div className="dashboard-card">
//               <div className="dashboard-card-title">
//                 <Clock size={16} /> Total Labor Tracked
//               </div>
//               <div className="metric-highlight">{productivityMetrics.totalHoursLogged} hrs</div>
//               <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
//                 Aggregated workspace hours logged across all reported EOD cycles.
//               </div>
//             </div>

//             {/* Metric 2 */}
//             <div className="dashboard-card">
//               <div className="dashboard-card-title">
//                 <Smile size={16} /> Team Mood Index
//               </div>
//               <div className="metric-highlight">{productivityMetrics.averageProductivity}%</div>
//               <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
//                 Aggregated developer output indicator derived from team sentiments.
//               </div>
//               <div className="progress-bar-container">
//                 <div
//                   className="progress-bar-fill"
//                   style={{
//                     width: `${productivityMetrics.averageProductivity}%`,
//                     backgroundColor: productivityMetrics.averageProductivity >= 75 ? '#22c55e' : productivityMetrics.averageProductivity >= 55 ? '#f59e0b' : '#ef4444'
//                   }}
//                 />
//               </div>
//             </div>

//             {/* Metric 3 */}
//             <div className="dashboard-card">
//               <div className="dashboard-card-title">
//                 <AlertTriangle size={16} /> Blocker Incidence Rate
//               </div>
//               <div className="metric-highlight">{productivityMetrics.blockerRate}%</div>
//               <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
//                 Ratio of submitted worklogs which contain blocker impediments.
//               </div>
//               <div className="progress-bar-container">
//                 <div
//                   className="progress-bar-fill"
//                   style={{
//                     width: `${productivityMetrics.blockerRate}%`,
//                     backgroundColor: '#ef4444'
//                   }}
//                 />
//               </div>
//             </div>
//           </div>

//           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '20px' }}>
//             {/* Chart: Total Hours by Employee */}
//             <div className="dashboard-card">
//               <h3 style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 16px 0', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
//                 Total Hours Tracked by Employee
//               </h3>
//               <div className="chart-list">
//                 {employeeContributions.map(emp => {
//                   const maxHours = Math.max(...employeeContributions.map(e => e.totalHours), 1)
//                   const barWidth = Math.round((emp.totalHours / maxHours) * 100)
//                   return (
//                     <div className="chart-row" key={emp.id}>
//                       <div className="chart-label" title={emp.name}>{emp.name}</div>
//                       <div className="chart-track">
//                         <div className="chart-bar" style={{ width: `${barWidth}%`, backgroundColor: '#4f46e5' }} />
//                       </div>
//                       <div className="chart-value">{emp.totalHours} hrs</div>
//                     </div>
//                   )
//                 })}
//                 {employeeContributions.length === 0 && (
//                   <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>No log details yet.</p>
//                 )}
//               </div>
//             </div>

//             {/* Chart: Sentiment Breakdown */}
//             <div className="dashboard-card">
//               <h3 style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 16px 0', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
//                 Workspace Mood Split (%)
//               </h3>

//               <div className="sentiment-ratio-bar">
//                 {productivityMetrics.sentimentSplits.GREAT > 0 && (
//                   <div className="sentiment-segment" style={{ backgroundColor: '#a855f7', width: `${productivityMetrics.sentimentSplits.GREAT}%` }}>
//                     🚀 {productivityMetrics.sentimentSplits.GREAT}%
//                   </div>
//                 )}
//                 {productivityMetrics.sentimentSplits.GOOD > 0 && (
//                   <div className="sentiment-segment" style={{ backgroundColor: '#3b82f6', width: `${productivityMetrics.sentimentSplits.GOOD}%` }}>
//                     👍 {productivityMetrics.sentimentSplits.GOOD}%
//                   </div>
//                 )}
//                 {productivityMetrics.sentimentSplits.OK > 0 && (
//                   <div className="sentiment-segment" style={{ backgroundColor: '#f59e0b', width: `${productivityMetrics.sentimentSplits.OK}%` }}>
//                     😐 {productivityMetrics.sentimentSplits.OK}%
//                   </div>
//                 )}
//                 {productivityMetrics.sentimentSplits.STRESSED > 0 && (
//                   <div className="sentiment-segment" style={{ backgroundColor: '#ef4444', width: `${productivityMetrics.sentimentSplits.STRESSED}%` }}>
//                     😓 {productivityMetrics.sentimentSplits.STRESSED}%
//                   </div>
//                 )}
//               </div>

//               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '13px' }}>
//                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
//                   <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#a855f7' }} />
//                   <span>Great 🚀 ({productivityMetrics.sentimentSplits.GREAT}%)</span>
//                 </div>
//                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
//                   <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#3b82f6' }} />
//                   <span>Good 👍 ({productivityMetrics.sentimentSplits.GOOD}%)</span>
//                 </div>
//                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
//                   <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#f59e0b' }} />
//                   <span>Just OK 😐 ({productivityMetrics.sentimentSplits.OK}%)</span>
//                 </div>
//                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
//                   <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#ef4444' }} />
//                   <span>Stressed 😓 ({productivityMetrics.sentimentSplits.STRESSED}%)</span>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* POPUP MODAL: Weekly/Monthly Period details */}
//       {selectedPeriodDetails && (
//         <div className="modal-overlay">
//           <div className="modal" style={{ maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto' }}>
//             <div className="modal-header">
//               <h3 className="modal-title">{selectedPeriodDetails.label} Summary Details</h3>
//               <button onClick={() => setSelectedPeriodDetails(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
//                 <X size={20} />
//               </button>
//             </div>

//             <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
//               <div>
//                 <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>Hours Logged per Member</h4>
//                 <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
//                   {Object.entries(selectedPeriodDetails.employeeDetails).map(([id, details]: any) => (
//                     <div key={id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#f8fafc', borderRadius: '4px', fontSize: '13px' }}>
//                       <span style={{ fontWeight: 500 }}>{details.name}</span>
//                       <span style={{ color: 'var(--text-secondary)' }}>{details.hours} hours logged ({details.count} reports)</span>
//                     </div>
//                   ))}
//                 </div>
//               </div>

//               <div>
//                 <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>Blockers Logged in this Period ({selectedPeriodDetails.blockersList.length})</h4>
//                 {selectedPeriodDetails.blockersList.length > 0 ? (
//                   <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
//                     {selectedPeriodDetails.blockersList.map((b: string, index: number) => (
//                       <li key={index}>{b}</li>
//                     ))}
//                   </ul>
//                 ) : (
//                   <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No blockers encountered.</div>
//                 )}
//               </div>
//             </div>

//             <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
//               <button className="btn btn-secondary" onClick={() => setSelectedPeriodDetails(null)}>Close</button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* POPUP MODAL: Submit EOD Report */}
//       {isSubmitModalOpen && (
//         <div className="modal-overlay">
//           <div className="modal">
//             <div className="modal-header">
//               <h3 className="modal-title">Submit EOD Report</h3>
//               <button onClick={() => setIsSubmitModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
//                 <X size={20} />
//               </button>
//             </div>

//             <form onSubmit={handleSubmit}>
//               <div className="grid-2">
//                 <div className="form-group">
//                   <label className="form-label">Employee</label>
//                   {canApprove ? (
//                     <select className="select" required value={formData.employee_id} onChange={e => setFormData({...formData, employee_id: e.target.value})}>
//                       <option value="">Select Employee</option>
//                       {employees.map(e => (
//                         <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
//                       ))}
//                     </select>
//                   ) : (
//                     <input type="text" className="input" disabled value={currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : ''} />
//                   )}
//                 </div>
//                 <div className="form-group">
//                   <label className="form-label">Report Date</label>
//                   <input type="date" className="input" required value={formData.report_date} onChange={e => setFormData({...formData, report_date: e.target.value})} />
//                 </div>
//               </div>

//               <div className="form-group">
//                 <label className="form-label">Tasks Completed (One per line)</label>
//                 <textarea className="textarea" required rows={3} value={formData.tasks_completed} onChange={e => setFormData({...formData, tasks_completed: e.target.value})} placeholder="- Finished homepage UI&#10;- Fixed API bug..." />
//               </div>

//               <div className="form-group">
//                 <label className="form-label">Tasks In Progress (One per line)</label>
//                 <textarea className="textarea" rows={2} value={formData.tasks_in_progress} onChange={e => setFormData({...formData, tasks_in_progress: e.target.value})} placeholder="- Database migration..." />
//               </div>

//               <div className="form-group">
//                 <label className="form-label">Blockers / Issues</label>
//                 <input type="text" className="input" value={formData.blockers} onChange={e => setFormData({...formData, blockers: e.target.value})} />
//               </div>

//               <div className="grid-2">
//                 <div className="form-group">
//                   <label className="form-label">How was your day?</label>
//                   <select className="select" required value={formData.sentiment} onChange={e => setFormData({...formData, sentiment: e.target.value})}>
//                     <option value="GREAT">Great 🚀</option>
//                     <option value="GOOD">Good 👍</option>
//                     <option value="OK">Just OK 😐</option>
//                     <option value="STRESSED">Stressed 😓</option>
//                   </select>
//                 </div>
//                 <div className="form-group">
//                   <label className="form-label">Total Hours Worked</label>
//                   <input type="number" step="0.5" className="input" required value={formData.hours_worked} onChange={e => setFormData({...formData, hours_worked: Number(e.target.value)})} />
//                 </div>
//               </div>

//               <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
//                 <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Submit Report</button>
//                 <button type="button" className="btn btn-secondary" onClick={() => setIsSubmitModalOpen(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}

//       {/* POPUP MODAL: Manager Review */}
//       {isReviewModalOpen && selectedReport && (
//         <div className="modal-overlay">
//           <div className="modal">
//             <div className="modal-header">
//               <h3 className="modal-title">Manager Review</h3>
//               <button onClick={() => setIsReviewModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
//                 <X size={20} />
//               </button>
//             </div>

//             <form onSubmit={handleReviewSubmit}>
//               <div className="form-group">
//                 <label className="form-label">Approval Status</label>
//                 <select className="select" required value={reviewData.approval_status} onChange={e => setReviewData({...reviewData, approval_status: e.target.value})}>
//                   <option value="PENDING">Pending</option>
//                   <option value="APPROVED">Approved</option>
//                   <option value="REJECTED">Rejected</option>
//                 </select>
//               </div>

//               <div className="form-group">
//                 <label className="form-label">Supervisor Remarks</label>
//                 <textarea className="textarea" rows={4} value={reviewData.supervisor_remarks} onChange={e => setReviewData({...reviewData, supervisor_remarks: e.target.value})} placeholder="Add your remarks here..." />
//               </div>

//               <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
//                 <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Save Review</button>
//                 <button type="button" className="btn btn-secondary" onClick={() => setIsReviewModalOpen(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }

// -------

"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  Plus,
  Check,
  FileText,
  XCircle,
  Search,
  X,
  Clock,
  Calendar,
  Users,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Smile,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
export default function WorklogsPage(): import("react").JSX.Element {
  const { currentUser } = useCurrentUser();
  const canApprove = currentUser?.can("approveEOD") ?? false;
  const [reports, setReports] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<
    "daily" | "weekly-monthly" | "contribution" | "productivity"
  >("daily");
  const [reportTimeframe, setReportTimeframe] = useState<"weekly" | "monthly">(
    "weekly",
  );
  // Selected details for a period popup in Weekly/Monthly tab
  const [selectedPeriodDetails, setSelectedPeriodDetails] = useState<
    any | null
  >(null);

  const [formData, setFormData] = useState({
    employee_id: "",
    report_date: new Date().toISOString().split("T")[0],
    tasks_completed: "",
    tasks_in_progress: "",
    blockers: "None",
    sentiment: "GOOD",
    hours_worked: 8,
  });
  const [reviewData, setReviewData] = useState({
    approval_status: "APPROVED",
    supervisor_remarks: "",
  });
  useEffect(() => {
    if (currentUser) fetchData();
  }, [currentUser]);
  const fetchData = async () => {
    if (!currentUser) return;
    setLoading(true);

    // Build query: managers see all EODs, employees see only their own
    let reportQuery = supabase
      .from("eod_reports")
      .select("*, employees(firstName, lastName)")
      .order("report_date", { ascending: false });
    if (!currentUser.can("approveEOD")) {
      reportQuery = reportQuery.eq("employee_id", currentUser.id);
    }
    const [reportRes, empRes] = await Promise.all([
      reportQuery,
      supabase
        .from("employees")
        .select("id, firstName, lastName")
        .eq("status", "ACTIVE"),
    ]);
    if (reportRes.data) setReports(reportRes.data);
    if (empRes.data) setEmployees(empRes.data);
    setLoading(false);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    // 12:00 AM after submit closed
    if (hours === 0 && minutes > 0) {
      alert("Today's EOD submission time has ended.");
      return;
    }
    // Employee ID
    const employeeId = canApprove
      ? formData.employee_id
      : currentUser?.id || formData.employee_id;
    const payload = {
      ...formData,
      employee_id: employeeId,
      approval_status: "PENDING",
      tasks_completed: formData.tasks_completed
        .split("\n")
        .filter((t) => t.trim() !== ""),
      tasks_in_progress: formData.tasks_in_progress
        .split("\n")
        .filter((t) => t.trim() !== ""),
    };
    // Save EOD
    const { error } = await supabase.from("eod_reports").insert([
      {
        id: crypto.randomUUID(),
        ...payload,
      },
    ]);
    if (error) {
      alert(error.message);
      return;
    }
    // Attendance Auto Present
    const today = formData.report_date;
    const { data: attendanceRecord } = await supabase
      .from("attendance")
      .select("id")
      .eq("employee_id", employeeId)
      .eq("date", today)
      .maybeSingle();
    if (attendanceRecord) {
      await supabase
        .from("attendance")
        .update({
          status: "PRESENT",
          check_in: new Date().toISOString(),
          eod_submitted: true,
        })
        .eq("id", attendanceRecord.id);
    } else {
      await supabase.from("attendance").insert({
        employee_id: employeeId,
        date: today,
        status: "PRESENT",
        check_in: new Date().toISOString(),
        eod_submitted: true,
        branch_id: currentUser?.branch_id ?? null,
      });
    }
    alert("EOD Submitted Successfully.");
    setIsSubmitModalOpen(false);
    fetchData();
  };
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;
    const { error } = await supabase
      .from("eod_reports")
      .update({
        approval_status: reviewData.approval_status,
        supervisor_remarks: reviewData.supervisor_remarks,
      })
      .eq("id", selectedReport.id);
    if (error) alert(error.message);
    setIsReviewModalOpen(false);
    fetchData();
  };
  const filtered = reports.filter((r) =>
    ((r.employees?.firstName || "") + " " + (r.employees?.lastName || ""))
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const todayStr = new Date().toISOString().split("T")[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];
  const stats = {
    today: reports.filter((r) => r.report_date === todayStr).length,
    pending: reports.filter((r) => r.approval_status === "PENDING").length,
    todayHours: reports
      .filter((r) => r.report_date === todayStr)
      .reduce((sum, r) => sum + (Number(r.hours_worked) || 0), 0),
    yesterdayHours: reports
      .filter((r) => r.report_date === yesterdayStr)
      .reduce((sum, r) => sum + (Number(r.hours_worked) || 0), 0),
  };
  // --- Date Utility Helpers for Report Period Mapping ---
  const getWeekStart = (dateStr: string) => {
    const d = new Date(dateStr);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust to Monday
    const start = new Date(d.setDate(diff));
    return start.toISOString().split("T")[0];
  };
  const getMonthYear = (dateStr: string) => {
    return dateStr.substring(0, 7); // "YYYY-MM"
  };
  // --- Aggregate: Weekly & Monthly Periods ---
  const getPeriodSummaries = () => {
    const summaries: Record<string, any> = {};
    reports.forEach((report) => {
      const dateStr = report.report_date;
      let periodKey = "";
      let displayLabel = "";

      if (reportTimeframe === "weekly") {
        const weekStart = getWeekStart(dateStr);
        periodKey = weekStart;
        displayLabel = `Week of ${formatDate(weekStart)}`;
      } else {
        const my = getMonthYear(dateStr);
        periodKey = my;
        const [year, month] = my.split("-");
        const monthName = new Date(
          Number(year),
          Number(month) - 1,
          1,
        ).toLocaleString("default", { month: "long" });
        displayLabel = `${monthName} ${year}`;
      }
      if (!summaries[periodKey]) {
        summaries[periodKey] = {
          key: periodKey,
          label: displayLabel,
          reportsCount: 0,
          totalHours: 0,
          sentimentCounts: { GREAT: 0, GOOD: 0, OK: 0, STRESSED: 0 },
          blockerCount: 0,
          blockersList: [] as string[],
          employeeDetails: {} as Record<
            string,
            { name: string; hours: number; count: number }
          >,
        };
      }
      const sum = summaries[periodKey];
      sum.reportsCount += 1;
      sum.totalHours += Number(report.hours_worked) || 0;
      // Sentiment
      const sent = (report.sentiment || "GOOD").toUpperCase();
      if (sum.sentimentCounts[sent] !== undefined) {
        sum.sentimentCounts[sent] += 1;
      } else {
        sum.sentimentCounts["GOOD"] += 1;
      }
      // Blockers
      if (
        report.blockers &&
        report.blockers.toLowerCase() !== "none" &&
        report.blockers.trim() !== ""
      ) {
        sum.blockerCount += 1;
        const empName = report.employees
          ? `${report.employees.firstName} ${report.employees.lastName}`
          : "Unknown";
        sum.blockersList.push(
          `${empName}: ${report.blockers} (${formatDate(dateStr)})`,
        );
      }
      // Employee breakdown
      const empId = report.employee_id;
      const empName = report.employees
        ? `${report.employees.firstName} ${report.employees.lastName}`
        : "Unknown";
      if (!sum.employeeDetails[empId]) {
        sum.employeeDetails[empId] = { name: empName, hours: 0, count: 0 };
      }
      sum.employeeDetails[empId].hours += Number(report.hours_worked) || 0;
      sum.employeeDetails[empId].count += 1;
    });
    return Object.values(summaries).sort((a, b) => b.key.localeCompare(a.key));
  };
  // --- Aggregate: Employee Contribution Analysis ---
  const getEmployeeContributions = () => {
    const contributions: Record<string, any> = {};
    reports.forEach((report) => {
      const empId = report.employee_id;
      const empName = report.employees
        ? `${report.employees.firstName} ${report.employees.lastName}`
        : "Unknown";
      if (!contributions[empId]) {
        contributions[empId] = {
          id: empId,
          name: empName,
          totalHours: 0,
          reportCount: 0,
          completedTasksCount: 0,
          inProgressTasksCount: 0,
          sentimentCounts: { GREAT: 0, GOOD: 0, OK: 0, STRESSED: 0 },
          blockers: [] as string[],
          averageHours: 0,
          productivityScore: 0,
        };
      }
      const c = contributions[empId];
      c.reportCount += 1;
      c.totalHours += Number(report.hours_worked) || 0;
      const completed = Array.isArray(report.tasks_completed)
        ? report.tasks_completed
        : [];
      const inProgress = Array.isArray(report.tasks_in_progress)
        ? report.tasks_in_progress
        : [];
      c.completedTasksCount += completed.length;
      c.inProgressTasksCount += inProgress.length;
      const sent = (report.sentiment || "GOOD").toUpperCase();
      if (c.sentimentCounts[sent] !== undefined) {
        c.sentimentCounts[sent] += 1;
      } else {
        c.sentimentCounts["GOOD"] += 1;
      }
      if (
        report.blockers &&
        report.blockers.toLowerCase() !== "none" &&
        report.blockers.trim() !== ""
      ) {
        c.blockers.push(report.blockers);
      }
    });
    return Object.values(contributions)
      .map((c) => {
        c.averageHours =
          c.reportCount > 0
            ? Number((c.totalHours / c.reportCount).toFixed(1))
            : 0;
        // Weights: GREAT = 100%, GOOD = 85%, OK = 65%, STRESSED = 40%
        let scoreSum = 0;
        let totalSentiments = 0;
        const weights: Record<string, number> = {
          GREAT: 100,
          GOOD: 85,
          OK: 65,
          STRESSED: 40,
        };
        Object.entries(c.sentimentCounts).forEach(([sentiment, count]) => {
          scoreSum += (weights[sentiment] || 85) * (count as number);
          totalSentiments += count as number;
        });
        // Subtract blocker rate penalty (up to 15 points)
        const blockerRate =
          c.reportCount > 0 ? c.blockers.length / c.reportCount : 0;
        const blockerPenalty = Math.min(15, blockerRate * 20);
        c.productivityScore =
          totalSentiments > 0
            ? Math.max(
                10,
                Math.round(scoreSum / totalSentiments - blockerPenalty),
              )
            : 80;
        return c;
      })
      .sort((a, b) => b.totalHours - a.totalHours);
  };
  // --- Aggregate: Productivity & Hours Overview Dashboard ---
  const getProductivityMetrics = () => {
    if (reports.length === 0) {
      return {
        avgHoursPerEod: 0,
        totalHoursLogged: 0,
        totalTasksDone: 0,
        averageProductivity: 0,
        sentimentSplits: { GREAT: 0, GOOD: 0, OK: 0, STRESSED: 0 },
        blockerRate: 0,
      };
    }
    const totalHours = reports.reduce(
      (sum, r) => sum + (Number(r.hours_worked) || 0),
      0,
    );
    const avgHours = totalHours / reports.length;

    let totalTasks = 0;
    let totalBlockers = 0;
    const sentiments = { GREAT: 0, GOOD: 0, OK: 0, STRESSED: 0 };
    reports.forEach((r) => {
      totalTasks += Array.isArray(r.tasks_completed)
        ? r.tasks_completed.length
        : 0;

      if (
        r.blockers &&
        r.blockers.toLowerCase() !== "none" &&
        r.blockers.trim() !== ""
      ) {
        totalBlockers += 1;
      }
      const sent = (r.sentiment || "GOOD").toUpperCase();
      if (sentiments[sent as keyof typeof sentiments] !== undefined) {
        sentiments[sent as keyof typeof sentiments] += 1;
      } else {
        sentiments["GOOD"] += 1;
      }
    });
    const weights: Record<string, number> = {
      GREAT: 100,
      GOOD: 85,
      OK: 65,
      STRESSED: 40,
    };
    let scoreSum = 0;
    Object.entries(sentiments).forEach(([s, count]) => {
      scoreSum += (weights[s] || 85) * count;
    });

    const blockerPercentage = (totalBlockers / reports.length) * 100;
    const averageProductivity = Math.max(
      10,
      Math.round(
        scoreSum / reports.length - (totalBlockers / reports.length) * 15,
      ),
    );
    return {
      avgHoursPerEod: Number(avgHours.toFixed(1)),
      totalHoursLogged: totalHours,
      totalTasksDone: totalTasks,
      averageProductivity,
      sentimentSplits: {
        GREAT: Math.round((sentiments.GREAT / reports.length) * 100),
        GOOD: Math.round((sentiments.GOOD / reports.length) * 100),
        OK: Math.round((sentiments.OK / reports.length) * 100),
        STRESSED: Math.round((sentiments.STRESSED / reports.length) * 100),
      },
      blockerRate: Math.round(blockerPercentage),
    };
  };
  const periodSummaries = getPeriodSummaries();
  const employeeContributions = getEmployeeContributions();
  const productivityMetrics = getProductivityMetrics();
  return (
    <div className="page-content">
      {/* Dynamic Embedded Styles for CSS charts, tabs and custom premium layouts */}
      <style>{`
        .tab-navigation {
          display: flex;
          gap: 4px;
          border-bottom: 1px solid var(--border-color, #e2e8f0);
          margin-bottom: 24px;
          padding-bottom: 2px;
        }
        .tab-navigation button {
          background: none;
          border: none;
          padding: 8px 16px;
          font-size: 14px;
          font-weight: 500;
          color: var(--text-secondary, #64748b);
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .tab-navigation button:hover {
          color: var(--text-primary, #0f172a);
          background-color: var(--bg-hover, #f8fafc);
          border-radius: 4px 4px 0 0;
        }
        .tab-navigation button.active {
          color: var(--primary-color, #6366f1);
          border-bottom-color: var(--primary-color, #6366f1);
          font-weight: 600;
        }
        .grid-3 {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          margin-bottom: 20px;
        }
        // .dashboard-card {
        //   background: var(--card-bg, #ffffff);
        //   border: 1px solid var(--border-color, #e2e8f0);
        //   border-radius: 8px;
        //   padding: 20px;
        //   box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        // }

        .dashboard-card{

    background:linear-gradient(
        180deg,
        #1b2333,
        #171f2d
    );

    border:1px solid rgba(255,255,255,.05);

    border-radius:18px;

    padding:24px;

    transition:.3s;

    box-shadow:var(--shadow);

    overflow:hidden;

    position:relative;

}
    .dashboard-card:hover{

transform:translateY(-5px);

background:#202b40;

border-color:#4f46e5;

box-shadow:

0 20px 50px rgba(99,102,241,.2);

}
        .dashboard-card-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-secondary, #64748b);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .metric-highlight {
          font-size: 32px;
          font-weight: 700;
          color: var(--text-primary, #0f172a);
          margin-bottom: 8px;
        }
        .progress-bar-container {
          background-color: #f1f5f9;
          border-radius: 9999px;
          height: 10px;
          width: 100%;
          overflow: hidden;
          margin-top: 8px;
        }
        .progress-bar-fill {
          height: 100%;
          border-radius: 9999px;
          transition: width 0.4s ease-out;
        }
        .sentiment-ratio-bar {
          display: flex;
          height: 24px;
          border-radius: 6px;
          overflow: hidden;
          margin-bottom: 16px;
        }
        .sentiment-segment {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-size: 10px;
          font-weight: bold;
        }
        .chart-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .chart-row {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 13px;
        }
        .chart-label {
          width: 120px;
          text-overflow: ellipsis;
          overflow: hidden;
          white-space: nowrap;
          font-weight: 500;
        }
        .chart-track {
          flex: 1;
          background-color: #f1f5f9;
          height: 12px;
          border-radius: 6px;
          overflow: hidden;
        }
        .chart-bar {
          height: 100%;
          background-color: var(--primary-color, #6366f1);
          border-radius: 6px;
        }
        .chart-value {
          width: 60px;
          text-align: right;
          font-weight: 600;
          color: var(--text-secondary);
        }
        .employee-contrib-card {
          // border: 1px solid var(--border-color, #e2e8f0);
          // border-radius: 8px;
          // background: #ffffff;
          // padding: 16px;
          // transition: box-shadow 0.2s ease;
            background: linear-gradient(
        145deg,
        #1a2133,
        #141b2d
    );

    border:1px solid rgba(255,255,255,.06);

    border-radius:20px;

    padding:24px;

    box-shadow:
        0 10px 35px rgba(0,0,0,.35);

    transition:.35s ease;

    position:relative;

    overflow:hidden;
        }

        .employee-contrib-card::before{

content:"";

position:absolute;

top:-80px;

right:-80px;

width:180px;

height:180px;

background:rgba(99,102,241,.12);

border-radius:50%;

filter:blur(60px);

}
        .employee-contrib-card:hover {
          // box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          transform:translateY(-8px);

border-color:#6366f1;

box-shadow:

0 18px 45px rgba(99,102,241,.25);
        }
        .card-header-flex {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }
        .card-header-name {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-muted, #0f172a);
        }
        .stats-badge-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          margin-bottom: 16px;
          font-size: 12px;
        }
        .stats-badge {
          background-color: #f8fafc;
          border: 1px solid #f1f5f9;
          padding: 6px;
          border-radius: 4px;
          display: flex;
          flex-direction: column;
        }
        .badge-number {
          font-weight: 600;
          font-size: 14px;
          color: var(--text-muted);
        }
        .badge-label {
          color: var(--text-muted, #94a3b8);
          font-size: 10px;
        }
        .blockers-scroller {
          max-height: 80px;
          overflow-y: auto;
          font-size: 11px;
          border-top: 1px solid #f1f5f9;
          padding-top: 8px;
          margin-top: 8px;
          color: var(--text-secondary);
        }
        .blockers-scroller ul {
          margin: 0;
          padding-left: 14px;
        }
        .toggle-container {
          display: flex;
          background-color: #f1f5f9;
          border-radius: 6px;
          padding: 2px;
          width: fit-content;
        }
        .toggle-btn {
          border: none;
          background: none;
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          border-radius: 4px;
          color: var(--text-secondary);
          transition: all 0.15s ease;
        }
        .toggle-btn.active {
          background-color: #ffffff;
          color: var(--text-muted);
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }
      `}</style>
      {/* Main Header */}
      <div className="section-header">
        <div>
          <h1 className="page-title">EOD Worklogs & Performance</h1>
          <p className="page-subtitle">
            Track daily employee productivity, project blockers, and
            contribution reports
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setFormData({
              employee_id: employees[0]?.id || "",
              report_date: new Date().toISOString().split("T")[0],
              tasks_completed: "",
              tasks_in_progress: "",
              blockers: "None",
              sentiment: "GOOD",
              hours_worked: 8,
            });
            setIsSubmitModalOpen(true);
          }}
        >
          <Plus size={16} /> Submit EOD
        </button>
      </div>
      {/* Tab Controls */}
      <div className="tab-navigation">
        <button
          className={`tab-btn ${activeTab === "daily" ? "active" : ""}`}
          onClick={() => setActiveTab("daily")}
        >
          <FileText size={16} /> Daily Worklogs
        </button>
        <button
          className={`tab-btn ${activeTab === "weekly-monthly" ? "active" : ""}`}
          onClick={() => setActiveTab("weekly-monthly")}
        >
          <Calendar size={16} /> Weekly / Monthly Reports
        </button>
        <button
          className={`tab-btn ${activeTab === "contribution" ? "active" : ""}`}
          onClick={() => setActiveTab("contribution")}
        >
          <Users size={16} /> Employee Contribution
        </button>
        <button
          className={`tab-btn ${activeTab === "productivity" ? "active" : ""}`}
          onClick={() => setActiveTab("productivity")}
        >
          <BarChart3 size={16} /> Hour & Productivity Tracking
        </button>
      </div>
      {/* RENDER TAB 1: DAILY WORKLOGS (EXISTING DESIGN WITH STATS) */}
      {activeTab === "daily" && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon purple">
                <FileText size={22} />
              </div>
              <div>
                <div className="stat-value">{stats.today}</div>
                <div className="stat-label">Reports Today</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon amber">
                <XCircle size={22} />
              </div>
              <div>
                <div className="stat-value">{stats.pending}</div>
                <div className="stat-label">Pending Review</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon blue">
                <Clock size={22} />
              </div>
              <div>
                <div className="stat-value">{stats.todayHours} hrs</div>
                <div className="stat-label">Total Hours Today</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon gray">
                <Clock size={22} />
              </div>
              <div>
                <div className="stat-value">{stats.yesterdayHours} hrs</div>
                <div className="stat-label">Total Hours Yesterday</div>
              </div>
            </div>
          </div>
          <div className="card" style={{ marginBottom: "20px" }}>
            <div className="search-bar" style={{ maxWidth: "400px" }}>
              <Search size={18} />
              <input
                type="text"
                placeholder="Search by employee name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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
                    {filtered.map((report) => (
                      <tr key={report.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>
                            {formatDate(report.report_date)}
                          </div>
                          <div
                            style={{
                              fontSize: "13px",
                              color: "var(--text-secondary)",
                            }}
                          >
                            {report.employees?.firstName}{" "}
                            {report.employees?.lastName}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: "13px", fontWeight: 500 }}>
                            {report.hours_worked} hrs
                          </div>
                          <span
                            className={`badge ${
                              report.sentiment === "GREAT"
                                ? "badge-active"
                                : report.sentiment === "STRESSED"
                                  ? "badge-inactive"
                                  : "badge-pending"
                            }`}
                            style={{ marginTop: 4 }}
                          >
                            Feeling: {report.sentiment}
                          </span>
                        </td>
                        <td style={{ fontSize: "13px", maxWidth: "300px" }}>
                          <ul
                            style={{
                              paddingLeft: "20px",
                              margin: 0,
                              color: "var(--text-secondary)",
                            }}
                          >
                            {(report.tasks_completed || [])
                              .slice(0, 2)
                              .map((t: string, i: number) => (
                                <li key={i}>{t}</li>
                              ))}
                            {(report.tasks_completed || []).length > 2 && (
                              <li>
                                ...and{" "}
                                {(report.tasks_completed || []).length - 2} more
                              </li>
                            )}
                          </ul>
                        </td>
                        <td
                          style={{
                            fontSize: "13px",
                            color:
                              report.blockers === "None"
                                ? "var(--text-muted)"
                                : "var(--accent-red)",
                          }}
                        >
                          {report.blockers}
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              report.approval_status === "APPROVED"
                                ? "badge-approved"
                                : report.approval_status === "REJECTED"
                                  ? "badge-inactive"
                                  : "badge-pending"
                            }`}
                          >
                            {report.approval_status || "PENDING"}
                          </span>
                        </td>
                        <td>
                          {canApprove ? (
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => {
                                setSelectedReport(report);
                                setReviewData({
                                  approval_status:
                                    report.approval_status || "APPROVED",
                                  supervisor_remarks:
                                    report.supervisor_remarks || "",
                                });
                                setIsReviewModalOpen(true);
                              }}
                            >
                              Review
                            </button>
                          ) : (
                            <span
                              style={{
                                fontSize: "12px",
                                color: "var(--text-muted)",
                              }}
                            >
                              {report.supervisor_remarks
                                ? "💬 " +
                                  report.supervisor_remarks.slice(0, 30) +
                                  "..."
                                : "—"}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={6} className="empty-state">
                          No EOD reports found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
      {/* RENDER TAB 2: WEEKLY & MONTHLY REPORTS */}
      {activeTab === "weekly-monthly" && (
        <div className="card" style={{ padding: "24px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: 600, margin: 0 }}>
                Aggregated Performance Periods
              </h2>
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                  margin: "4px 0 0 0",
                }}
              >
                Summary of submissions, work hours, and sentiments grouped by
                time blocks
              </p>
            </div>
            <div className="toggle-container">
              <button
                className={`toggle-btn ${reportTimeframe === "weekly" ? "active" : ""}`}
                onClick={() => setReportTimeframe("weekly")}
              >
                Weekly
              </button>
              <button
                className={`toggle-btn ${reportTimeframe === "monthly" ? "active" : ""}`}
                onClick={() => setReportTimeframe("monthly")}
              >
                Monthly
              </button>
            </div>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Total Submissions</th>
                  <th>Hours Logged</th>
                  <th>Mood Distribution</th>
                  <th>Blockers Logged</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {periodSummaries.map((p) => {
                  const total = p.reportsCount;
                  const greatPct =
                    total > 0
                      ? Math.round((p.sentimentCounts.GREAT / total) * 100)
                      : 0;
                  const goodPct =
                    total > 0
                      ? Math.round((p.sentimentCounts.GOOD / total) * 100)
                      : 0;
                  const okPct =
                    total > 0
                      ? Math.round((p.sentimentCounts.OK / total) * 100)
                      : 0;
                  const stressedPct =
                    total > 0
                      ? Math.round((p.sentimentCounts.STRESSED / total) * 100)
                      : 0;

                  return (
                    <tr key={p.key}>
                      <td style={{ fontWeight: 600 }}>{p.label}</td>
                      <td>{p.reportsCount} reports</td>
                      <td style={{ fontWeight: 500 }}>{p.totalHours} hrs</td>
                      <td style={{ minWidth: "150px" }}>
                        <div
                          style={{
                            display: "flex",
                            gap: "3px",
                            fontSize: "11px",
                            color: "#fff",
                            height: "18px",
                            borderRadius: "4px",
                            overflow: "hidden",
                          }}
                        >
                          {greatPct > 0 && (
                            <div
                              style={{
                                backgroundColor: "#a855f7",
                                width: `${greatPct}%`,
                                textAlign: "center",
                                lineHeight: "18px",
                              }}
                              title={`Great: ${greatPct}%`}
                            >
                              🚀
                            </div>
                          )}
                          {goodPct > 0 && (
                            <div
                              style={{
                                backgroundColor: "#3b82f6",
                                width: `${goodPct}%`,
                                textAlign: "center",
                                lineHeight: "18px",
                              }}
                              title={`Good: ${goodPct}%`}
                            >
                              👍
                            </div>
                          )}
                          {okPct > 0 && (
                            <div
                              style={{
                                backgroundColor: "#f59e0b",
                                width: `${okPct}%`,
                                textAlign: "center",
                                lineHeight: "18px",
                              }}
                              title={`Ok: ${okPct}%`}
                            >
                              😐
                            </div>
                          )}
                          {stressedPct > 0 && (
                            <div
                              style={{
                                backgroundColor: "#ef4444",
                                width: `${stressedPct}%`,
                                textAlign: "center",
                                lineHeight: "18px",
                              }}
                              title={`Stressed: ${stressedPct}%`}
                            >
                              😓
                            </div>
                          )}
                          {total === 0 && (
                            <span style={{ color: "var(--text-muted)" }}>
                              —
                            </span>
                          )}
                        </div>
                      </td>
                      <td
                        style={{
                          color:
                            p.blockerCount > 0
                              ? "var(--accent-red)"
                              : "var(--text-muted)",
                        }}
                      >
                        {p.blockerCount} blockers
                      </td>
                      <td>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setSelectedPeriodDetails(p)}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {periodSummaries.length === 0 && (
                  <tr>
                    <td colSpan={6} className="empty-state">
                      No summaries available. Submit EOD reports to generate
                      stats.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* RENDER TAB 3: EMPLOYEE CONTRIBUTION ANALYSIS */}
      {activeTab === "contribution" && (
        <div>
          <div style={{ marginBottom: "20px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 600, margin: 0 }}>
              Team Performance Matrix
            </h2>
            <p
              style={{
                fontSize: "13px",
                color: "var(--text-secondary)",
                margin: "4px 0 0 0",
              }}
            >
              Track completed objectives, average working styles, and blocker
              details per member
            </p>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: "20px",
            }}
          >
            {employeeContributions.map((emp) => {
              return (
                <div key={emp.id} className="employee-contrib-card">
                  <div className="card-header-flex">
                    <div>
                      <div className="card-header-name">{emp.name}</div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "var(--text-secondary)",
                          marginTop: "2px",
                        }}
                      >
                        Avg: {emp.averageHours} hrs/day
                      </div>
                    </div>
                    <span
                      className={`badge ${
                        emp.productivityScore >= 80
                          ? "badge-approved"
                          : emp.productivityScore >= 60
                            ? "badge-pending"
                            : "badge-inactive"
                      }`}
                    >
                      Productivity: {emp.productivityScore}%
                    </span>
                  </div>
                  <div className="stats-badge-grid">
                    <div className="stats-badge">
                      <span className="badge-number">{emp.totalHours} hrs</span>
                      <span className="badge-label">Hours Logged</span>
                    </div>
                    <div className="stats-badge">
                      <span className="badge-number">{emp.reportCount}</span>
                      <span className="badge-label">EOD Reports</span>
                    </div>
                    <div className="stats-badge">
                      <span
                        className="badge-number"
                        style={{ color: "#22c55e" }}
                      >
                        {emp.completedTasksCount}
                      </span>
                      <span className="badge-label">Completed Tasks</span>
                    </div>
                    <div className="stats-badge">
                      <span
                        className="badge-number"
                        style={{ color: "#eab308" }}
                      >
                        {emp.inProgressTasksCount}
                      </span>
                      <span className="badge-label">In-Progress Tasks</span>
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "var(--text-secondary)",
                        marginBottom: "6px",
                      }}
                    >
                      Sentiment Ratio:
                    </div>
                    <div
                      style={{
                        display: "flex",
                        height: "8px",
                        borderRadius: "4px",
                        overflow: "hidden",
                        backgroundColor: "#f1f5f9",
                        marginBottom: "14px",
                      }}
                    >
                      {Object.entries(emp.sentimentCounts).map(
                        ([sentiment, count]) => {
                          const countNum = count as number;
                          if (countNum === 0) return null;
                          const pct = Math.round(
                            (countNum / emp.reportCount) * 100,
                          );
                          let color = "#3b82f6"; // GOOD (blue)
                          if (sentiment === "GREAT") color = "#a855f7"; // purple
                          if (sentiment === "OK") color = "#f59e0b"; // amber
                          if (sentiment === "STRESSED") color = "#ef4444"; // red
                          return (
                            <div
                              key={sentiment}
                              style={{
                                width: `${pct}%`,
                                backgroundColor: color,
                              }}
                              title={`${sentiment}: ${pct}%`}
                            />
                          );
                        },
                      )}
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "var(--text-secondary)",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <AlertTriangle
                        size={12}
                        style={{
                          color:
                            emp.blockers.length > 0
                              ? "var(--accent-red)"
                              : "var(--text-muted)",
                        }}
                      />
                      Blockers Encountered ({emp.blockers.length})
                    </div>
                    {emp.blockers.length > 0 ? (
                      <div className="blockers-scroller">
                        <ul>
                          {emp.blockers.map((b: string, idx: number) => (
                            <li key={idx} style={{ marginBottom: "4px" }}>
                              {b}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div
                        style={{
                          fontSize: "11px",
                          color: "var(--text-muted)",
                          marginTop: "4px",
                          fontStyle: "italic",
                        }}
                      >
                        No current blockers reported.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {employeeContributions.length === 0 && (
              <div
                className="dashboard-card"
                style={{
                  gridColumn: "1 / -1",
                  textAlign: "center",
                  padding: "40px",
                }}
              >
                <p style={{ color: "var(--text-muted)" }}>
                  No employee contributions loaded yet. Submit EOD reports to
                  analyze.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
      {/* RENDER TAB 4: HOUR & PRODUCTIVITY TRACKING (DASHBOARD CHARTS) */}
      {activeTab === "productivity" && (
        <div>
          <div className="grid-3">
            {/* Metric 1 */}
            <div className="dashboard-card">
              <div className="dashboard-card-title">
                <Clock size={16} /> Total Labor Tracked
              </div>
              <div
                className="metric-highlight"
                style={{ color: "--surface-2" }}
              >
                {productivityMetrics.totalHoursLogged} hrs
              </div>
              <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                Aggregated workspace hours logged across all reported EOD
                cycles.
              </div>
            </div>
            {/* Metric 2 */}
            <div className="dashboard-card">
              <div className="dashboard-card-title">
                <Smile size={16} /> Team Mood Index
              </div>
              <div
                className="metric-highlight"
                style={{ color: "--surface-2" }}
              >
                {productivityMetrics.averageProductivity}%
              </div>
              <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                Aggregated developer output indicator derived from team
                sentiments.
              </div>
              <div className="progress-bar-container">
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${productivityMetrics.averageProductivity}%`,
                    color: "--surface-2",
                    backgroundColor:
                      productivityMetrics.averageProductivity >= 75
                        ? "#22c55e"
                        : productivityMetrics.averageProductivity >= 55
                          ? "#f59e0b"
                          : "#ef4444",
                  }}
                />
              </div>
            </div>
            {/* Metric 3 */}
            <div className="dashboard-card">
              <div className="dashboard-card-title">
                <AlertTriangle size={16} /> Blocker Incidence Rate
              </div>
              <div
                className="metric-highlight"
                style={{ color: "--surface-2" }}
              >
                {productivityMetrics.blockerRate}%
              </div>
              <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                Ratio of submitted worklogs which contain blocker impediments.
              </div>
              <div className="progress-bar-container">
                <div
                  className="progress-bar-fill"
                  style={{
                    color: "--surface-2",
                    width: `${productivityMetrics.blockerRate}%`,
                    backgroundColor: "#ef4444",
                  }}
                />
              </div>
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))",
              gap: "20px",
            }}
          >
            {/* Chart: Total Hours by Employee */}
            <div className="dashboard-card">
              <h3
                style={{
                  fontSize: "15px",
                  fontWeight: 600,
                  margin: "0 0 16px 0",
                  borderBottom: "1px solid #f1f5f9",
                  paddingBottom: "8px",
                  color: "--text-muted",
                }}
              >
                Total Hours Tracked by Employee
              </h3>
              <div className="chart-list">
                {employeeContributions.map((emp) => {
                  const maxHours = Math.max(
                    ...employeeContributions.map((e) => e.totalHours),
                    1,
                  );
                  const barWidth = Math.round(
                    (emp.totalHours / maxHours) * 100,
                  );
                  return (
                    <div className="chart-row" key={emp.id}>
                      <div className="chart-label" title={emp.name}>
                        {emp.name}
                      </div>
                      <div className="chart-track">
                        <div
                          className="chart-bar"
                          style={{
                            width: `${barWidth}%`,
                            backgroundColor: "#4f46e5",
                          }}
                        />
                      </div>
                      <div className="chart-value">{emp.totalHours} hrs</div>
                    </div>
                  );
                })}
                {employeeContributions.length === 0 && (
                  <p
                    style={{
                      fontSize: "13px",
                      color: "var(--text-muted)",
                      textAlign: "center",
                    }}
                  >
                    No log details yet.
                  </p>
                )}
              </div>
            </div>
            {/* Chart: Sentiment Breakdown */}
            <div className="dashboard-card">
              <h3
                style={{
                  fontSize: "15px",
                  fontWeight: 600,
                  margin: "0 0 16px 0",
                  borderBottom: "1px solid #f1f5f9",
                  paddingBottom: "8px",
                }}
              >
                Workspace Mood Split (%)
              </h3>

              <div className="sentiment-ratio-bar">
                {productivityMetrics.sentimentSplits.GREAT > 0 && (
                  <div
                    className="sentiment-segment"
                    style={{
                      backgroundColor: "#a855f7",
                      width: `${productivityMetrics.sentimentSplits.GREAT}%`,
                    }}
                  >
                    🚀 {productivityMetrics.sentimentSplits.GREAT}%
                  </div>
                )}
                {productivityMetrics.sentimentSplits.GOOD > 0 && (
                  <div
                    className="sentiment-segment"
                    style={{
                      backgroundColor: "#4f46e5",
                      width: `${productivityMetrics.sentimentSplits.GOOD}%`,
                    }}
                  >
                    👍 {productivityMetrics.sentimentSplits.GOOD}%
                  </div>
                )}
                {productivityMetrics.sentimentSplits.OK > 0 && (
                  <div
                    className="sentiment-segment"
                    style={{
                      backgroundColor: "#f59e0b",
                      width: `${productivityMetrics.sentimentSplits.OK}%`,
                    }}
                  >
                    😐 {productivityMetrics.sentimentSplits.OK}%
                  </div>
                )}
                {productivityMetrics.sentimentSplits.STRESSED > 0 && (
                  <div
                    className="sentiment-segment"
                    style={{
                      backgroundColor: "#ef4444",
                      width: `${productivityMetrics.sentimentSplits.STRESSED}%`,
                    }}
                  >
                    😓 {productivityMetrics.sentimentSplits.STRESSED}%
                  </div>
                )}
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "10px",
                  fontSize: "13px",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <div
                    style={{
                      width: "12px",
                      height: "12px",
                      borderRadius: "3px",
                      backgroundColor: "#a855f7",
                    }}
                  />
                  <span>
                    Great 🚀 ({productivityMetrics.sentimentSplits.GREAT}%)
                  </span>
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <div
                    style={{
                      width: "12px",
                      height: "12px",
                      borderRadius: "3px",
                      backgroundColor: "#4f46e5",
                    }}
                  />
                  <span>
                    Good 👍 ({productivityMetrics.sentimentSplits.GOOD}%)
                  </span>
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <div
                    style={{
                      width: "12px",
                      height: "12px",
                      borderRadius: "3px",
                      backgroundColor: "#f59e0b",
                    }}
                  />
                  <span>
                    Just OK 😐 ({productivityMetrics.sentimentSplits.OK}%)
                  </span>
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <div
                    style={{
                      width: "12px",
                      height: "12px",
                      borderRadius: "3px",
                      backgroundColor: "#ef4444",
                    }}
                  />
                  <span>
                    Stressed 😓 ({productivityMetrics.sentimentSplits.STRESSED}
                    %)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* POPUP MODAL: Weekly/Monthly Period details */}
      {selectedPeriodDetails && (
        <div className="modal-overlay">
          <div
            className="modal"
            style={{ maxWidth: "650px", maxHeight: "90vh", overflowY: "auto" }}
          >
            <div className="modal-header">
              <h3 className="modal-title">
                {selectedPeriodDetails.label} Summary Details
              </h3>
              <button
                onClick={() => setSelectedPeriodDetails(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                marginTop: "16px",
              }}
            >
              <div>
                <h4
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                    textTransform: "uppercase",
                    marginBottom: "8px",
                  }}
                >
                  Hours Logged per Member
                </h4>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  {Object.entries(selectedPeriodDetails.employeeDetails).map(
                    ([id, details]: any) => (
                      <div
                        key={id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          padding: "8px 12px",
                          backgroundColor: "#f8fafc",
                          borderRadius: "4px",
                          fontSize: "13px",
                          color:"var(--text-muted)"
                        }}
                      >
                        <span style={{ fontWeight: 500 }}>{details.name}</span>
                        <span style={{ color: "var(--text-secondary)" }}>
                          {details.hours} hours logged ({details.count} reports)
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>
              <div>
                <h4
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                    textTransform: "uppercase",
                    marginBottom: "8px",
                  }}
                >
                  Blockers Logged in this Period (
                  {selectedPeriodDetails.blockersList.length})
                </h4>
                {selectedPeriodDetails.blockersList.length > 0 ? (
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: "20px",
                      fontSize: "13px",
                      color: "var(--text-secondary)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    {selectedPeriodDetails.blockersList.map(
                      (b: string, index: number) => (
                        <li key={index}>{b}</li>
                      ),
                    )}
                  </ul>
                ) : (
                  <div
                    style={{
                      fontSize: "13px",
                      color: "var(--text-muted)",
                      fontStyle: "italic",
                    }}
                  >
                    No blockers encountered.
                  </div>
                )}
              </div>
            </div>

            <div
              style={{
                marginTop: "24px",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <button
                className="btn btn-secondary"
                onClick={() => setSelectedPeriodDetails(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* POPUP MODAL: Submit EOD Report */}
      {isSubmitModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Submit EOD Report</h3>
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Employee</label>
                  {canApprove ? (
                    <select
                      className="select"
                      required
                      value={formData.employee_id}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          employee_id: e.target.value,
                        })
                      }
                    >
                      <option value="">Select Employee</option>
                      {employees.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.firstName} {e.lastName}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      className="input"
                      disabled
                      value={
                        currentUser
                          ? `${currentUser.firstName} ${currentUser.lastName}`
                          : ""
                      }
                    />
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Report Date</label>
                  <input
                    type="date"
                    className="input"
                    required
                    value={formData.report_date}
                    onChange={(e) =>
                      setFormData({ ...formData, report_date: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">
                  Tasks Completed (One per line)
                </label>
                <textarea
                  className="textarea"
                  required
                  rows={3}
                  value={formData.tasks_completed}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tasks_completed: e.target.value,
                    })
                  }
                  placeholder="- Finished homepage UI&#10;- Fixed API bug..."
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  Tasks In Progress (One per line)
                </label>
                <textarea
                  className="textarea"
                  rows={2}
                  value={formData.tasks_in_progress}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tasks_in_progress: e.target.value,
                    })
                  }
                  placeholder="- Database migration..."
                />
              </div>
              <div className="form-group">
                <label className="form-label">Blockers / Issues</label>
                <input
                  type="text"
                  className="input"
                  value={formData.blockers}
                  onChange={(e) =>
                    setFormData({ ...formData, blockers: e.target.value })
                  }
                />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">How was your day?</label>
                  <select
                    className="select"
                    required
                    value={formData.sentiment}
                    onChange={(e) =>
                      setFormData({ ...formData, sentiment: e.target.value })
                    }
                  >
                    <option value="GREAT">Great 🚀</option>
                    <option value="GOOD">Good 👍</option>
                    <option value="OK">Just OK 😐</option>
                    <option value="STRESSED">Stressed 😓</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Total Hours Worked</label>
                  <input
                    type="number"
                    step="0.5"
                    className="input"
                    required
                    value={formData.hours_worked}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        hours_worked: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1, justifyContent: "center" }}
                >
                  Submit Report
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsSubmitModalOpen(false)}
                  style={{ flex: 1, justifyContent: "center" }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* POPUP MODAL: Manager Review */}
      {isReviewModalOpen && selectedReport && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Manager Review</h3>
              <button
                onClick={() => setIsReviewModalOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleReviewSubmit}>
              <div className="form-group">
                <label className="form-label">Approval Status</label>
                <select
                  className="select"
                  required
                  value={reviewData.approval_status}
                  onChange={(e) =>
                    setReviewData({
                      ...reviewData,
                      approval_status: e.target.value,
                    })
                  }
                >
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Supervisor Remarks</label>
                <textarea
                  className="textarea"
                  rows={4}
                  value={reviewData.supervisor_remarks}
                  onChange={(e) =>
                    setReviewData({
                      ...reviewData,
                      supervisor_remarks: e.target.value,
                    })
                  }
                  placeholder="Add your remarks here..."
                />
              </div>
              <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1, justifyContent: "center" }}
                >
                  Save Review
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsReviewModalOpen(false)}
                  style={{ flex: 1, justifyContent: "center" }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --updated codee
// 'use client'
// import { useEffect, useState } from 'react'
// import { supabase } from '@/lib/supabase'
// import { useCurrentUser } from '@/hooks/useCurrentUser'
// import {
//   Plus, Check, FileText, XCircle, Search, X, Clock,
//   Calendar, Users, BarChart3, TrendingUp, AlertTriangle, Smile
// } from 'lucide-react'
// import { formatDate } from '@/lib/utils'
// export default function WorklogsPage(): import("react").JSX.Element {
//   const { currentUser } = useCurrentUser()
//   const canApprove = currentUser?.can('approveEOD') ?? false
//   const [reports, setReports] = useState<any[]>([])
//   const [employees, setEmployees] = useState<any[]>([])
//   const [loading, setLoading] = useState(true)
//   const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false)
//   const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
//   const [selectedReport, setSelectedReport] = useState<any>(null)
//   const [search, setSearch] = useState('')
//   const [activeTab, setActiveTab] = useState<'daily' | 'weekly-monthly' | 'contribution' | 'productivity'>('daily')
//   const [reportTimeframe, setReportTimeframe] = useState<'weekly' | 'monthly'>('weekly')
//   // Selected details for a period popup in Weekly/Monthly tab
//   const [selectedPeriodDetails, setSelectedPeriodDetails] = useState<any | null>(null)

//   const [formData, setFormData] = useState({
//     employee_id: '', report_date: new Date().toISOString().split('T')[0],
//     tasks_completed: '', tasks_in_progress: '', blockers: 'None',
//     sentiment: 'GOOD', hours_worked: 8
//   })
//   const [reviewData, setReviewData] = useState({
//     approval_status: 'APPROVED', supervisor_remarks: ''
//   })
//   useEffect(() => {
//     if (currentUser) fetchData()
//   }, [currentUser])
//   const fetchData = async () => {
//     if (!currentUser) return
//     setLoading(true)

//     // Build query: managers see all EODs, employees see only their own
//     let reportQuery = supabase.from('eod_reports').select('*, employees(firstName, lastName)').order('report_date', { ascending: false })
//     if (!currentUser.can('approveEOD')) {
//       reportQuery = reportQuery.eq('employee_id', currentUser.id)
//     }
//     const [reportRes, empRes] = await Promise.all([
//       reportQuery,
//       supabase.from('employees').select('id, firstName, lastName').eq('status', 'ACTIVE')
//     ])
//     if (reportRes.data) setReports(reportRes.data)
//     if (empRes.data) setEmployees(empRes.data)
//     setLoading(false)
//   }
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     const now = new Date()
//     const hours = now.getHours()
//     const minutes = now.getMinutes()
//     // 12:00 AM after submit closed
//     if (hours === 0 && minutes > 0) {
//       alert("Today's EOD submission time has ended.")
//       return
//     }
//     // Employee ID
//     const employeeId =
//       canApprove
//         ? formData.employee_id
//         : currentUser?.id || formData.employee_id
//     const payload = {
//       ...formData,
//       employee_id: employeeId,
//       approval_status: 'PENDING',
//       tasks_completed: formData.tasks_completed
//         .split('\n')
//         .filter((t) => t.trim() !== ''),
//       tasks_in_progress: formData.tasks_in_progress
//         .split('\n')
//         .filter((t) => t.trim() !== ''),
//     }
//     // Save EOD
//     const { error } = await supabase
//       .from('eod_reports')
//       .insert([
//         {
//           id: crypto.randomUUID(),
//           ...payload,
//         },
//       ])
//     if (error) {
//       alert(error.message)
//       return
//     }
//     // Attendance Auto Present
//     const today = formData.report_date
//     const { data: attendanceRecord } = await supabase
//       .from('attendance')
//       .select('id')
//       .eq('employee_id', employeeId)
//       .eq('date', today)
//       .maybeSingle()
//     if (attendanceRecord) {
//       await supabase
//         .from('attendance')
//         .update({
//           status: 'PRESENT',
//           check_in: new Date().toISOString(),
//           eod_submitted: true,
//         })
//         .eq('id', attendanceRecord.id)
//     } else {
//       await supabase
//         .from('attendance')
//         .insert({
//           employee_id: employeeId,
//           date: today,
//           status: 'PRESENT',
//           check_in: new Date().toISOString(),
//           eod_submitted: true,
//           branch_id: currentUser?.branch_id ?? null,
//         })
//     }
//     alert('EOD Submitted Successfully.')
//     setIsSubmitModalOpen(false)
//     fetchData()
//   }
//   const handleReviewSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     if (!selectedReport) return
//     const { error } = await supabase.from('eod_reports').update({
//       approval_status: reviewData.approval_status,
//       supervisor_remarks: reviewData.supervisor_remarks
//     }).eq('id', selectedReport.id)
//     if (error) alert(error.message)
//     setIsReviewModalOpen(false)
//     fetchData()
//   }
//   const filtered = reports.filter(r =>
//     ((r.employees?.firstName || '') + ' ' + (r.employees?.lastName || '')).toLowerCase().includes(search.toLowerCase())
//   )
//   const todayStr = new Date().toISOString().split('T')[0];
//   const yesterday = new Date();
//   yesterday.setDate(yesterday.getDate() - 1);
//   const yesterdayStr = yesterday.toISOString().split('T')[0];
//   const stats = {
//     today: reports.filter(r => r.report_date === todayStr).length,
//     pending: reports.filter(r => r.approval_status === 'PENDING').length,
//     todayHours: reports.filter(r => r.report_date === todayStr).reduce((sum, r) => sum + (Number(r.hours_worked) || 0), 0),
//     yesterdayHours: reports.filter(r => r.report_date === yesterdayStr).reduce((sum, r) => sum + (Number(r.hours_worked) || 0), 0)
//   }
//   // --- Date Utility Helpers for Report Period Mapping ---
//   const getWeekStart = (dateStr: string) => {
//     const d = new Date(dateStr)
//     const day = d.getDay()
//     const diff = d.getDate() - day + (day === 0 ? -6 : 1) // adjust to Monday
//     const start = new Date(d.setDate(diff))
//     return start.toISOString().split('T')[0]
//   }
//   const getMonthYear = (dateStr: string) => {
//     return dateStr.substring(0, 7) // "YYYY-MM"
//   }
//   // --- Aggregate: Weekly & Monthly Periods ---
//   const getPeriodSummaries = () => {
//     const summaries: Record<string, any> = {}
//     reports.forEach(report => {
//       const dateStr = report.report_date
//       let periodKey = ''
//       let displayLabel = ''

//       if (reportTimeframe === 'weekly') {
//         const weekStart = getWeekStart(dateStr)
//         periodKey = weekStart
//         displayLabel = `Week of ${formatDate(weekStart)}`
//       } else {
//         const my = getMonthYear(dateStr)
//         periodKey = my
//         const [year, month] = my.split('-')
//         const monthName = new Date(Number(year), Number(month) - 1, 1).toLocaleString('default', { month: 'long' })
//         displayLabel = `${monthName} ${year}`
//       }
//       if (!summaries[periodKey]) {
//         summaries[periodKey] = {
//           key: periodKey,
//           label: displayLabel,
//           reportsCount: 0,
//           totalHours: 0,
//           sentimentCounts: { GREAT: 0, GOOD: 0, OK: 0, STRESSED: 0 },
//           blockerCount: 0,
//           blockersList: [] as string[],
//           employeeDetails: {} as Record<string, { name: string; hours: number; count: number }>
//         }
//       }
//       const sum = summaries[periodKey]
//       sum.reportsCount += 1
//       sum.totalHours += Number(report.hours_worked) || 0
//       // Sentiment
//       const sent = (report.sentiment || 'GOOD').toUpperCase()
//       if (sum.sentimentCounts[sent] !== undefined) {
//         sum.sentimentCounts[sent] += 1
//       } else {
//         sum.sentimentCounts['GOOD'] += 1
//       }
//       // Blockers
//       if (report.blockers && report.blockers.toLowerCase() !== 'none' && report.blockers.trim() !== '') {
//         sum.blockerCount += 1
//         const empName = report.employees ? `${report.employees.firstName} ${report.employees.lastName}` : 'Unknown'
//         sum.blockersList.push(`${empName}: ${report.blockers} (${formatDate(dateStr)})`)
//       }
//       // Employee breakdown
//       const empId = report.employee_id
//       const empName = report.employees ? `${report.employees.firstName} ${report.employees.lastName}` : 'Unknown'
//       if (!sum.employeeDetails[empId]) {
//         sum.employeeDetails[empId] = { name: empName, hours: 0, count: 0 }
//       }
//       sum.employeeDetails[empId].hours += Number(report.hours_worked) || 0
//       sum.employeeDetails[empId].count += 1
//     })
//     return Object.values(summaries).sort((a, b) => b.key.localeCompare(a.key))
//   }
//   // --- Aggregate: Employee Contribution Analysis ---
//   const getEmployeeContributions = () => {
//     const contributions: Record<string, any> = {}
//     reports.forEach(report => {
//       const empId = report.employee_id
//       const empName = report.employees ? `${report.employees.firstName} ${report.employees.lastName}` : 'Unknown'
//       if (!contributions[empId]) {
//         contributions[empId] = {
//           id: empId,
//           name: empName,
//           totalHours: 0,
//           reportCount: 0,
//           completedTasksCount: 0,
//           inProgressTasksCount: 0,
//           sentimentCounts: { GREAT: 0, GOOD: 0, OK: 0, STRESSED: 0 },
//           blockers: [] as string[],
//           averageHours: 0,
//           productivityScore: 0
//         }
//       }
//       const c = contributions[empId]
//       c.reportCount += 1
//       c.totalHours += Number(report.hours_worked) || 0
//       const completed = Array.isArray(report.tasks_completed) ? report.tasks_completed : []
//       const inProgress = Array.isArray(report.tasks_in_progress) ? report.tasks_in_progress : []
//       c.completedTasksCount += completed.length
//       c.inProgressTasksCount += inProgress.length
//       const sent = (report.sentiment || 'GOOD').toUpperCase()
//       if (c.sentimentCounts[sent] !== undefined) {
//         c.sentimentCounts[sent] += 1
//       } else {
//         c.sentimentCounts['GOOD'] += 1
//       }
//       if (report.blockers && report.blockers.toLowerCase() !== 'none' && report.blockers.trim() !== '') {
//         c.blockers.push(report.blockers)
//       }
//     })
//     return Object.values(contributions).map(c => {
//       c.averageHours = c.reportCount > 0 ? Number((c.totalHours / c.reportCount).toFixed(1)) : 0
//       // Weights: GREAT = 100%, GOOD = 85%, OK = 65%, STRESSED = 40%
//       let scoreSum = 0
//       let totalSentiments = 0
//       const weights: Record<string, number> = { GREAT: 100, GOOD: 85, OK: 65, STRESSED: 40 }
//       Object.entries(c.sentimentCounts).forEach(([sentiment, count]) => {
//         scoreSum += (weights[sentiment] || 85) * (count as number)
//         totalSentiments += (count as number)
//       })
//       // Subtract blocker rate penalty (up to 15 points)
//       const blockerRate = c.reportCount > 0 ? c.blockers.length / c.reportCount : 0
//       const blockerPenalty = Math.min(15, blockerRate * 20)
//       c.productivityScore = totalSentiments > 0
//         ? Math.max(10, Math.round((scoreSum / totalSentiments) - blockerPenalty))
//         : 80
//       return c
//     }).sort((a, b) => b.totalHours - a.totalHours)
//   }
//   // --- Aggregate: Productivity & Hours Overview Dashboard ---
//   const getProductivityMetrics = () => {
//     if (reports.length === 0) {
//       return {
//         avgHoursPerEod: 0,
//         totalHoursLogged: 0,
//         totalTasksDone: 0,
//         averageProductivity: 0,
//         sentimentSplits: { GREAT: 0, GOOD: 0, OK: 0, STRESSED: 0 },
//         blockerRate: 0
//       }
//     }
//     const totalHours = reports.reduce((sum, r) => sum + (Number(r.hours_worked) || 0), 0)
//     const avgHours = totalHours / reports.length

//     let totalTasks = 0
//     let totalBlockers = 0
//     const sentiments = { GREAT: 0, GOOD: 0, OK: 0, STRESSED: 0 }
//     reports.forEach(r => {
//       totalTasks += Array.isArray(r.tasks_completed) ? r.tasks_completed.length : 0

//       if (r.blockers && r.blockers.toLowerCase() !== 'none' && r.blockers.trim() !== '') {
//         totalBlockers += 1
//       }
//       const sent = (r.sentiment || 'GOOD').toUpperCase()
//       if (sentiments[sent as keyof typeof sentiments] !== undefined) {
//         sentiments[sent as keyof typeof sentiments] += 1
//       } else {
//         sentiments['GOOD'] += 1
//       }
//     })
//     const weights: Record<string, number> = { GREAT: 100, GOOD: 85, OK: 65, STRESSED: 40 }
//     let scoreSum = 0
//     Object.entries(sentiments).forEach(([s, count]) => {
//       scoreSum += (weights[s] || 85) * count
//     })

//     const blockerPercentage = (totalBlockers / reports.length) * 100
//     const averageProductivity = Math.max(10, Math.round((scoreSum / reports.length) - (totalBlockers / reports.length * 15)))
//     return {
//       avgHoursPerEod: Number(avgHours.toFixed(1)),
//       totalHoursLogged: totalHours,
//       totalTasksDone: totalTasks,
//       averageProductivity,
//       sentimentSplits: {
//         GREAT: Math.round((sentiments.GREAT / reports.length) * 100),
//         GOOD: Math.round((sentiments.GOOD / reports.length) * 100),
//         OK: Math.round((sentiments.OK / reports.length) * 100),
//         STRESSED: Math.round((sentiments.STRESSED / reports.length) * 100)
//       },
//       blockerRate: Math.round(blockerPercentage)
//     }
//   }
//   const periodSummaries = getPeriodSummaries()
//   const employeeContributions = getEmployeeContributions()
//   const productivityMetrics = getProductivityMetrics()
//   // Theme Constants (Glow Dark Styling matching mockup)
//   const colors = {
//     cardBg: '#131526', // Deep layout dark matching ChatGPT mockup
//     cardBorder: '#232c3f',
//     statIconPurpleBg: 'rgba(168, 85, 247, 0.15)',
//     statIconAmberBg: 'rgba(245, 158, 11, 0.15)',
//     statIconBlueBg: 'rgba(59, 130, 246, 0.15)',
//     statIconGrayBg: 'rgba(148, 163, 184, 0.15)'
//   }
//   // Sentiment splits logic for legend
//   const sentimentStats = {
//     GREAT: { count: reports.filter(r => (r.sentiment || '').toUpperCase() === 'GREAT').length, pct: reports.length > 0 ? Math.round((reports.filter(r => (r.sentiment || '').toUpperCase() === 'GREAT').length / reports.length) * 100) : 0 },
//     GOOD: { count: reports.filter(r => (r.sentiment || '').toUpperCase() === 'GOOD').length, pct: reports.length > 0 ? Math.round((reports.filter(r => (r.sentiment || '').toUpperCase() === 'GOOD').length / reports.length) * 100) : 0 },
//     OK: { count: reports.filter(r => (r.sentiment || '').toUpperCase() === 'OK').length, pct: reports.length > 0 ? Math.round((reports.filter(r => (r.sentiment || '').toUpperCase() === 'OK').length / reports.length) * 100) : 0 },
//     STRESSED: { count: reports.filter(r => (r.sentiment || '').toUpperCase() === 'STRESSED').length, pct: reports.length > 0 ? Math.round((reports.filter(r => (r.sentiment || '').toUpperCase() === 'STRESSED').length / reports.length) * 100) : 0 }
//   }
//   const sentimentLegendData = [
//     { label: 'Great 🚀', color: '#a855f7', ...sentimentStats.GREAT },
//     { label: 'Good 👍', color: '#3b82f6', ...sentimentStats.GOOD },
//     { label: 'Just OK 😐', color: '#fbbf24', ...sentimentStats.OK },
//     { label: 'Stressed 😓', color: '#ef4444', ...sentimentStats.STRESSED }
//   ]
//   // Conic gradient string generator for the CSS donut chart
//   const getDonutGradient = () => {
//     if (reports.length === 0) {
//       return 'conic-gradient(#1e293b 0deg 360deg)'
//     }
//     const greatAngle = (sentimentStats.GREAT.pct / 100) * 360
//     const goodAngle = (sentimentStats.GOOD.pct / 100) * 360
//     const okAngle = (sentimentStats.OK.pct / 100) * 360
//     const stressedAngle = (sentimentStats.STRESSED.pct / 100) * 360
//     const segments = [
//       { color: '#a855f7', angle: greatAngle },
//       { color: '#3b82f6', angle: goodAngle },
//       { color: '#fbbf24', angle: okAngle },
//       { color: '#ef4444', angle: stressedAngle }
//     ].filter(s => s.angle > 0)
//     let accum = 0
//     const parts = segments.map(s => {
//       const start = accum
//       accum += s.angle
//       return `${s.color} ${start}deg ${accum}deg`
//     })
//     return `conic-gradient(${parts.join(', ')})`
//   }
//   // Dynamic Style objects for Tab Buttons (Enhanced Design)
//   const getTabButtonStyle = (isActive: boolean) => {
//     return {
//       background: 'none',
//       border: 'none',
//       padding: '12px 20px',
//       fontSize: '14px',
//       fontWeight: isActive ? '600' : '500',
//       color: isActive ? '#38bdf8' : '#94a3b8',
//       cursor: 'pointer',
//       borderBottom: isActive ? '3px solid #38bdf8' : '3px solid transparent',
//       transition: 'all 0.2s ease',
//       display: 'flex',
//       alignItems: 'center',
//       gap: '8px'
//     }
//   }
//   const getToggleButtonStyle = (isActive: boolean) => {
//     return {
//       border: 'none',
//       background: isActive ? '#38bdf8' : 'none',
//       padding: '6px 14px',
//       fontSize: '12px',
//       fontWeight: '600',
//       cursor: 'pointer',
//       borderRadius: '6px',
//       color: isActive ? '#0f172a' : '#94a3b8',
//       boxShadow: isActive ? '0 1px 3px rgba(0, 0, 0, 0.2)' : 'none',
//       transition: 'all 0.15s ease'
//     }
//   }
//   const getBadgeStyle = (sentiment: string) => {
//     const s = sentiment.toUpperCase()
//     if (s === 'GREAT') {
//       return { backgroundColor: 'rgba(168, 85, 247, 0.15)', color: '#d8b4fe', border: '1px solid rgba(168, 85, 247, 0.3)', padding: '4px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: '600', display: 'inline-flex', alignItems: 'center' }
//     } else if (s === 'GOOD' || s === 'APPROVED') {
//       return { backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#86efac', border: '1px solid rgba(34, 197, 94, 0.3)', padding: '4px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: '600', display: 'inline-flex', alignItems: 'center' }
//     } else if (s === 'STRESSED' || s === 'REJECTED') {
//       return { backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '4px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: '600', display: 'inline-flex', alignItems: 'center' }
//     } else {
//       return { backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#fde047', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '4px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: '600', display: 'inline-flex', alignItems: 'center' }
//     }
//   }
//   const cardStyle = {
//     background: colors.cardBg,
//     border: `1px solid ${colors.cardBorder}`,
//     borderRadius: '12px',
//     padding: '24px',
//     boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
//     color: '#ffffff'
//   }
//   const inputStyle = {
//     backgroundColor: '#0d111a',
//     border: `1px solid ${colors.cardBorder}`,
//     borderRadius: '8px',
//     padding: '10px 14px',
//     color: '#ffffff',
//     width: '100%',
//     outline: 'none',
//     fontSize: '14px',
//     marginTop: '6px',
//     transition: 'border-color 0.15s ease'
//   }
//   return (
//     <div className="page-content" style={{ color: '#f8fafc' }}>
//       {/* Main Header */}
//       <div className="section-header" style={{ marginBottom: '24px' }}>
//         <div>
//           <h1 className="page-title" style={{ color: '#ffffff', fontWeight: '700', fontSize: '26px' }}>EOD Worklogs & Performance</h1>
//           <p className="page-subtitle" style={{ color: '#94a3b8', fontSize: '14px', marginTop: '4px' }}>Track daily employee productivity, project blockers, and contribution reports</p>
//         </div>
//         <button className="btn btn-primary" onClick={() => {
//           setFormData({ employee_id: employees[0]?.id || '', report_date: new Date().toISOString().split('T')[0], tasks_completed: '', tasks_in_progress: '', blockers: 'None', sentiment: 'GOOD', hours_worked: 8 })
//           setIsSubmitModalOpen(true)
//         }}>
//           <Plus size={16} /> Submit EOD
//         </button>
//       </div>
//       {/* Tab Controls */}
//       <div style={{ display: 'flex', gap: '4px', borderBottom: `1px solid ${colors.cardBorder}`, marginBottom: '24px', paddingBottom: '2px' }}>
//         <button style={getTabButtonStyle(activeTab === 'daily')} onClick={() => setActiveTab('daily')}>
//           <FileText size={16} /> Daily Worklogs
//         </button>
//         <button style={getTabButtonStyle(activeTab === 'weekly-monthly')} onClick={() => setActiveTab('weekly-monthly')}>
//           <Calendar size={16} /> Weekly / Monthly Reports
//         </button>
//         <button style={getTabButtonStyle(activeTab === 'contribution')} onClick={() => setActiveTab('contribution')}>
//           <Users size={16} /> Employee Contribution
//         </button>
//         <button style={getTabButtonStyle(activeTab === 'productivity')} onClick={() => setActiveTab('productivity')}>
//           <BarChart3 size={16} /> Hour & Productivity Tracking
//         </button>
//       </div>
//       {/* RENDER TAB 1: DAILY WORKLOGS (EXISTING DESIGN WITH STATS) */}
//       {activeTab === 'daily' && (
//         <>
//           <div className="stats-grid" style={{ marginBottom: '24px' }}>
//             <div className="stat-card" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
//               <div className="stat-icon purple" style={{ backgroundColor: colors.statIconPurpleBg, color: '#c084fc', padding: '12px', borderRadius: '10px' }}><FileText size={22} /></div>
//               <div><div className="stat-value" style={{ color: '#ffffff', fontSize: '24px', fontWeight: '700' }}>{stats.today}</div><div className="stat-label" style={{ color: '#94a3b8', fontSize: '12px' }}>Reports Today</div></div>
//             </div>
//             <div className="stat-card" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
//               <div className="stat-icon amber" style={{ backgroundColor: colors.statIconAmberBg, color: '#fbbf24', padding: '12px', borderRadius: '10px' }}><XCircle size={22} /></div>
//               <div><div className="stat-value" style={{ color: '#ffffff', fontSize: '24px', fontWeight: '700' }}>{stats.pending}</div><div className="stat-label" style={{ color: '#94a3b8', fontSize: '12px' }}>Pending Review</div></div>
//             </div>
//             <div className="stat-card" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
//               <div className="stat-icon blue" style={{ backgroundColor: colors.statIconBlueBg, color: '#60a5fa', padding: '12px', borderRadius: '10px' }}><Clock size={22} /></div>
//               <div><div className="stat-value" style={{ color: '#ffffff', fontSize: '24px', fontWeight: '700' }}>{stats.todayHours} hrs</div><div className="stat-label" style={{ color: '#94a3b8', fontSize: '12px' }}>Total Hours Today</div></div>
//             </div>
//             <div className="stat-card" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
//               <div className="stat-icon gray" style={{ backgroundColor: colors.statIconGrayBg, color: '#cbd5e1', padding: '12px', borderRadius: '10px' }}><Clock size={22} /></div>
//               <div><div className="stat-value" style={{ color: '#ffffff', fontSize: '24px', fontWeight: '700' }}>{stats.yesterdayHours} hrs</div><div className="stat-label" style={{ color: '#94a3b8', fontSize: '12px' }}>Total Hours Yesterday</div></div>
//             </div>
//           </div>
//           <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: '12px', padding: '16px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center' }}>
//             <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#0d111a', border: `1px solid ${colors.cardBorder}`, borderRadius: '8px', padding: '8px 14px', width: '100%', maxWidth: '400px' }}>
//               <Search size={18} style={{ color: '#94a3b8' }} />
//               <input
//                 type="text"
//                 placeholder="Search by employee name..."
//                 value={search}
//                 onChange={e => setSearch(e.target.value)}
//                 style={{ background: 'none', border: 'none', color: '#ffffff', outline: 'none', fontSize: '14px', width: '100%' }}
//               />
//             </div>
//           </div>
//           <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: '12px', padding: 0, overflow: 'hidden' }}>
//             {loading ? (
//               <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div className="spinner" /></div>
//             ) : (
//               <div className="table-container">
//                 <table style={{ width: '100%', borderCollapse: 'collapse' }}>
//                   <thead>
//                     <tr style={{ background: '#1c2333', borderBottom: `1px solid ${colors.cardBorder}` }}>
//                       <th style={{ padding: '14px 16px', color: '#94a3b8', fontWeight: '600', fontSize: '13px', textAlign: 'left' }}>Date & Employee</th>
//                       <th style={{ padding: '14px 16px', color: '#94a3b8', fontWeight: '600', fontSize: '13px', textAlign: 'left' }}>Hours & Mood</th>
//                       <th style={{ padding: '14px 16px', color: '#94a3b8', fontWeight: '600', fontSize: '13px', textAlign: 'left' }}>Tasks Completed</th>
//                       <th style={{ padding: '14px 16px', color: '#94a3b8', fontWeight: '600', fontSize: '13px', textAlign: 'left' }}>Blockers</th>
//                       <th style={{ padding: '14px 16px', color: '#94a3b8', fontWeight: '600', fontSize: '13px', textAlign: 'left' }}>Status</th>
//                       <th style={{ padding: '14px 16px', color: '#94a3b8', fontWeight: '600', fontSize: '13px', textAlign: 'left' }}>Actions</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {filtered.map(report => (
//                       <tr key={report.id} style={{ borderBottom: `1px solid ${colors.cardBorder}`, transition: 'background-color 0.15s ease' }}>
//                         <td style={{ padding: '14px 16px' }}>
//                           <div style={{ fontWeight: 600, color: '#ffffff' }}>{formatDate(report.report_date)}</div>
//                           <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>
//                             {report.employees?.firstName} {report.employees?.lastName}
//                           </div>
//                         </td>
//                         <td style={{ padding: '14px 16px' }}>
//                           <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>{report.hours_worked} hrs</div>
//                           <div style={{ marginTop: '4px' }}>
//                             <span style={getBadgeStyle(report.sentiment)}>
//                               Feeling: {report.sentiment}
//                             </span>
//                           </div>
//                         </td>
//                         <td style={{ padding: '14px 16px', fontSize: '13px', maxWidth: '300px' }}>
//                           <ul style={{ paddingLeft: '16px', margin: 0, color: '#cbd5e1' }}>
//                             {(report.tasks_completed || []).slice(0, 2).map((t: string, i: number) => (
//                               <li key={i} style={{ marginBottom: '2px' }}>{t}</li>
//                             ))}
//                             {(report.tasks_completed || []).length > 2 && (
//                               <li style={{ color: '#94a3b8', listStyleType: 'none', marginLeft: '-16px', marginTop: '4px' }}>...and {(report.tasks_completed || []).length - 2} more</li>
//                             )}
//                           </ul>
//                         </td>
//                         <td style={{ padding: '14px 16px', fontSize: '13px', color: report.blockers === 'None' ? '#64748b' : '#ef4444', fontWeight: report.blockers === 'None' ? 'normal' : '500' }}>
//                           {report.blockers}
//                         </td>
//                         <td style={{ padding: '14px 16px' }}>
//                           <span style={getBadgeStyle(report.approval_status || 'PENDING')}>
//                             {report.approval_status || 'PENDING'}
//                           </span>
//                         </td>
//                         <td style={{ padding: '14px 16px' }}>
//                           {canApprove ? (
//                             <button className="btn btn-secondary btn-sm" onClick={() => {
//                               setSelectedReport(report)
//                               setReviewData({
//                                 approval_status: report.approval_status || 'APPROVED',
//                                 supervisor_remarks: report.supervisor_remarks || ''
//                               })
//                               setIsReviewModalOpen(true)
//                             }}>
//                               Review
//                             </button>
//                           ) : (
//                             <span style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>
//                               {report.supervisor_remarks ? '💬 ' + report.supervisor_remarks.slice(0, 30) + '...' : '—'}
//                             </span>
//                           )}
//                         </td>
//                       </tr>
//                     ))}
//                     {filtered.length === 0 && (
//                       <tr>
//                         <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontSize: '14px' }}>No EOD reports found.</td>
//                       </tr>
//                     )}
//                   </tbody>
//                 </table>
//               </div>
//             )}
//           </div>
//         </>
//       )}
//       {/* RENDER TAB 2: WEEKLY & MONTHLY REPORTS */}
//       {activeTab === 'weekly-monthly' && (
//         <div style={cardStyle}>
//           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
//             <div>
//               <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0, color: '#ffffff' }}>Aggregated Performance Periods</h2>
//               <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0 0' }}>
//                 Summary of submissions, work hours, and sentiments grouped by time blocks
//               </p>
//             </div>
//             <div style={{ display: 'flex', backgroundColor: '#0d111a', borderRadius: '8px', padding: '3px', border: `1px solid ${colors.cardBorder}` }}>
//               <button
//                 style={getToggleButtonStyle(reportTimeframe === 'weekly')}
//                 onClick={() => setReportTimeframe('weekly')}
//               >
//                 Weekly
//               </button>
//               <button
//                 style={getToggleButtonStyle(reportTimeframe === 'monthly')}
//                 onClick={() => setReportTimeframe('monthly')}
//               >
//                 Monthly
//               </button>
//             </div>
//           </div>
//           <div style={{ overflow: 'hidden', border: `1px solid ${colors.cardBorder}`, borderRadius: '10px' }}>
//             <table style={{ width: '100%', borderCollapse: 'collapse' }}>
//               <thead>
//                 <tr style={{ background: '#1c2333', borderBottom: `1px solid ${colors.cardBorder}` }}>
//                   <th style={{ padding: '14px 16px', color: '#94a3b8', fontWeight: '600', fontSize: '13px', textAlign: 'left' }}>Period</th>
//                   <th style={{ padding: '14px 16px', color: '#94a3b8', fontWeight: '600', fontSize: '13px', textAlign: 'left' }}>Total Submissions</th>
//                   <th style={{ padding: '14px 16px', color: '#94a3b8', fontWeight: '600', fontSize: '13px', textAlign: 'left' }}>Hours Logged</th>
//                   <th style={{ padding: '14px 16px', color: '#94a3b8', fontWeight: '600', fontSize: '13px', textAlign: 'left' }}>Mood Distribution</th>
//                   <th style={{ padding: '14px 16px', color: '#94a3b8', fontWeight: '600', fontSize: '13px', textAlign: 'left' }}>Blockers Logged</th>
//                   <th style={{ padding: '14px 16px', color: '#94a3b8', fontWeight: '600', fontSize: '13px', textAlign: 'left' }}>Action</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {periodSummaries.map(p => {
//                   const total = p.reportsCount
//                   const greatPct = total > 0 ? Math.round((p.sentimentCounts.GREAT / total) * 100) : 0
//                   const goodPct = total > 0 ? Math.round((p.sentimentCounts.GOOD / total) * 100) : 0
//                   const okPct = total > 0 ? Math.round((p.sentimentCounts.OK / total) * 100) : 0
//                   const stressedPct = total > 0 ? Math.round((p.sentimentCounts.STRESSED / total) * 100) : 0

//                   return (
//                     <tr key={p.key} style={{ borderBottom: `1px solid ${colors.cardBorder}` }}>
//                       <td style={{ padding: '14px 16px', fontWeight: 600, color: '#ffffff' }}>{p.label}</td>
//                       <td style={{ padding: '14px 16px', color: '#e2e8f0' }}>{p.reportsCount} reports</td>
//                       <td style={{ padding: '14px 16px', fontWeight: 600, color: '#38bdf8' }}>{p.totalHours} hrs</td>
//                       <td style={{ padding: '14px 16px', minWidth: '150px' }}>
//                         <div style={{ display: 'flex', gap: '3px', fontSize: '11px', color: '#fff', height: '20px', borderRadius: '6px', overflow: 'hidden' }}>
//                           {greatPct > 0 && <div style={{ backgroundColor: '#a855f7', width: `${greatPct}%`, textAlign: 'center', lineHeight: '20px' }} title={`Great: ${greatPct}%`}>🚀</div>}
//                           {goodPct > 0 && <div style={{ backgroundColor: '#22c55e', width: `${goodPct}%`, textAlign: 'center', lineHeight: '20px' }} title={`Good: ${goodPct}%`}>👍</div>}
//                           {okPct > 0 && <div style={{ backgroundColor: '#f59e0b', width: `${okPct}%`, textAlign: 'center', lineHeight: '20px' }} title={`Ok: ${okPct}%`}>😐</div>}
//                           {stressedPct > 0 && <div style={{ backgroundColor: '#ef4444', width: `${stressedPct}%`, textAlign: 'center', lineHeight: '20px' }} title={`Stressed: ${stressedPct}%`}>😓</div>}
//                           {total === 0 && <span style={{ color: '#64748b' }}>—</span>}
//                         </div>
//                       </td>
//                       <td style={{ padding: '14px 16px', color: p.blockerCount > 0 ? '#ef4444' : '#64748b', fontWeight: p.blockerCount > 0 ? '600' : 'normal' }}>
//                         {p.blockerCount} blockers
//                       </td>
//                       <td style={{ padding: '14px 16px' }}>
//                         <button className="btn btn-secondary btn-sm" onClick={() => setSelectedPeriodDetails(p)}>
//                           View Details
//                         </button>
//                       </td>
//                     </tr>
//                   )
//                 })}
//                 {periodSummaries.length === 0 && (
//                   <tr>
//                     <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontSize: '14px' }}>No summaries available. Submit EOD reports to generate stats.</td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       )}
//       {/* RENDER TAB 3: EMPLOYEE CONTRIBUTION ANALYSIS */}
//       {activeTab === 'contribution' && (
//         <div>
//           <div style={{ marginBottom: '20px' }}>
//             <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0, color: '#ffffff' }}>Team Performance Matrix</h2>
//             <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0 0' }}>
//               Track completed objectives, average working styles, and blocker details per member
//             </p>
//           </div>
//           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
//             {employeeContributions.map(emp => {
//               return (
//                 <div key={emp.id} style={cardStyle}>
//                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
//                     <div>
//                       <div style={{ fontSize: '17px', fontWeight: '700', color: '#ffffff' }}>{emp.name}</div>
//                       <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
//                         Avg: <span style={{ color: '#38bdf8', fontWeight: '600' }}>{emp.averageHours}</span> hrs/day
//                       </div>
//                     </div>
//                     <span style={getBadgeStyle(emp.productivityScore >= 80 ? 'APPROVED' : emp.productivityScore >= 60 ? 'PENDING' : 'STRESSED')}>
//                       Productivity: {emp.productivityScore}%
//                     </span>
//                   </div>
//                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '18px', fontSize: '12px' }}>
//                     <div style={{ backgroundColor: '#0d111a', border: `1px solid ${colors.cardBorder}`, padding: '8px 12px', borderRadius: '8px', display: 'flex', flexDirection: 'column' }}>
//                       <span style={{ fontWeight: 700, fontSize: '15px', color: '#ffffff' }}>{emp.totalHours} hrs</span>
//                       <span style={{ color: '#64748b', fontSize: '10px', marginTop: '2px' }}>Hours Logged</span>
//                     </div>
//                     <div style={{ backgroundColor: '#0d111a', border: `1px solid ${colors.cardBorder}`, padding: '8px 12px', borderRadius: '8px', display: 'flex', flexDirection: 'column' }}>
//                       <span style={{ fontWeight: 700, fontSize: '15px', color: '#ffffff' }}>{emp.reportCount}</span>
//                       <span style={{ color: '#64748b', fontSize: '10px', marginTop: '2px' }}>EOD Reports</span>
//                     </div>
//                     <div style={{ backgroundColor: '#0d111a', border: `1px solid ${colors.cardBorder}`, padding: '8px 12px', borderRadius: '8px', display: 'flex', flexDirection: 'column' }}>
//                       <span style={{ fontWeight: 700, fontSize: '15px', color: '#22c55e' }}>{emp.completedTasksCount}</span>
//                       <span style={{ color: '#64748b', fontSize: '10px', marginTop: '2px' }}>Completed Tasks</span>
//                     </div>
//                     <div style={{ backgroundColor: '#0d111a', border: `1px solid ${colors.cardBorder}`, padding: '8px 12px', borderRadius: '8px', display: 'flex', flexDirection: 'column' }}>
//                       <span style={{ fontWeight: 700, fontSize: '15px', color: '#fbbf24' }}>{emp.inProgressTasksCount}</span>
//                       <span style={{ color: '#64748b', fontSize: '10px', marginTop: '2px' }}>In-Progress Tasks</span>
//                     </div>
//                   </div>
//                   <div>
//                     <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>Sentiment Ratio:</div>
//                     <div style={{ display: 'flex', height: '10px', borderRadius: '9999px', overflow: 'hidden', backgroundColor: '#0d111a', marginBottom: '18px' }}>
//                       {Object.entries(emp.sentimentCounts).map(([sentiment, count]) => {
//                         const countNum = count as number
//                         if (countNum === 0) return null
//                         const pct = Math.round((countNum / emp.reportCount) * 100)
//                         let color = '#3b82f6' // GOOD (blue)
//                         if (sentiment === 'GREAT') color = '#a855f7' // purple
//                         if (sentiment === 'OK') color = '#fbbf24' // amber
//                         if (sentiment === 'STRESSED') color = '#ef4444' // red
//                         return (
//                           <div
//                             key={sentiment}
//                             style={{ width: `${pct}%`, backgroundColor: color }}
//                             title={`${sentiment}: ${pct}%`}
//                           />
//                         )
//                       })}
//                     </div>
//                   </div>
//                   <div>
//                     <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
//                       <AlertTriangle size={12} style={{ color: emp.blockers.length > 0 ? '#ef4444' : '#64748b' }} />
//                       Blockers Encountered ({emp.blockers.length})
//                     </div>
//                     {emp.blockers.length > 0 ? (
//                       <div style={{ maxHeight: '90px', overflowY: 'auto', fontSize: '12px', border: `1px solid ${colors.cardBorder}`, borderRadius: '8px', padding: '8px 12px', marginTop: '8px', backgroundColor: '#0d111a', color: '#cbd5e1' }}>
//                         <ul style={{ margin: 0, paddingLeft: '14px' }}>
//                           {emp.blockers.map((b: string, idx: number) => (
//                             <li key={idx} style={{ marginBottom: '4px' }}>{b}</li>
//                           ))}
//                         </ul>
//                       </div>
//                     ) : (
//                       <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px', fontStyle: 'italic' }}>
//                         No current blockers reported.
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               )
//             })}

//             {employeeContributions.length === 0 && (
//               <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: '12px', padding: '40px', gridColumn: '1 / -1', textAlign: 'center' }}>
//                 <p style={{ color: '#64748b' }}>No employee contributions loaded yet. Submit EOD reports to analyze.</p>
//               </div>
//             )}
//           </div>
//         </div>
//       )}
//       {/* RENDER TAB 4: HOUR & PRODUCTIVITY TRACKING (GLOWING DASHBOARD CHARTS) */}
//       {activeTab === 'productivity' && (
//         <div>
//           {/* Top Row: Glowing Metric Cards */}
//           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>

//             {/* Card 1: TOTAL LABOR TRACKED */}
//             <div style={{ ...cardStyle, display: 'flex', gap: '16px', backgroundImage: 'radial-gradient(circle at top right, rgba(168, 85, 247, 0.12), transparent)', border: '1px solid rgba(168, 85, 247, 0.25)' }}>
//               <div style={{ flex: 1 }}>
//                 <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
//                   <Clock size={14} style={{ color: '#c084fc' }} /> TOTAL LABOR TRACKED
//                 </div>
//                 <div style={{ fontSize: '32px', fontWeight: '800', color: '#ffffff', marginBottom: '10px' }}>
//                   {productivityMetrics.totalHoursLogged} <span style={{ fontSize: '16px', color: '#94a3b8', fontWeight: '500' }}>hrs</span>
//                 </div>
//                 <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.4', marginBottom: '14px' }}>
//                   Aggregated workspace hours logged across all reported EOD cycles.
//                 </div>
//                 <div style={{ fontSize: '11px', color: '#64748b', borderTop: `1px solid ${colors.cardBorder}`, paddingTop: '10px' }}>
//                   — vs last 7 days
//                 </div>
//               </div>
//               <div style={{ width: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//                 <svg width="70" height="70" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 4px 12px rgba(168, 85, 247, 0.4))' }}>
//                   <circle cx="50" cy="50" r="40" fill="url(#clockBg)" stroke="#a855f7" strokeWidth="3" />
//                   <circle cx="50" cy="50" r="32" fill="#1b122e" />
//                   <path d="M50 24V50L68 60" stroke="#d8b4fe" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
//                   <circle cx="50" cy="50" r="4" fill="#ffffff" />
//                   <defs>
//                     <linearGradient id="clockBg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
//                       <stop offset="0%" stopColor="#c084fc" />
//                       <stop offset="100%" stopColor="#6b21a8" />
//                     </linearGradient>
//                   </defs>
//                 </svg>
//               </div>
//             </div>
//             {/* Card 2: TEAM MOOD INDEX */}
//             <div style={{ ...cardStyle, display: 'flex', gap: '16px', backgroundImage: 'radial-gradient(circle at top right, rgba(34, 197, 94, 0.12), transparent)', border: '1px solid rgba(34, 197, 94, 0.25)' }}>
//               <div style={{ flex: 1 }}>
//                 <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
//                   <Smile size={14} style={{ color: '#4ade80' }} /> TEAM MOOD INDEX
//                 </div>
//                 <div style={{ fontSize: '32px', fontWeight: '800', color: '#ffffff', marginBottom: '10px' }}>
//                   {productivityMetrics.averageProductivity}%
//                 </div>
//                 <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.4', marginBottom: '14px' }}>
//                   Aggregated developer output indicator derived from team sentiments.
//                 </div>
//                 <div style={{ fontSize: '11px', color: '#64748b', borderTop: `1px solid ${colors.cardBorder}`, paddingTop: '10px' }}>
//                   — vs last 7 days
//                 </div>
//               </div>
//               <div style={{ width: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//                 <svg width="70" height="70" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 4px 12px rgba(34, 197, 94, 0.4))' }}>
//                   <circle cx="50" cy="50" r="40" fill="url(#smileBg)" stroke="#22c55e" strokeWidth="3" />
//                   <circle cx="36" cy="42" r="5" fill="#14532d" />
//                   <circle cx="64" cy="42" r="5" fill="#14532d" />
//                   <path d="M34 60C40 68 60 68 66 60" stroke="#14532d" strokeWidth="5" strokeLinecap="round" />
//                   <defs>
//                     <linearGradient id="smileBg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
//                       <stop offset="0%" stopColor="#4ade80" />
//                       <stop offset="100%" stopColor="#15803d" />
//                     </linearGradient>
//                   </defs>
//                 </svg>
//               </div>
//             </div>
//             {/* Card 3: BLOCKER INCIDENCE RATE */}
//             <div style={{ ...cardStyle, display: 'flex', gap: '16px', backgroundImage: 'radial-gradient(circle at top right, rgba(245, 158, 11, 0.12), transparent)', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
//               <div style={{ flex: 1 }}>
//                 <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
//                   <AlertTriangle size={14} style={{ color: '#fbbf24' }} /> BLOCKER INCIDENCE RATE
//                 </div>
//                 <div style={{ fontSize: '32px', fontWeight: '800', color: '#ffffff', marginBottom: '10px' }}>
//                   {productivityMetrics.blockerRate}%
//                 </div>
//                 <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.4', marginBottom: '14px' }}>
//                   Ratio of submitted worklogs which contain blocker impediments.
//                 </div>
//                 <div style={{ fontSize: '11px', color: '#64748b', borderTop: `1px solid ${colors.cardBorder}`, paddingTop: '10px' }}>
//                   — vs last 7 days
//                 </div>
//               </div>
//               <div style={{ width: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//                 <svg width="70" height="70" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 4px 12px rgba(245, 158, 11, 0.4))' }}>
//                   <polygon points="50,15 88,80 12,80" fill="url(#warnBg)" stroke="#f59e0b" strokeWidth="3" strokeLinejoin="round" />
//                   <rect x="47" y="38" width="6" height="20" rx="3" fill="#78350f" />
//                   <circle cx="50" cy="68" r="4" fill="#78350f" />
//                   <defs>
//                     <linearGradient id="warnBg" x1="50" y1="15" x2="50" y2="80" gradientUnits="userSpaceOnUse">
//                       <stop offset="0%" stopColor="#fbbf24" />
//                       <stop offset="100%" stopColor="#b45309" />
//                     </linearGradient>
//                   </defs>
//                 </svg>
//               </div>
//             </div>
//           </div>
//           {/* Bottom Row: Hours Chart & Mood Donut */}
//           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>

//             {/* Card 4 (Left): Total Hours by Employee */}
//             <div style={cardStyle}>
//               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: `1px solid ${colors.cardBorder}`, paddingBottom: '12px' }}>
//                 <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
//                   <Users size={16} style={{ color: '#38bdf8' }} /> Total Hours Tracked by Employee
//                 </h3>
//                 <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
//                   <select style={{ backgroundColor: '#0d111a', border: `1px solid ${colors.cardBorder}`, borderRadius: '6px', padding: '6px 12px', color: '#94a3b8', fontSize: '12px', outline: 'none', cursor: 'pointer' }}>
//                     <option>This Week</option>
//                     <option>This Month</option>
//                   </select>
//                 </div>
//               </div>
//               {employeeContributions.length === 0 ? (
//                 // Mockup Empty State (Matches Image)
//                 <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '50px 20px', textAlign: 'center' }}>
//                   <div style={{ marginBottom: '18px' }}>
//                     <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 4px 8px rgba(99, 102, 241, 0.2))' }}>
//                       <rect x="25" y="20" width="50" height="65" rx="8" fill="#1e293b" stroke="#334155" strokeWidth="2" />
//                       <rect x="32" y="32" width="36" height="45" rx="4" fill="#0f172a" />
//                       <rect x="42" y="14" width="16" height="8" rx="2" fill="#475569" />
//                       <circle cx="50" cy="50" r="16" fill="#3b82f6" fillOpacity="0.2" stroke="#3b82f6" strokeWidth="2" />
//                       <path d="M50 50L62 60" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
//                       <path d="M50 50V34" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
//                       <path d="M18 35L20 37L18 39L16 37Z" fill="#a855f7" />
//                       <path d="M82 45L84 47L82 49L80 47Z" fill="#38bdf8" />
//                       <path d="M75 25L76 26L75 27L74 26Z" fill="#fbbf24" />
//                     </svg>
//                   </div>
//                   <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#ffffff', marginBottom: '6px' }}>No log details yet.</h4>
//                   <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px', maxWidth: '300px' }}>Submit EODs to start tracking employee hours.</p>
//                   <button className="btn btn-primary btn-sm" onClick={() => setIsSubmitModalOpen(true)} style={{ backgroundColor: '#4f46e5', borderColor: '#4f46e5' }}>
//                     Submit EOD
//                   </button>
//                 </div>
//               ) : (
//                 // Active State (Horizontal Comparative Progress Bars)
//                 <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '10px 0' }}>
//                   {employeeContributions.map(emp => {
//                     const maxHours = Math.max(...employeeContributions.map(e => e.totalHours), 1)
//                     const barWidth = Math.round((emp.totalHours / maxHours) * 100)
//                     return (
//                       <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px' }} key={emp.id}>
//                         <div style={{ width: '120px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', fontWeight: '500', color: '#cbd5e1' }} title={emp.name}>{emp.name}</div>
//                         <div style={{ flex: 1, backgroundColor: '#0d111a', height: '14px', borderRadius: '9999px', overflow: 'hidden' }}>
//                           <div style={{ height: '100%', borderRadius: '9999px', width: `${barWidth}%`, backgroundImage: 'linear-gradient(90deg, #38bdf8 0%, #4f46e5 100%)' }} />
//                         </div>
//                         <div style={{ width: '60px', textAlign: 'right', fontWeight: '600', color: '#f8fafc' }}>{emp.totalHours} hrs</div>
//                       </div>
//                     )
//                   })}
//                 </div>
//               )}
//             </div>
//             {/* Card 5 (Right): Workspace Mood Split (Donut Chart) */}
//             <div style={cardStyle}>
//               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: `1px solid ${colors.cardBorder}`, paddingBottom: '12px' }}>
//                 <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
//                   <Smile size={16} style={{ color: '#fbbf24' }} /> Workspace Mood Split (%)
//                 </h3>
//                 <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
//                   <select style={{ backgroundColor: '#0d111a', border: `1px solid ${colors.cardBorder}`, borderRadius: '6px', padding: '6px 12px', color: '#94a3b8', fontSize: '12px', outline: 'none', cursor: 'pointer' }}>
//                     <option>This Week</option>
//                   </select>
//                 </div>
//               </div>
//               <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'center', justifyContent: 'center', padding: '10px 0' }}>
//                 {/* Donut circle representation using CSS conic-gradient */}
//                 <div style={{ position: 'relative', width: '130px', height: '130px', borderRadius: '50%', background: getDonutGradient(), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//                   {/* Center circle overlay creating the donut hole */}
//                   <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cardBg, borderRadius: '50%', width: '100px', height: '100px', position: 'absolute', top: '15px', left: '15px' }}>
//                     <div style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff' }}>
//                       {productivityMetrics.averageProductivity}%
//                     </div>
//                     <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '2px', textTransform: 'uppercase', fontWeight: '600' }}>Overall Mood</div>
//                   </div>
//                 </div>
//                 {/* Donut Legend items matching mockup layout */}
//                 <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, minWidth: '180px' }}>
//                   {sentimentLegendData.map((item, idx) => (
//                     <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
//                       <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
//                         <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: item.color }} />
//                         <span style={{ color: '#cbd5e1' }}>{item.label}</span>
//                       </div>
//                       <div style={{ display: 'flex', gap: '16px', fontWeight: '600' }}>
//                         <span style={{ color: '#94a3b8', width: '35px', textAlign: 'right' }}>{item.pct}%</span>
//                         <span style={{ color: '#64748b', width: '20px', textAlign: 'right' }}>{item.count}</span>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//               {/* Bottom footer text of Donut card */}
//               <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', borderTop: `1px solid ${colors.cardBorder}`, paddingTop: '12px', marginTop: '12px' }}>
//                 <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '14px', height: '14px', border: '1px solid #64748b', borderRadius: '50%', fontSize: '9px', fontWeight: '700' }}>i</span>
//                 Mood is calculated from employee sentiment in EODs.
//               </div>
//             </div>
//           </div>
//           {/* Bottom Action Banner Card */}
//           <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '24px', backgroundImage: 'radial-gradient(circle at left, rgba(168, 85, 247, 0.08), transparent)', border: '1px solid rgba(168, 85, 247, 0.15)' }}>
//             <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
//               <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: 'rgba(168, 85, 247, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//                 <Calendar size={22} style={{ color: '#c084fc' }} />
//               </div>
//               <div>
//                 <div style={{ fontWeight: '700', fontSize: '15px', color: '#ffffff' }}>Keep your worklogs updated!</div>
//                 <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>Consistent EOD submissions help keep dashboards accurate and teams aligned.</div>
//               </div>
//             </div>
//             <button style={{ backgroundColor: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '8px', padding: '10px 18px', color: '#818cf8', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', transition: 'all 0.15s ease' }}>
//               Learn More <TrendingUp size={14} />
//             </button>
//           </div>
//         </div>
//       )}
//       {/* POPUP MODAL: Weekly/Monthly Period details */}
//       {selectedPeriodDetails && (
//         <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(5, 8, 16, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
//           <div style={{ backgroundColor: colors.cardBg, border: '1px solid #2b3a5e', borderRadius: '12px', width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', padding: '24px', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)', color: '#ffffff' }}>
//             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${colors.cardBorder}`, paddingBottom: '14px', marginBottom: '20px' }}>
//               <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#ffffff' }}>{selectedPeriodDetails.label} Summary Details</h3>
//               <button onClick={() => setSelectedPeriodDetails(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
//                 <X size={20} />
//               </button>
//             </div>

//             <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
//               <div>
//                 <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>Hours Logged per Member</h4>
//                 <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
//                   {Object.entries(selectedPeriodDetails.employeeDetails).map(([id, details]: any) => (
//                     <div key={id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: '#0d111a', border: `1px solid ${colors.cardBorder}`, borderRadius: '8px', fontSize: '13px' }}>
//                       <span style={{ fontWeight: 600, color: '#ffffff' }}>{details.name}</span>
//                       <span style={{ color: '#38bdf8', fontWeight: '500' }}>{details.hours} hours logged <span style={{ color: '#64748b' }}>({details.count} EODs)</span></span>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//               <div>
//                 <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>Blockers Logged in this Period ({selectedPeriodDetails.blockersList.length})</h4>
//                 {selectedPeriodDetails.blockersList.length > 0 ? (
//                   <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '6px' }}>
//                     {selectedPeriodDetails.blockersList.map((b: string, index: number) => (
//                       <li key={index} style={{ borderBottom: `1px solid ${colors.cardBorder}`, paddingBottom: '6px' }}>{b}</li>
//                     ))}
//                   </ul>
//                 ) : (
//                   <div style={{ fontSize: '13px', color: '#64748b', fontStyle: 'italic', padding: '10px', textAlign: 'center', backgroundColor: '#0d111a', borderRadius: '8px', border: `1px solid ${colors.cardBorder}` }}>No blockers encountered.</div>
//                 )}
//               </div>
//             </div>

//             <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
//               <button className="btn btn-secondary" onClick={() => setSelectedPeriodDetails(null)}>Close</button>
//             </div>
//           </div>
//         </div>
//       )}
//       {/* POPUP MODAL: Submit EOD Report */}
//       {isSubmitModalOpen && (
//         <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(5, 8, 16, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
//           <div style={{ backgroundColor: colors.cardBg, border: '1px solid #2b3a5e', borderRadius: '12px', width: '100%', maxWidth: '550px', padding: '24px', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)', color: '#ffffff' }}>
//             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${colors.cardBorder}`, paddingBottom: '14px', marginBottom: '20px' }}>
//               <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#ffffff' }}>Submit EOD Report</h3>
//               <button onClick={() => setIsSubmitModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
//                 <X size={20} />
//               </button>
//             </div>

//             <form onSubmit={handleSubmit}>
//               <div className="grid-2">
//                 <div className="form-group">
//                   <label className="form-label" style={{ color: '#94a3b8', fontSize: '13px', fontWeight: '500' }}>Employee</label>
//                   {canApprove ? (
//                     <select className="select" required value={formData.employee_id} onChange={e => setFormData({...formData, employee_id: e.target.value})} style={inputStyle}>
//                       <option value="" style={{ background: '#131825' }}>Select Employee</option>
//                       {employees.map(e => (
//                         <option key={e.id} value={e.id} style={{ background: '#131825' }}>{e.firstName} {e.lastName}</option>
//                       ))}
//                     </select>
//                   ) : (
//                     <input type="text" className="input" disabled value={currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : ''} style={{ ...inputStyle, backgroundColor: '#1e293b', color: '#94a3b8' }} />
//                   )}
//                 </div>
//                 <div className="form-group">
//                   <label className="form-label" style={{ color: '#94a3b8', fontSize: '13px', fontWeight: '500' }}>Report Date</label>
//                   <input type="date" className="input" required value={formData.report_date} onChange={e => setFormData({...formData, report_date: e.target.value})} style={inputStyle} />
//                 </div>
//               </div>
//               <div className="form-group">
//                 <label className="form-label" style={{ color: '#94a3b8', fontSize: '13px', fontWeight: '500' }}>Tasks Completed (One per line)</label>
//                 <textarea className="textarea" required rows={3} value={formData.tasks_completed} onChange={e => setFormData({...formData, tasks_completed: e.target.value})} placeholder="- Finished homepage UI&#10;- Fixed API bug..." style={inputStyle} />
//               </div>
//               <div className="form-group">
//                 <label className="form-label" style={{ color: '#94a3b8', fontSize: '13px', fontWeight: '500' }}>Tasks In Progress (One per line)</label>
//                 <textarea className="textarea" rows={2} value={formData.tasks_in_progress} onChange={e => setFormData({...formData, tasks_in_progress: e.target.value})} placeholder="- Database migration..." style={inputStyle} />
//               </div>
//               <div className="form-group">
//                 <label className="form-label" style={{ color: '#94a3b8', fontSize: '13px', fontWeight: '500' }}>Blockers / Issues</label>
//                 <input type="text" className="input" value={formData.blockers} onChange={e => setFormData({...formData, blockers: e.target.value})} style={inputStyle} />
//               </div>
//               <div className="grid-2">
//                 <div className="form-group">
//                   <label className="form-label" style={{ color: '#94a3b8', fontSize: '13px', fontWeight: '500' }}>How was your day?</label>
//                   <select className="select" required value={formData.sentiment} onChange={e => setFormData({...formData, sentiment: e.target.value})} style={inputStyle}>
//                     <option value="GREAT" style={{ background: '#131825' }}>Great 🚀</option>
//                     <option value="GOOD" style={{ background: '#131825' }}>Good 👍</option>
//                     <option value="OK" style={{ background: '#131825' }}>Just OK 😐</option>
//                     <option value="STRESSED" style={{ background: '#131825' }}>Stressed 😓</option>
//                   </select>
//                 </div>
//                 <div className="form-group">
//                   <label className="form-label" style={{ color: '#94a3b8', fontSize: '13px', fontWeight: '500' }}>Total Hours Worked</label>
//                   <input type="number" step="0.5" className="input" required value={formData.hours_worked} onChange={e => setFormData({...formData, hours_worked: Number(e.target.value)})} style={inputStyle} />
//                 </div>
//               </div>
//               <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
//                 <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Submit Report</button>
//                 <button type="button" className="btn btn-secondary" onClick={() => setIsSubmitModalOpen(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//       {/* POPUP MODAL: Manager Review */}
//       {isReviewModalOpen && selectedReport && (
//         <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(5, 8, 16, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
//           <div style={{ backgroundColor: colors.cardBg, border: '1px solid #2b3a5e', borderRadius: '12px', width: '100%', maxWidth: '500px', padding: '24px', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)', color: '#ffffff' }}>
//             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${colors.cardBorder}`, paddingBottom: '14px', marginBottom: '20px' }}>
//               <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#ffffff' }}>Manager Review</h3>
//               <button onClick={() => setIsReviewModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
//                 <X size={20} />
//               </button>
//             </div>

//             <form onSubmit={handleReviewSubmit}>
//               <div className="form-group">
//                 <label className="form-label" style={{ color: '#94a3b8', fontSize: '13px', fontWeight: '500' }}>Approval Status</label>
//                 <select className="select" required value={reviewData.approval_status} onChange={e => setReviewData({...reviewData, approval_status: e.target.value})} style={inputStyle}>
//                   <option value="PENDING" style={{ background: '#131825' }}>Pending</option>
//                   <option value="APPROVED" style={{ background: '#131825' }}>Approved</option>
//                   <option value="REJECTED" style={{ background: '#131825' }}>Rejected</option>
//                 </select>
//               </div>
//               <div className="form-group">
//                 <label className="form-label" style={{ color: '#94a3b8', fontSize: '13px', fontWeight: '500' }}>Supervisor Remarks</label>
//                 <textarea className="textarea" rows={4} value={reviewData.supervisor_remarks} onChange={e => setReviewData({...reviewData, supervisor_remarks: e.target.value})} placeholder="Add your remarks here..." style={inputStyle} />
//               </div>
//               <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
//                 <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Save Review</button>
//                 <button type="button" className="btn btn-secondary" onClick={() => setIsReviewModalOpen(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }
