'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, Plus, Edit2, Trash2, X, Users, MapPin } from 'lucide-react'

export default function BranchesPage() {
  const [branches, setBranches] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedBranch, setSelectedBranch] = useState<any>(null)
  
  // Form State
  const [formData, setFormData] = useState({
    id: '', name: '', location: '', manager_id: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const [branchRes, empRes] = await Promise.all([
      // Fix: use separate count query to avoid Supabase aggregate syntax issues
      supabase.from('branches').select('*, manager:manager_id(firstName, lastName)').order('created_at', { ascending: false }),
      supabase.from('employees').select('id, firstName, lastName, branch_id')
    ])
    if (branchRes.data) setBranches(branchRes.data)
    if (empRes.data) setEmployees(empRes.data)
    setLoading(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const { id, ...data } = formData
    
    // Fix foreign key issue with empty strings
    const payload = {
      ...data,
      manager_id: data.manager_id === '' ? null : data.manager_id
    }

    if (id) {
      const { error } = await supabase.from('branches').update(payload).eq('id', id)
      if (error) { alert('Error updating: ' + error.message); return }
    } else {
      const { error } = await supabase.from('branches').insert({ id: crypto.randomUUID(), ...payload })
      if (error) { alert('Error saving: ' + error.message); return }
    }
    setIsModalOpen(false)
    fetchData()
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this branch?')) {
      await supabase.from('branches').delete().eq('id', id)
      fetchData()
    }
  }

  const openModal = (branch?: any) => {
    if (branch) {
      setFormData({
        id: branch.id, name: branch.name, location: branch.location || '', manager_id: branch.manager_id || ''
      })
    } else {
      setFormData({ id: '', name: '', location: '', manager_id: '' })
    }
    setIsModalOpen(true)
  }

  const filtered = branches.filter(b => 
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    (b.location || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="page-content">
      <div className="section-header">
        <div>
          <h1 className="page-title">Branches</h1>
          <p className="page-subtitle">Total {branches.length} branches registered</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <Plus size={16} /> Add Branch
        </button>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="search-bar" style={{ maxWidth: '400px' }}>
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search branches..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="spinner" />
      ) : (
        <div className="stats-grid">
          {filtered.map(branch => (
            <div key={branch.id} className="card" style={{ display: 'flex', flexDirection: 'column', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="avatar" style={{ borderRadius: '8px' }}>
                    <MapPin size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700 }}>{branch.name}</h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                       {branch.location || 'Location not specified'}
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '20px', padding: '12px', background: 'var(--surface-2)', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 600 }}>Branch Manager</div>
                <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
                  {branch.manager ? `${branch.manager.firstName} ${branch.manager.lastName}` : 'Not Assigned'}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <Users size={16} /> {employees.filter(e => e.branch_id === branch.id).length} Employees
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => openModal(branch)} style={{ padding: '6px' }}>
                    <Edit2 size={14} />
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(branch.id)} style={{ padding: '6px' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="empty-state" style={{ gridColumn: '1 / -1' }}>No branches found.</div>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">{formData.id ? 'Edit Branch' : 'Add New Branch'}</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Branch Name</label>
                <input type="text" className="input" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Location</label>
                <input type="text" className="input" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Branch Manager (Optional)</label>
                {employees.length === 0 ? (
                  <div style={{ 
                    padding: '10px 14px', borderRadius: '8px', 
                    background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
                    fontSize: '13px', color: 'var(--accent)'
                  }}>
                    ⚠️ पहिले Branch save करा → मग Employees ऍड करा → नंतर Branch Edit करून Manager नेमा
                  </div>
                ) : (
                  <select className="select" value={formData.manager_id} onChange={e => setFormData({...formData, manager_id: e.target.value})}>
                    <option value="">— Assign Manager Later —</option>
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
                    ))}
                  </select>
                )}
              </div>


              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Save Branch</button>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
