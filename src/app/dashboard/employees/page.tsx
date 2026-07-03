'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, Plus, Edit2, Trash2, X, Briefcase, Mail, MapPin } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Form State
  const [formData, setFormData] = useState({
    id: '', firstName: '', lastName: '', email: '',
    role_id: 'ENGINEER', designation: '', department: '',
    branch_id: '', base_salary: 0, joining_date: new Date().toISOString().split('T')[0],
    contact_information: '', status: 'ACTIVE'
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const [empRes, branchRes] = await Promise.all([
      // Use !branch_id to specify which FK to use (avoids PGRST201 ambiguity error)
      supabase.from('employees').select('*, branches!branch_id(name)').order('created_at', { ascending: false }),
      supabase.from('branches').select('id, name')
    ])
    if (empRes.data) setEmployees(empRes.data)
    if (branchRes.data) setBranches(branchRes.data)
    setLoading(false)
  }



  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const { id, ...data } = formData
    
    const payload = {
      ...data,
      branch_id: data.branch_id === '' ? null : data.branch_id
    }

    if (id) {
      // UPDATE existing
      const { error } = await supabase.from('employees').update(payload).eq('id', id)
      if (error) { alert('Error updating: ' + error.message); return }
    } else {
      // INSERT new — DB will auto-generate UUID via gen_random_uuid() default
      const { error } = await supabase.from('employees').insert(payload)
      if (error) { alert('Error saving: ' + error.message); return }
    }
    setIsModalOpen(false)
    fetchData()
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this employee?')) {
      await supabase.from('employees').delete().eq('id', id)
      fetchData()
    }
  }

  const openModal = (emp?: any) => {
    if (emp) {
      setFormData({
        id: emp.id, firstName: emp.firstName, lastName: emp.lastName, email: emp.email,
        role_id: emp.role_id, designation: emp.designation || '', department: emp.department || '',
        branch_id: emp.branch_id || '', base_salary: emp.base_salary, joining_date: emp.joining_date || '',
        contact_information: emp.contact_information || '', status: emp.status
      })
    } else {
      setFormData({
        id: '', firstName: '', lastName: '', email: '',
        role_id: 'ENGINEER', designation: '', department: '',
        branch_id: branches[0]?.id || '', base_salary: 0, joining_date: new Date().toISOString().split('T')[0],
        contact_information: '', status: 'ACTIVE'
      })
    }
    setIsModalOpen(true)
  }

  const filtered = employees.filter(e => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      ((e.firstName || '') + ' ' + (e.lastName || '')).toLowerCase().includes(q) ||
      (e.email || '').toLowerCase().includes(q) ||
      (e.role_id || '').toLowerCase().includes(q)
    )
  })


  return (
    <div className="page-content">
      <div className="section-header">
        <div>
          <h1 className="page-title">Employees Management</h1>
          <p className="page-subtitle">Total {employees.length} employees registered</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <Plus size={16} /> Add Employee
        </button>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="search-bar" style={{ maxWidth: '400px' }}>
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search by name, email or role..." 
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
                  <th>Employee</th>
                  <th>Role & Branch</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th>Salary</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(emp => (
                  <tr key={emp.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="avatar">{(emp.firstName || '?')[0]}{(emp.lastName || '?')[0]}</div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{emp.firstName} {emp.lastName}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{emp.designation}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge" style={{ background: 'var(--surface-3)', color: 'var(--primary-light)', marginBottom: '4px' }}>
                        {(emp.role_id || '').replace('_', ' ')}
                      </span>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={12} /> {emp.branches?.name || 'Unassigned'}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '13px' }}><Mail size={12} style={{ marginRight: 4, verticalAlign: 'middle' }}/> {emp.email}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{emp.contact_information}</div>
                    </td>
                    <td>
                      <span className={`badge ${emp.status === 'ACTIVE' ? 'badge-active' : 'badge-inactive'}`}>
                        {emp.status}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(emp.base_salary)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openModal(emp)} style={{ padding: '6px' }}>
                          <Edit2 size={14} />
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(emp.id)} style={{ padding: '6px' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="empty-state">No employees found.</td>
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
              <h3 className="modal-title">{formData.id ? 'Edit Employee' : 'Add New Employee'}</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSave}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input type="text" className="input" required value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input type="text" className="input" required value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="input" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select className="select" required value={formData.role_id} onChange={e => setFormData({...formData, role_id: e.target.value})}>
                    {['SUPER_ADMIN', 'BRANCH_ADMIN', 'HR', 'ACCOUNTANT', 'QUALITY_MANAGER', 'TECHNICAL_MANAGER', 'ENGINEER', 'LAB_ASSISTANT', 'ADMIN_STAFF', 'HELPER', 'DRIVER', 'SAMPLER'].map(r => (
                      <option key={r} value={r}>{r.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Designation</label>
                  <input type="text" className="input" value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Branch</label>
                  <select className="select" value={formData.branch_id} onChange={e => setFormData({...formData, branch_id: e.target.value})}>
                    <option value="">Select Branch</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Base Salary (₹)</label>
                  <input type="number" className="input" required value={formData.base_salary} onChange={e => setFormData({...formData, base_salary: Number(e.target.value)})} />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Joining Date</label>
                  <input type="date" className="input" value={formData.joining_date} onChange={e => setFormData({...formData, joining_date: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="select" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Contact Information</label>
                <input type="text" className="input" placeholder="Phone number" value={formData.contact_information} onChange={e => setFormData({...formData, contact_information: e.target.value})} />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Save Employee</button>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
