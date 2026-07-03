'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, Plus, Edit2, Trash2, X, TrendingDown, MapPin } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const [formData, setFormData] = useState({
    id: '', date: new Date().toISOString().split('T')[0], amount: 0, description: '',
    category: 'OFFICE_SUPPLIES', payment_method: 'ONLINE', branch_id: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const [expRes, branchRes] = await Promise.all([
      supabase.from('expenses').select('*, branches(name)').order('date', { ascending: false }),
      supabase.from('branches').select('id, name')
    ])
    if (expRes.data) setExpenses(expRes.data)
    if (branchRes.data) setBranches(branchRes.data)
    setLoading(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const { id, ...data } = formData
    if (id) {
      await supabase.from('expenses').update(data).eq('id', id)
    } else {
      const { error } = await supabase.from('expenses').insert({ id: crypto.randomUUID(), ...data }); if (error) { alert('Error: ' + error.message); return }
    }
    setIsModalOpen(false)
    fetchData()
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this record?')) {
      await supabase.from('expenses').delete().eq('id', id)
      fetchData()
    }
  }

  const openModal = (exp?: any) => {
    if (exp) {
      setFormData({
        id: exp.id, date: exp.date, amount: exp.amount, description: exp.description || '',
        category: exp.category || 'OFFICE_SUPPLIES', payment_method: exp.payment_method || 'ONLINE',
        branch_id: exp.branch_id || ''
      })
    } else {
      setFormData({
        id: '', date: new Date().toISOString().split('T')[0], amount: 0, description: '',
        category: 'OFFICE_SUPPLIES', payment_method: 'ONLINE', branch_id: branches[0]?.id || ''
      })
    }
    setIsModalOpen(true)
  }

  const filtered = expenses.filter(e => 
    (e.description || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.category || '').toLowerCase().includes(search.toLowerCase())
  )

  const thisMonthExpenses = expenses.filter(e => e.date.startsWith(new Date().toISOString().slice(0, 7))).reduce((s, e) => s + e.amount, 0)
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)

  return (
    <div className="page-content">
      <div className="section-header">
        <div>
          <h1 className="page-title">Expense Management</h1>
          <p className="page-subtitle">Track company expenditures and overheads</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <Plus size={16} /> Add Expense
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon red"><TrendingDown size={22} /></div>
          <div><div className="stat-value">{formatCurrency(thisMonthExpenses)}</div><div className="stat-label">This Month</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><TrendingDown size={22} /></div>
          <div><div className="stat-value">{formatCurrency(totalExpenses)}</div><div className="stat-label">Total All Time</div></div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="search-bar" style={{ maxWidth: '400px' }}>
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search expenses by description..." 
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
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Branch</th>
                  <th>Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(exp => (
                  <tr key={exp.id}>
                    <td>{formatDate(exp.date)}</td>
                    <td style={{ fontWeight: 500 }}>{exp.description}</td>
                    <td>
                      <span className="badge" style={{ background: 'var(--surface-3)', color: 'var(--text-primary)' }}>
                        {exp.category.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {exp.branches?.name ? <><MapPin size={12} style={{marginRight: 4}}/>{exp.branches.name}</> : 'HQ / General'}
                    </td>
                    <td className="expense-text" style={{ fontWeight: 700 }}>
                      {formatCurrency(exp.amount)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openModal(exp)} style={{ padding: '6px' }}>
                          <Edit2 size={14} />
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(exp.id)} style={{ padding: '6px' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="empty-state">No expense records found.</td>
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
              <h3 className="modal-title">{formData.id ? 'Edit Expense' : 'Add Expense'}</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSave}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input type="date" className="input" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Amount (₹)</label>
                  <input type="number" className="input" required value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <input type="text" className="input" required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="select" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    <option value="OFFICE_SUPPLIES">Office Supplies</option>
                    <option value="RENT">Rent</option>
                    <option value="UTILITIES">Utilities</option>
                    <option value="SALARY">Salary</option>
                    <option value="TRAVEL">Travel</option>
                    <option value="MARKETING">Marketing</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Payment Method</label>
                  <select className="select" value={formData.payment_method} onChange={e => setFormData({...formData, payment_method: e.target.value})}>
                    <option value="ONLINE">Online / Bank Transfer</option>
                    <option value="CASH">Cash</option>
                    <option value="CREDIT_CARD">Credit Card</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Branch (Optional)</label>
                <select className="select" value={formData.branch_id} onChange={e => setFormData({...formData, branch_id: e.target.value})}>
                  <option value="">HQ / General (No specific branch)</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Save Expense</button>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
