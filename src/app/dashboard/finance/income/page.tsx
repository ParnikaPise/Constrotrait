'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, Plus, Edit2, Trash2, X, TrendingUp, DollarSign } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function IncomePage() {
  const [incomes, setIncomes] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const [formData, setFormData] = useState({
    id: '', date: new Date().toISOString().split('T')[0], amount: 0, description: '',
    category: 'SERVICE_FEE', payment_method: 'ONLINE', status: 'RECEIVED', client_id: '',
    is_on_hold: false
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const [incRes, cliRes] = await Promise.all([
      supabase.from('income').select('*, clients(name)').order('date', { ascending: false }),
      supabase.from('clients').select('id, name')
    ])
    if (incRes.data) setIncomes(incRes.data)
    if (cliRes.data) setClients(cliRes.data)
    setLoading(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const { id, ...data } = formData
    if (id) {
      await supabase.from('income').update(data).eq('id', id)
    } else {
      const { error } = await supabase.from('income').insert({ id: crypto.randomUUID(), ...data }); if (error) { alert('Error: ' + error.message); return }
    }
    setIsModalOpen(false)
    fetchData()
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this record?')) {
      await supabase.from('income').delete().eq('id', id)
      fetchData()
    }
  }

  const openModal = (inc?: any) => {
    if (inc) {
      setFormData({
        id: inc.id, date: inc.date, amount: inc.amount, description: inc.description || '',
        category: inc.category || 'SERVICE_FEE', payment_method: inc.payment_method || 'ONLINE',
        status: inc.status, client_id: inc.client_id || '', is_on_hold: inc.is_on_hold
      })
    } else {
      setFormData({
        id: '', date: new Date().toISOString().split('T')[0], amount: 0, description: '',
        category: 'SERVICE_FEE', payment_method: 'ONLINE', status: 'RECEIVED', client_id: '',
        is_on_hold: false
      })
    }
    setIsModalOpen(true)
  }

  const filtered = incomes.filter(i => 
    (i.description || '').toLowerCase().includes(search.toLowerCase()) ||
    (i.clients?.name || '').toLowerCase().includes(search.toLowerCase())
  )

  const stats = {
    received: incomes.filter(i => i.status === 'RECEIVED' || i.status === 'PAID').reduce((s, i) => s + i.amount, 0),
    pending: incomes.filter(i => i.status === 'PENDING').reduce((s, i) => s + i.amount, 0),
    expected: incomes.filter(i => i.status === 'EXPECTED').reduce((s, i) => s + i.amount, 0),
  }

  return (
    <div className="page-content">
      <div className="section-header">
        <div>
          <h1 className="page-title">Income Management</h1>
          <p className="page-subtitle">Track and manage all revenue streams</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <Plus size={16} /> Record Income
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon green"><TrendingUp size={22} /></div>
          <div><div className="stat-value">{formatCurrency(stats.received)}</div><div className="stat-label">Total Received</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon amber"><DollarSign size={22} /></div>
          <div><div className="stat-value">{formatCurrency(stats.pending)}</div><div className="stat-label">Total Pending</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><DollarSign size={22} /></div>
          <div><div className="stat-value">{formatCurrency(stats.expected)}</div><div className="stat-label">Expected</div></div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="search-bar" style={{ maxWidth: '400px' }}>
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search income records..." 
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
                  <th>Client / Description</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(inc => (
                  <tr key={inc.id}>
                    <td>{formatDate(inc.date)}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{inc.clients?.name || 'No Client Linked'}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{inc.description}</div>
                    </td>
                    <td>
                      <span className="badge" style={{ background: 'var(--surface-3)', color: 'var(--text-primary)' }}>
                        {inc.category.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="income-text" style={{ fontWeight: 700 }}>
                      {formatCurrency(inc.amount)}
                    </td>
                    <td>
                      <span className={`badge ${
                        inc.status === 'RECEIVED' || inc.status === 'PAID' ? 'badge-active' : 
                        inc.status === 'PENDING' ? 'badge-pending' : 
                        inc.status === 'OVERDUE' ? 'badge-inactive' : 'badge-approved'
                      }`}>
                        {inc.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openModal(inc)} style={{ padding: '6px' }}>
                          <Edit2 size={14} />
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(inc.id)} style={{ padding: '6px' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="empty-state">No income records found.</td>
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
              <h3 className="modal-title">{formData.id ? 'Edit Income' : 'Record Income'}</h3>
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
                <label className="form-label">Client</label>
                <select className="select" value={formData.client_id} onChange={e => setFormData({...formData, client_id: e.target.value})}>
                  <option value="">Select Client (Optional)</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <input type="text" className="input" required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="select" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    <option value="SERVICE_FEE">Service Fee</option>
                    <option value="RETAINER">Retainer</option>
                    <option value="CAMPAIGN">Campaign</option>
                    <option value="CONSULTING">Consulting</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Payment Method</label>
                  <select className="select" value={formData.payment_method} onChange={e => setFormData({...formData, payment_method: e.target.value})}>
                    <option value="ONLINE">Online / Bank Transfer</option>
                    <option value="CASH">Cash</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="select" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                  <option value="RECEIVED">Received</option>
                  <option value="PENDING">Pending</option>
                  <option value="EXPECTED">Expected</option>
                  <option value="OVERDUE">Overdue</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Save Record</button>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
