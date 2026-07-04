// 'use client'
// import { useEffect, useState } from 'react'
// import { supabase } from '@/lib/supabase'
// import { Search, Plus, Check, X, Clock, Calendar } from 'lucide-react'
// import { formatDate } from '@/lib/utils'

// export default function LeavesPage() {
//   const [leaves, setLeaves] = useState<any[]>([])
//   const [employees, setEmployees] = useState<any[]>([])
//   const [loading, setLoading] = useState(true)
//   const [tab, setTab] = useState('ALL')
//   const [isModalOpen, setIsModalOpen] = useState(false)
  
//   const [formData, setFormData] = useState({
//     employee_id: '', start_date: '', end_date: '', type: 'CASUAL', reason: ''
//   })

//   useEffect(() => {
//     fetchData()
//   }, [])

//   const fetchData = async () => {
//     console.log("in leave fetchdata");
    
//     setLoading(true)
//     const [leaveRes, empRes] = await Promise.all([
//       supabase.from('leaves').select('*, employees(firstName, lastName)').order('created_at', { ascending: false }),
//       supabase.from('employees').select('id, firstName, lastName').eq('status', 'ACTIVE')
//     ])
//     if (leaveRes.data) setLeaves(leaveRes.data)
//     if (empRes.data) setEmployees(empRes.data)
//     setLoading(false)
//   }

//   const handleApply = async (e: React.FormEvent) => {
//     e.preventDefault()
//     const { error } = await supabase.from('leaves').insert([{ id: crypto.randomUUID(), ...formData, status: 'PENDING' }])
//     if (error) alert(error.message)
//     setIsModalOpen(false)
//     fetchData()
//   }

//   const handleAction = async (id: string, status: 'APPROVED' | 'REJECTED') => {
//     await supabase.from('leaves').update({ status }).eq('id', id)
//     fetchData()
//   }

//   const filtered = tab === 'ALL' ? leaves : leaves.filter(l => l.status === tab)

//   const stats = {
//     pending: leaves.filter(l => l.status === 'PENDING').length,
//     approved: leaves.filter(l => l.status === 'APPROVED').length,
//     rejected: leaves.filter(l => l.status === 'REJECTED').length
//   }

//   return (
//     <div className="page-content">
//       <div className="section-header">
//         <div>
//           <h1 className="page-title">Leave Management</h1>
//           <p className="page-subtitle">Track and approve employee leave requests</p>
//         </div>
//         <button className="btn btn-primary" onClick={() => {
//           setFormData({ employee_id: employees[0]?.id || '', start_date: '', end_date: '', type: 'CASUAL', reason: '' })
//           setIsModalOpen(true)
//         }}>
//           <Plus size={16} /> Apply Leave
//         </button>
//       </div>

//       <div className="stats-grid">
//         <div className="stat-card">
//           <div className="stat-icon amber"><Clock size={22} /></div>
//           <div><div className="stat-value">{stats.pending}</div><div className="stat-label">Pending Approval</div></div>
//         </div>
//         <div className="stat-card">
//           <div className="stat-icon blue"><Check size={22} /></div>
//           <div><div className="stat-value">{stats.approved}</div><div className="stat-label">Approved</div></div>
//         </div>
//         <div className="stat-card">
//           <div className="stat-icon red"><X size={22} /></div>
//           <div><div className="stat-value">{stats.rejected}</div><div className="stat-label">Rejected</div></div>
//         </div>
//       </div>

//       <div className="tab-list" style={{ maxWidth: '400px' }}>
//         {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(t => (
//           <button 
//             key={t} 
//             className={`tab ${tab === t ? 'active' : ''}`}
//             onClick={() => setTab(t)}
//           >
//             {t}
//           </button>
//         ))}
//       </div>

//       <div className="card" style={{ padding: 0 }}>
//         {loading ? (
//           <div className="spinner" />
//         ) : (
//           <div className="table-container">
//             <table>
//               <thead>
//                 <tr>
//                   <th>Employee</th>
//                   <th>Leave Type</th>
//                   <th>Duration</th>
//                   <th>Reason</th>
//                   <th>Status</th>
//                   <th>Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {filtered.map(leave => (
//                   <tr key={leave.id}>
//                     <td style={{ fontWeight: 600 }}>
//                       {leave.employees?.firstName} {leave.employees?.lastName}
//                     </td>
//                     <td>
//                       <span className="badge" style={{ background: 'var(--surface-3)', color: 'var(--text-primary)' }}>
//                         {leave.type}
//                       </span>
//                     </td>
//                     <td>
//                       <div style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
//                         <Calendar size={14} color="var(--text-secondary)" />
//                         {formatDate(leave.start_date)} - {formatDate(leave.end_date)}
//                       </div>
//                     </td>
//                     <td style={{ maxWidth: '200px', fontSize: '13px', color: 'var(--text-secondary)' }}>
//                       {leave.reason}
//                     </td>
//                     <td>
//                       <span className={`badge ${
//                         leave.status === 'APPROVED' ? 'badge-approved' : 
//                         leave.status === 'REJECTED' ? 'badge-rejected' : 'badge-pending'
//                       }`}>
//                         {leave.status}
//                       </span>
//                     </td>
//                     <td>
//                       {leave.status === 'PENDING' ? (
//                         <div style={{ display: 'flex', gap: '8px' }}>
//                           <button className="btn btn-success btn-sm" onClick={() => handleAction(leave.id, 'APPROVED')}>
//                             <Check size={14} /> Approve
//                           </button>
//                           <button className="btn btn-danger btn-sm" onClick={() => handleAction(leave.id, 'REJECTED')}>
//                             <X size={14} /> Reject
//                           </button>
//                         </div>
//                       ) : (
//                         <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Actioned</span>
//                       )}
//                     </td>
//                   </tr>
//                 ))}
//                 {filtered.length === 0 && (
//                   <tr>
//                     <td colSpan={6} className="empty-state">No leave records found.</td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>

//       {isModalOpen && (
//         <div className="modal-overlay">
//           <div className="modal">
//             <div className="modal-header">
//               <h3 className="modal-title">Apply for Leave</h3>
//               <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
//                 <X size={20} />
//               </button>
//             </div>
            
//             <form onSubmit={handleApply}>
//               <div className="form-group">
//                 <label className="form-label">Employee</label>
//                 <select className="select" required value={formData.employee_id} onChange={e => setFormData({...formData, employee_id: e.target.value})}>
//                   <option value="">Select Employee</option>
//                   {employees.map(e => (
//                     <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
//                   ))}
//                 </select>
//               </div>

//               <div className="grid-2">
//                 <div className="form-group">
//                   <label className="form-label">Start Date</label>
//                   <input type="date" className="input" required value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} />
//                 </div>
//                 <div className="form-group">
//                   <label className="form-label">End Date</label>
//                   <input type="date" className="input" required value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} />
//                 </div>
//               </div>

//               <div className="form-group">
//                 <label className="form-label">Leave Type</label>
//                 <select className="select" required value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
//                   <option value="CASUAL">Casual Leave</option>
//                   <option value="SICK">Sick Leave</option>
//                   <option value="COMPENSATORY">Compensatory Off</option>
//                   <option value="OTHER">Other</option>
//                 </select>
//               </div>

//               <div className="form-group">
//                 <label className="form-label">Reason</label>
//                 <textarea className="textarea" required rows={3} value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} />
//               </div>

//               <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
//                 <button type="submit" className="btn btn-primary"  style={{ flex: 1, justifyContent: 'center' }}>Submit Request</button>
//                 <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }

// --------------------------

// 'use client'
// import { useEffect, useState } from 'react'
// import { supabase } from '@/lib/supabase'
// import { Plus, Check, X, Clock, Calendar } from 'lucide-react'
// import { formatDate } from '@/lib/utils'

// export default function LeavesPage() {
//   const [leaves, setLeaves] = useState<any[]>([])
//   const [employees, setEmployees] = useState<any[]>([])
//   const [loading, setLoading] = useState(true)
//   const [tab, setTab] = useState('ALL')
//   const [isModalOpen, setIsModalOpen] = useState(false)

//   const [formData, setFormData] = useState({
//     employee_id: '', start_date: '', end_date: '', type: 'CASUAL', reason: ''
//   })

//   useEffect(() => {
//     fetchData()
//   }, [])

//   const fetchData = async () => {
//     setLoading(true)

//     // Fetch employees first (needed for name lookup)
//     const { data: empData, error: empError } = await supabase
//       .from('employees')
//       .select('id, firstName, lastName')
//       .eq('status', 'ACTIVE')

//     if (empError) console.error('Employees fetch error:', empError)
//     const empList = empData ?? []
//     setEmployees(empList)

//     // Build a quick lookup map: id -> name
//     const empMap: Record<string, { firstName: string; lastName: string }> = {}
//     empList.forEach(e => { empMap[e.id] = { firstName: e.firstName, lastName: e.lastName } })

//     // Fetch leaves — avoid the join (it requires FK in Supabase schema)
//     const { data: leaveData, error: leaveError } = await supabase
//       .from('leaves')
//       .select('*')
//       .order('created_at', { ascending: false })

//     if (leaveError) {
//       console.error('Leaves fetch error:', leaveError)
//       setLoading(false)
//       return
//     }

//     // Manually attach employee name from our lookup map
//     const enriched = (leaveData ?? []).map(l => ({
//       ...l,
//       employees: empMap[l.employee_id] ?? null
//     }))

//     setLeaves(enriched)
//     setLoading(false)
//   }

//   const handleApply = async (e: React.FormEvent) => {
//     e.preventDefault()
//     const newLeave = { id: crypto.randomUUID(), ...formData, status: 'PENDING' }
//     const { error } = await supabase.from('leaves').insert([newLeave])
//     if (error) {
//       alert(error.message)
//       return
//     }
//     // Optimistically add to UI immediately
//     const emp = employees.find(e => e.id === formData.employee_id)
//     setLeaves(prev => [{ ...newLeave, employees: emp ?? null }, ...prev])
//     setIsModalOpen(false)
//   }

//   const handleAction = async (id: string, status: 'APPROVED' | 'REJECTED') => {
//     const { error } = await supabase.from('leaves').update({ status }).eq('id', id)
//     if (error) { console.error('Update error:', error); return }
//     setLeaves(prev => prev.map(l => l.id === id ? { ...l, status } : l))
//   }

//   const filtered = tab === 'ALL' ? leaves : leaves.filter(l => l.status === tab)

//   const stats = {
//     pending: leaves.filter(l => l.status === 'PENDING').length,
//     approved: leaves.filter(l => l.status === 'APPROVED').length,
//     rejected: leaves.filter(l => l.status === 'REJECTED').length
//   }

//   return (
//     <div className="page-content">
//       <div className="section-header">
//         <div>
//           <h1 className="page-title">Leave Management</h1>
//           <p className="page-subtitle">Track and approve employee leave requests</p>
//         </div>
//         <button className="btn btn-primary" onClick={() => {
//           setFormData({ employee_id: employees[0]?.id || '', start_date: '', end_date: '', type: 'CASUAL', reason: '' })
//           setIsModalOpen(true)
//         }}>
//           <Plus size={16} /> Apply Leave
//         </button>
//       </div>

//       <div className="stats-grid">
//         <div className="stat-card">
//           <div className="stat-icon amber"><Clock size={22} /></div>
//           <div><div className="stat-value">{stats.pending}</div><div className="stat-label">Pending Approval</div></div>
//         </div>
//         <div className="stat-card">
//           <div className="stat-icon blue"><Check size={22} /></div>
//           <div><div className="stat-value">{stats.approved}</div><div className="stat-label">Approved</div></div>
//         </div>
//         <div className="stat-card">
//           <div className="stat-icon red"><X size={22} /></div>
//           <div><div className="stat-value">{stats.rejected}</div><div className="stat-label">Rejected</div></div>
//         </div>
//       </div>

//       <div className="tab-list" style={{ maxWidth: '400px' }}>
//         {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(t => (
//           <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</button>
//         ))}
//       </div>

//       <div className="card" style={{ padding: 0 }}>
//         {loading ? (
//           <div className="spinner" />
//         ) : (
//           <div className="table-container">
//             <table>
//               <thead>
//                 <tr>
//                   <th>Employee</th><th>Leave Type</th><th>Duration</th>
//                   <th>Reason</th><th>Status</th><th>Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {filtered.map(leave => (
//                   <tr key={leave.id}>
//                     <td style={{ fontWeight: 600 }}>
//                       {leave.employees?.firstName} {leave.employees?.lastName}
//                     </td>
//                     <td>
//                       <span className="badge" style={{ background: 'var(--surface-3)', color: 'var(--text-primary)' }}>
//                         {leave.type}
//                       </span>
//                     </td>
//                     <td>
//                       <div style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
//                         <Calendar size={14} color="var(--text-secondary)" />
//                         {formatDate(leave.start_date)} - {formatDate(leave.end_date)}
//                       </div>
//                     </td>
//                     <td style={{ maxWidth: '200px', fontSize: '13px', color: 'var(--text-secondary)' }}>{leave.reason}</td>
//                     <td>
//                       <span className={`badge ${
//                         leave.status === 'APPROVED' ? 'badge-approved' :
//                         leave.status === 'REJECTED' ? 'badge-rejected' : 'badge-pending'
//                       }`}>{leave.status}</span>
//                     </td>
//                     <td>
//                       {leave.status === 'PENDING' ? (
//                         <div style={{ display: 'flex', gap: '8px' }}>
//                           <button className="btn btn-success btn-sm" onClick={() => handleAction(leave.id, 'APPROVED')}>
//                             <Check size={14} /> Approve
//                           </button>
//                           <button className="btn btn-danger btn-sm" onClick={() => handleAction(leave.id, 'REJECTED')}>
//                             <X size={14} /> Reject
//                           </button>
//                         </div>
//                       ) : (
//                         <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Actioned</span>
//                       )}
//                     </td>
//                   </tr>
//                 ))}
//                 {filtered.length === 0 && (
//                   <tr><td colSpan={6} className="empty-state">No leave records found.</td></tr>
//                 )}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>

//       {isModalOpen && (
//         <div className="modal-overlay">
//           <div className="modal">
//             <div className="modal-header">
//               <h3 className="modal-title">Apply for Leave</h3>
//               <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
//                 <X size={20} />
//               </button>
//             </div>
//             <form onSubmit={handleApply}>
//               <div className="form-group">
//                 <label className="form-label">Employee</label>
//                 <select className="select" required value={formData.employee_id} onChange={e => setFormData({ ...formData, employee_id: e.target.value })}>
//                   <option value="">Select Employee</option>
//                   {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
//                 </select>
//               </div>
//               <div className="grid-2">
//                 <div className="form-group">
//                   <label className="form-label">Start Date</label>
//                   <input type="date" className="input" required value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })} />
//                 </div>
//                 <div className="form-group">
//                   <label className="form-label">End Date</label>
//                   <input type="date" className="input" required value={formData.end_date} onChange={e => setFormData({ ...formData, end_date: e.target.value })} />
//                 </div>
//               </div>
//               <div className="form-group">
//                 <label className="form-label">Leave Type</label>
//                 <select className="select" required value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
//                   <option value="CASUAL">Casual Leave</option>
//                   <option value="SICK">Sick Leave</option>
//                   <option value="COMPENSATORY">Compensatory Off</option>
//                   <option value="OTHER">Other</option>
//                 </select>
//               </div>
//               <div className="form-group">
//                 <label className="form-label">Reason</label>
//                 <textarea className="textarea" required rows={3} value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })} />
//               </div>
//               <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
//                 <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Submit Request</button>
//                 <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }


// --final 

// 'use client'
// import { useEffect, useState } from 'react'
// import { supabase } from '@/lib/supabase'
// import { Plus, Check, X, Clock, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
// import { formatDate } from '@/lib/utils'

// const PAGE_SIZE = 10

// export default function LeavesPage() {
//   const [leaves, setLeaves] = useState<any[]>([])
//   const [employees, setEmployees] = useState<any[]>([])
//   const [loading, setLoading] = useState(true)
//   const [tab, setTab] = useState('ALL')
//   const [isModalOpen, setIsModalOpen] = useState(false)
//   const [currentPage, setCurrentPage] = useState(1)
//   const [totalCount, setTotalCount] = useState(0)

//   const [formData, setFormData] = useState({
//     employee_id: '', start_date: '', end_date: '', type: 'CASUAL', reason: ''
//   })

//   useEffect(() => {
//     fetchEmployees()
//   }, [])

//   useEffect(() => {
//     fetchLeaves()
//   }, [tab, currentPage])

//   const fetchEmployees = async () => {
//     const { data, error } = await supabase
//       .from('employees')
//       .select('id, firstName, lastName')
//       .eq('status', 'ACTIVE')
//     if (error) console.error('Employees fetch error:', error)
//     if (data) setEmployees(data)
//   }

//   const fetchLeaves = async () => {
//     setLoading(true)

//     // Build employee lookup map
//     const { data: empData } = await supabase
//       .from('employees')
//       .select('id, firstName, lastName')
//     const empMap: Record<string, { firstName: string; lastName: string }> = {}
//     ;(empData ?? []).forEach(e => { empMap[e.id] = { firstName: e.firstName, lastName: e.lastName } })

//     const from = (currentPage - 1) * PAGE_SIZE
//     const to = from + PAGE_SIZE - 1

//     // Build query with optional status filter
//     let query = supabase
//       .from('leaves')
//       .select('*', { count: 'exact' })
//       .order('created_at', { ascending: false })
//       .range(from, to)

//     if (tab !== 'ALL') {
//       query = query.eq('status', tab)
//     }

//     const { data, error, count } = await query

//     if (error) {
//       console.error('Leaves fetch error:', error)
//       setLoading(false)
//       return
//     }

//     const enriched = (data ?? []).map(l => ({
//       ...l,
//       employees: empMap[l.employee_id] ?? null
//     }))

//     setLeaves(enriched)
//     setTotalCount(count ?? 0)
//     setLoading(false)
//   }

//   // Reset to page 1 when tab changes
//   const handleTabChange = (t: string) => {
//     setTab(t)
//     setCurrentPage(1)
//   }

//   const handleApply = async (e: React.FormEvent) => {
//     e.preventDefault()
//     const newLeave = { id: crypto.randomUUID(), ...formData, status: 'PENDING' }
//     const { error } = await supabase.from('leaves').insert([newLeave])
//     if (error) { alert(error.message); return }
//     setIsModalOpen(false)
//     setTab('ALL')
//     setCurrentPage(1)
//     fetchLeaves()
//   }

//   const handleAction = async (id: string, status: 'APPROVED' | 'REJECTED') => {
//     const { error } = await supabase.from('leaves').update({ status }).eq('id', id)
//     if (error) { console.error('Update error:', error); return }
//     fetchLeaves()
//   }

//   const totalPages = Math.ceil(totalCount / PAGE_SIZE)

//   // Stats — fetch full counts separately (not paginated)
//   const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 })

//   useEffect(() => {
//     const fetchStats = async () => {
//       const { data } = await supabase.from('leaves').select('status')
//       if (data) {
//         setStats({
//           pending: data.filter(l => l.status === 'PENDING').length,
//           approved: data.filter(l => l.status === 'APPROVED').length,
//           rejected: data.filter(l => l.status === 'REJECTED').length,
//         })
//       }
//     }
//     fetchStats()
//   }, [leaves])

//   return (
//     <div className="page-content">
//       <div className="section-header">
//         <div>
//           <h1 className="page-title">Leave Management</h1>
//           <p className="page-subtitle">Track and approve employee leave requests</p>
//         </div>
//         <button className="btn btn-primary" onClick={() => {
//           setFormData({ employee_id: employees[0]?.id || '', start_date: '', end_date: '', type: 'CASUAL', reason: '' })
//           setIsModalOpen(true)
//         }}>
//           <Plus size={16} /> Apply Leave
//         </button>
//       </div>

//       {/* Stats */}
//       <div className="stats-grid">
//         <div className="stat-card">
//           <div className="stat-icon amber"><Clock size={22} /></div>
//           <div><div className="stat-value">{stats.pending}</div><div className="stat-label">Pending Approval</div></div>
//         </div>
//         <div className="stat-card">
//           <div className="stat-icon blue"><Check size={22} /></div>
//           <div><div className="stat-value">{stats.approved}</div><div className="stat-label">Approved</div></div>
//         </div>
//         <div className="stat-card">
//           <div className="stat-icon red"><X size={22} /></div>
//           <div><div className="stat-value">{stats.rejected}</div><div className="stat-label">Rejected</div></div>
//         </div>
//       </div>

//       {/* Tabs */}
//       <div className="tab-list" style={{ maxWidth: '400px' }}>
//         {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(t => (
//           <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => handleTabChange(t)}>
//             {t}
//           </button>
//         ))}
//       </div>

//       {/* Table */}
//       <div className="card" style={{ padding: 0 }}>
//         {loading ? (
//           <div className="spinner" />
//         ) : (
//           <>
//             <div className="table-container">
//               <table>
//                 <thead>
//                   <tr>
//                     <th>Employee</th>
//                     <th>Leave Type</th>
//                     <th>Duration</th>
//                     <th>Reason</th>
//                     <th>Status</th>
//                     <th>Actions</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {leaves.map(leave => (
//                     <tr key={leave.id}>
//                       <td style={{ fontWeight: 600 }}>
//                         {leave.employees?.firstName} {leave.employees?.lastName}
//                       </td>
//                       <td>
//                         <span className="badge" style={{ background: 'var(--surface-3)', color: 'var(--text-primary)' }}>
//                           {leave.type}
//                         </span>
//                       </td>
//                       <td>
//                         <div style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
//                           <Calendar size={14} color="var(--text-secondary)" />
//                           {formatDate(leave.start_date)} - {formatDate(leave.end_date)}
//                         </div>
//                       </td>
//                       <td style={{ maxWidth: '200px', fontSize: '13px', color: 'var(--text-secondary)' }}>
//                         {leave.reason}
//                       </td>
//                       <td>
//                         <span className={`badge ${
//                           leave.status === 'APPROVED' ? 'badge-approved' :
//                           leave.status === 'REJECTED' ? 'badge-rejected' : 'badge-pending'
//                         }`}>
//                           {leave.status}
//                         </span>
//                       </td>
//                       <td>
//                         {leave.status === 'PENDING' ? (
//                           <div style={{ display: 'flex', gap: '8px' }}>
//                             <button className="btn btn-success btn-sm" onClick={() => handleAction(leave.id, 'APPROVED')}>
//                               <Check size={14} /> Approve
//                             </button>
//                             <button className="btn btn-danger btn-sm" onClick={() => handleAction(leave.id, 'REJECTED')}>
//                               <X size={14} /> Reject
//                             </button>
//                           </div>
//                         ) : (
//                           <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Actioned</span>
//                         )}
//                       </td>
//                     </tr>
//                   ))}
//                   {leaves.length === 0 && (
//                     <tr><td colSpan={6} className="empty-state">No leave records found.</td></tr>
//                   )}
//                 </tbody>
//               </table>
//             </div>

//             {/* Pagination Bar */}
//             {totalPages > 1 && (
//               <div style={{
//                 display: 'flex',
//                 alignItems: 'center',
//                 justifyContent: 'space-between',
//                 padding: '14px 20px',
//                 borderTop: '1px solid var(--border)',
//                 flexWrap: 'wrap',
//                 gap: '12px'
//               }}>
//                 {/* Info */}
//                 <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
//                   Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, totalCount)} of {totalCount} records
//                 </span>

//                 {/* Controls */}
//                 <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
//                   {/* Prev */}
//                   <button
//                     className="btn btn-secondary btn-sm"
//                     onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
//                     disabled={currentPage === 1}
//                     style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
//                   >
//                     <ChevronLeft size={15} /> Prev
//                   </button>

//                   {/* Page numbers */}
//                   {Array.from({ length: totalPages }, (_, i) => i + 1)
//                     .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
//                     .reduce<(number | string)[]>((acc, p, idx, arr) => {
//                       if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('…')
//                       acc.push(p)
//                       return acc
//                     }, [])
//                     .map((p, idx) =>
//                       p === '…' ? (
//                         <span key={`ellipsis-${idx}`} style={{ padding: '0 4px', color: 'var(--text-muted)', fontSize: '13px' }}>…</span>
//                       ) : (
//                         <button
//                           key={p}
//                           onClick={() => setCurrentPage(p as number)}
//                           style={{
//                             minWidth: '34px',
//                             height: '34px',
//                             borderRadius: '8px',
//                             border: '1px solid',
//                             borderColor: currentPage === p ? 'var(--primary)' : 'var(--border)',
//                             background: currentPage === p ? 'var(--primary)' : 'transparent',
//                             color: currentPage === p ? '#fff' : 'var(--text-primary)',
//                             fontSize: '13px',
//                             cursor: 'pointer',
//                             fontWeight: currentPage === p ? 600 : 400,
//                             transition: 'all 0.15s ease'
//                           }}
//                         >
//                           {p}
//                         </button>
//                       )
//                     )
//                   }

//                   {/* Next */}
//                   <button
//                     className="btn btn-secondary btn-sm"
//                     onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
//                     disabled={currentPage === totalPages}
//                     style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
//                   >
//                     Next <ChevronRight size={15} />
//                   </button>
//                 </div>
//               </div>
//             )}
//           </>
//         )}
//       </div>

//       {/* Modal */}
//       {isModalOpen && (
//         <div className="modal-overlay">
//           <div className="modal">
//             <div className="modal-header">
//               <h3 className="modal-title">Apply for Leave</h3>
//               <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
//                 <X size={20} />
//               </button>
//             </div>
//             <form onSubmit={handleApply}>
//               <div className="form-group">
//                 <label className="form-label">Employee</label>
//                 <select className="select" required value={formData.employee_id} onChange={e => setFormData({ ...formData, employee_id: e.target.value })}>
//                   <option value="">Select Employee</option>
//                   {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
//                 </select>
//               </div>
//               <div className="grid-2">
//                 <div className="form-group">
//                   <label className="form-label">Start Date</label>
//                   <input type="date" className="input" required value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })} />
//                 </div>
//                 <div className="form-group">
//                   <label className="form-label">End Date</label>
//                   <input type="date" className="input" required value={formData.end_date} onChange={e => setFormData({ ...formData, end_date: e.target.value })} />
//                 </div>
//               </div>
//               <div className="form-group">
//                 <label className="form-label">Leave Type</label>
//                 <select className="select" required value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
//                   <option value="CASUAL">Casual Leave</option>
//                   <option value="SICK">Sick Leave</option>
//                   <option value="COMPENSATORY">Compensatory Off</option>
//                   <option value="OTHER">Other</option>
//                 </select>
//               </div>
//               <div className="form-group">
//                 <label className="form-label">Reason</label>
//                 <textarea className="textarea" required rows={3} value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })} />
//               </div>
//               <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
//                 <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Submit Request</button>
//                 <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }


//along with checks 

'use client'
import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Check, X, Clock, Calendar, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'

const PAGE_SIZE = 10

// ─── Helpers ─────────────────────────────────────────────────────────────────

const toDateStr = (date: Date) => date.toISOString().split('T')[0]

const getTodayStr = () => toDateStr(new Date())

/** Returns true if a date string falls on Saturday or Sunday */
const isWeekend = (dateStr: string) => {
  const d = new Date(dateStr + 'T00:00:00')
  return d.getDay() === 0 || d.getDay() === 6
}

/** Count actual working days between start and end (inclusive),
 *  excluding weekends and holidays */
const calcWorkingDays = (start: string, end: string, holidays: string[]): number => {
  if (!start || !end) return 0
  const holidaySet = new Set(holidays)
  let count = 0
  const cur = new Date(start + 'T00:00:00')
  const last = new Date(end + 'T00:00:00')
  while (cur <= last) {
    const str = toDateStr(cur)
    if (!isWeekend(str) && !holidaySet.has(str)) count++
    cur.setDate(cur.getDate() + 1)
  }
  return count
}

// ─── Fallback holiday list (Indian public holidays 2025-2026) ─────────────────
// Replace / extend with your own; ideally these come from your DB
const FALLBACK_HOLIDAYS: string[] = [
  '2025-01-14', '2025-01-26', '2025-03-14', '2025-03-25', '2025-03-30',
  '2025-04-14', '2025-04-18', '2025-05-01', '2025-06-07', '2025-08-15',
  '2025-09-02', '2025-10-02', '2025-10-20', '2025-10-23', '2025-11-05',
  '2025-12-25',
  '2026-01-14', '2026-01-26', '2026-03-03', '2026-03-20', '2026-03-25',
  '2026-04-03', '2026-04-14', '2026-05-01', '2026-05-27', '2026-08-15',
  '2026-09-21', '2026-10-02', '2026-10-09', '2026-10-12', '2026-11-24',
  '2026-12-25',
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function LeavesPage() {
  const [leaves, setLeaves]       = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [holidays, setHolidays]   = useState<string[]>([])   // 'YYYY-MM-DD' list
  const [loading, setLoading]     = useState(true)
  const [tab, setTab]             = useState('ALL')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount]   = useState(0)
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 })

  const [formData, setFormData] = useState({
    employee_id: '', start_date: '', end_date: '', type: 'CASUAL', reason: ''
  })
  const [dateErrors, setDateErrors] = useState({ start_date: '', end_date: '' })

  // ── Fetch on mount ──────────────────────────────────────────────────────────
  useEffect(() => { fetchEmployees(); fetchHolidays() }, [])
  useEffect(() => { fetchLeaves() }, [tab, currentPage])

  const fetchHolidays = async () => {
    // Try to load from your DB first; fall back to hardcoded list
    const { data, error } = await supabase
      .from('holidays')
      .select('date')
    if (error || !data?.length) {
      setHolidays(FALLBACK_HOLIDAYS)
    } else {
      setHolidays(data.map((h: any) => h.date as string))
    }
  }

  const fetchEmployees = async () => {
    const { data } = await supabase
      .from('employees').select('id, firstName, lastName').eq('status', 'ACTIVE')
    if (data) setEmployees(data)
  }

  const fetchLeaves = async () => {
    setLoading(true)

    const { data: empData } = await supabase.from('employees').select('id, firstName, lastName')
    const empMap: Record<string, { firstName: string; lastName: string }> = {}
    ;(empData ?? []).forEach(e => { empMap[e.id] = { firstName: e.firstName, lastName: e.lastName } })

    const from = (currentPage - 1) * PAGE_SIZE
    const to   = from + PAGE_SIZE - 1

    let query = supabase
      .from('leaves')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)
    if (tab !== 'ALL') query = query.eq('status', tab)

    const { data, error, count } = await query
    if (error) { console.error('Leaves fetch error:', error); setLoading(false); return }

    setLeaves((data ?? []).map(l => ({ ...l, employees: empMap[l.employee_id] ?? null })))
    setTotalCount(count ?? 0)
    setLoading(false)

    // Stats (full table, not paginated)
    const { data: all } = await supabase.from('leaves').select('status')
    if (all) setStats({
      pending:  all.filter(l => l.status === 'PENDING').length,
      approved: all.filter(l => l.status === 'APPROVED').length,
      rejected: all.filter(l => l.status === 'REJECTED').length,
    })
  }

  // ── Date validation ─────────────────────────────────────────────────────────
  const holidaySet = useMemo(() => new Set(holidays), [holidays])
  const today = getTodayStr()

  const validateStartDate = (val: string): string => {
    if (!val) return ''
    if (val < today)               return 'Start date cannot be in the past.'
    if (isWeekend(val))            return 'Start date falls on a weekend.'
    if (holidaySet.has(val))       return 'Start date is a public holiday.'
    return ''
  }

  const validateEndDate = (val: string, start: string): string => {
    if (!val) return ''
    if (val < today)               return 'End date cannot be in the past.'
    if (start && val < start)      return 'End date cannot be before start date.'
    if (isWeekend(val))            return 'End date falls on a weekend.'
    if (holidaySet.has(val))       return 'End date is a public holiday.'
    return ''
  }

  const handleStartDateChange = (val: string) => {
    const err = validateStartDate(val)
    setDateErrors(prev => ({ ...prev, start_date: err }))

    // If end date is now invalid with new start, clear end error too
    const endErr = formData.end_date ? validateEndDate(formData.end_date, val) : ''
    setDateErrors(prev => ({ ...prev, start_date: err, end_date: endErr }))

    setFormData(prev => ({
      ...prev,
      start_date: val,
      // Reset end date if it's now before the new start
      end_date: formData.end_date && formData.end_date < val ? '' : prev.end_date
    }))
  }

  const handleEndDateChange = (val: string) => {
    const err = validateEndDate(val, formData.start_date)
    setDateErrors(prev => ({ ...prev, end_date: err }))
    setFormData(prev => ({ ...prev, end_date: val }))
  }

  // Working days count (excludes weekends + holidays)
  const workingDays = useMemo(
    () => calcWorkingDays(formData.start_date, formData.end_date, holidays),
    [formData.start_date, formData.end_date, holidays]
  )

  const isFormValid = () =>
    !dateErrors.start_date &&
    !dateErrors.end_date &&
    formData.start_date &&
    formData.end_date &&
    formData.employee_id &&
    workingDays > 0

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid()) return

    const newLeave = {
      id: crypto.randomUUID(),
      ...formData,
      working_days: workingDays,
      status: 'PENDING'
    }
    const { error } = await supabase.from('leaves').insert([newLeave])
    if (error) { alert(error.message); return }

    setIsModalOpen(false)
    setTab('ALL')
    setCurrentPage(1)
    fetchLeaves()
  }

  const handleAction = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    const { error } = await supabase.from('leaves').update({ status }).eq('id', id)
    if (error) { console.error(error); return }
    fetchLeaves()
  }

  const handleTabChange = (t: string) => { setTab(t); setCurrentPage(1) }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="page-content">

      {/* Header */}
      <div className="section-header">
        <div>
          <h1 className="page-title">Leave Management</h1>
          <p className="page-subtitle">Track and approve employee leave requests</p>
        </div>
        <button className="btn btn-primary" onClick={() => {
          setFormData({ employee_id: employees[0]?.id || '', start_date: '', end_date: '', type: 'CASUAL', reason: '' })
          setDateErrors({ start_date: '', end_date: '' })
          setIsModalOpen(true)
        }}>
          <Plus size={16} /> Apply Leave
        </button>
      </div>

      {/* Stats */}
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

      {/* Tabs */}
      <div className="tab-list" style={{ maxWidth: '400px' }}>
        {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(t => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => handleTabChange(t)}>{t}</button>
        ))}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? <div className="spinner" /> : (
          <>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Employee</th><th>Leave Type</th><th>Duration</th>
                    <th>Working Days</th><th>Reason</th><th>Status</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.map(leave => (
                    <tr key={leave.id}>
                      <td style={{ fontWeight: 600 }}>{leave.employees?.firstName} {leave.employees?.lastName}</td>
                      <td>
                        <span className="badge" style={{ background: 'var(--surface-3)', color: 'var(--text-primary)' }}>
                          {leave.type}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar size={14} color="var(--text-secondary)" />
                          {formatDate(leave.start_date)} – {formatDate(leave.end_date)}
                        </div>
                      </td>
                      <td style={{ fontSize: '13px', fontWeight: 600 }}>
                        {leave.working_days ?? '—'} {leave.working_days === 1 ? 'day' : 'days'}
                      </td>
                      <td style={{ maxWidth: '200px', fontSize: '13px', color: 'var(--text-secondary)' }}>{leave.reason}</td>
                      <td>
                        <span className={`badge ${
                          leave.status === 'APPROVED' ? 'badge-approved' :
                          leave.status === 'REJECTED' ? 'badge-rejected' : 'badge-pending'
                        }`}>{leave.status}</span>
                      </td>
                      <td>
                        {leave.status === 'PENDING' ? (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn btn-success btn-sm" onClick={() => handleAction(leave.id, 'APPROVED')}><Check size={14} /> Approve</button>
                            <button className="btn btn-danger btn-sm"  onClick={() => handleAction(leave.id, 'REJECTED')}><X size={14} /> Reject</button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Actioned</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {leaves.length === 0 && (
                    <tr><td colSpan={7} className="empty-state">No leave records found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderTop: '1px solid var(--border)', flexWrap: 'wrap', gap: '12px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, totalCount)} of {totalCount} records
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ChevronLeft size={15} /> Prev
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                    .reduce<(number | string)[]>((acc, p, idx, arr) => {
                      if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('…')
                      acc.push(p); return acc
                    }, [])
                    .map((p, idx) => p === '…'
                      ? <span key={`e${idx}`} style={{ padding: '0 4px', color: 'var(--text-muted)', fontSize: '13px' }}>…</span>
                      : <button key={p} onClick={() => setCurrentPage(p as number)} style={{
                          minWidth: '34px', height: '34px', borderRadius: '8px', border: '1px solid',
                          borderColor: currentPage === p ? 'var(--primary)' : 'var(--border)',
                          background: currentPage === p ? 'var(--primary)' : 'transparent',
                          color: currentPage === p ? '#fff' : 'var(--text-primary)',
                          fontSize: '13px', cursor: 'pointer', fontWeight: currentPage === p ? 600 : 400,
                          transition: 'all 0.15s ease'
                        }}>{p}</button>
                    )
                  }
                  <button className="btn btn-secondary btn-sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Next <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Modal ── */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Apply for Leave</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleApply}>
              {/* Employee */}
              <div className="form-group">
                <label className="form-label">Employee</label>
                <select className="select" required value={formData.employee_id} onChange={e => setFormData({ ...formData, employee_id: e.target.value })}>
                  <option value="">Select Employee</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
                </select>
              </div>

              {/* Dates */}
              <div className="grid-2">
                {/* Start Date */}
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input
                    type="date"
                    className={`input ${dateErrors.start_date ? 'input-error' : ''}`}
                    required
                    min={today}
                    value={formData.start_date}
                    onChange={e => handleStartDateChange(e.target.value)}
                    style={{ borderColor: dateErrors.start_date ? 'var(--danger, #ef4444)' : undefined }}
                  />
                  {dateErrors.start_date && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', color: 'var(--danger, #ef4444)', fontSize: '12px' }}>
                      <AlertCircle size={12} /> {dateErrors.start_date}
                    </div>
                  )}
                </div>

                {/* End Date */}
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input
                    type="date"
                    className={`input ${dateErrors.end_date ? 'input-error' : ''}`}
                    required
                    min={formData.start_date || today}
                    value={formData.end_date}
                    onChange={e => handleEndDateChange(e.target.value)}
                    disabled={!formData.start_date || !!dateErrors.start_date}
                    style={{ borderColor: dateErrors.end_date ? 'var(--danger, #ef4444)' : undefined }}
                  />
                  {dateErrors.end_date && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', color: 'var(--danger, #ef4444)', fontSize: '12px' }}>
                      <AlertCircle size={12} /> {dateErrors.end_date}
                    </div>
                  )}
                </div>
              </div>

              {/* Working Days Summary */}
              {formData.start_date && formData.end_date && !dateErrors.start_date && !dateErrors.end_date && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: workingDays > 0 ? 'var(--surface-2, rgba(99,102,241,0.08))' : 'rgba(239,68,68,0.08)',
                  border: `1px solid ${workingDays > 0 ? 'var(--primary, #6366f1)' : '#ef4444'}`,
                  marginBottom: '12px',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: workingDays > 0 ? 'var(--primary, #6366f1)' : '#ef4444'
                }}>
                  <Calendar size={14} />
                  {workingDays > 0
                    ? <><strong>{workingDays} working {workingDays === 1 ? 'day' : 'days'}</strong> — weekends &amp; holidays excluded</>
                    : <>No working days in selected range (all weekends/holidays)</>
                  }
                </div>
              )}

              {/* Leave Type */}
              <div className="form-group">
                <label className="form-label">Leave Type</label>
                <select className="select" required value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                  <option value="CASUAL">Casual Leave</option>
                  <option value="SICK">Sick Leave</option>
                  <option value="COMPENSATORY">Compensatory Off</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              {/* Reason */}
              <div className="form-group">
                <label className="form-label">Reason</label>
                <textarea className="textarea" required rows={3} value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })} />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1, justifyContent: 'center', opacity: isFormValid() ? 1 : 0.5, cursor: isFormValid() ? 'pointer' : 'not-allowed' }}
                  disabled={!isFormValid()}
                >
                  Submit Request
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}