'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Edit2, Trash2, X, BookOpen, ShieldAlert, FileText, FlaskConical, Users } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function RulebookPage() {
  const [rules, setRules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [viewRule, setViewRule] = useState<any>(null)
  
  const [formData, setFormData] = useState({
    id: '', title: '', content: '', category: 'Company Policy'
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const { data } = await supabase.from('rules').select('*').order('created_at', { ascending: false })
    if (data) setRules(data)
    setLoading(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const { id, ...data } = formData
    if (id) {
      await supabase.from('rules').update(data).eq('id', id)
    } else {
      const { error } = await supabase.from('rules').insert({ id: crypto.randomUUID(), ...data }); if (error) { alert('Error: ' + error.message); return }
    }
    setIsModalOpen(false)
    fetchData()
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this policy?')) {
      await supabase.from('rules').delete().eq('id', id)
      if (viewRule?.id === id) setViewRule(null)
      fetchData()
    }
  }

  const openModal = (rule?: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (rule) {
      setFormData({ id: rule.id, title: rule.title, content: rule.content, category: rule.category })
    } else {
      setFormData({ id: '', title: '', content: '', category: 'Company Policy' })
    }
    setIsModalOpen(true)
  }

  const filtered = categoryFilter === 'ALL' ? rules : rules.filter(r => r.category === categoryFilter)

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'HR': return <Users size={16} color="var(--primary-light)" />
      case 'SAFETY': return <ShieldAlert size={16} color="var(--accent-red)" />
      case 'LAB': return <FlaskConical size={16} color="var(--accent-green)" />
      default: return <FileText size={16} color="var(--text-secondary)" />
    }
  }

  return (
    <div className="page-content">
      <div className="section-header">
        <div>
          <h1 className="page-title">Rulebook & Policies</h1>
          <p className="page-subtitle">Company guidelines, procedures, and manuals</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <Plus size={16} /> Add Policy
        </button>
      </div>

      <div className="tab-list" style={{ maxWidth: '100%', flexWrap: 'wrap' }}>
        {['ALL', 'Company Policy', 'Work Rule', 'Attendance Policy', 'HR Guideline', 'Department Procedure'].map(cat => (
          <button 
            key={cat} 
            className={`tab ${categoryFilter === cat ? 'active' : ''}`}
            onClick={() => setCategoryFilter(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="spinner" />
      ) : (
        <div className="grid-3">
          {filtered.map(rule => (
            <div key={rule.id} className="card" onClick={() => setViewRule(rule)} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <span className="badge" style={{ background: 'var(--surface-3)', color: 'var(--text-primary)', display: 'flex', gap: '4px', alignItems: 'center' }}>
                  {rule.category}
                </span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button className="btn btn-secondary btn-sm" onClick={(e) => openModal(rule, e)} style={{ padding: '4px' }}>
                    <Edit2 size={12} />
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={(e) => handleDelete(rule.id, e)} style={{ padding: '4px' }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
              
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', lineHeight: 1.3 }}>{rule.title}</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {rule.content}
              </p>
              
              <div style={{ marginTop: 'auto', fontSize: '11px', color: 'var(--text-muted)', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                Added on {formatDate(rule.created_at)}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
              <BookOpen size={48} />
              <p>No policies found in this category.</p>
            </div>
          )}
        </div>
      )}

      {/* View Rule Modal */}
      {viewRule && (
        <div className="modal-overlay" onClick={() => setViewRule(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <span className="badge" style={{ background: 'var(--surface-3)', color: 'var(--primary-light)' }}>
                  {viewRule.category}
                </span>
                <h3 className="modal-title" style={{ margin: 0 }}>{viewRule.title}</h3>
              </div>
              <button onClick={() => setViewRule(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ 
              background: 'var(--surface-2)', 
              padding: '24px', 
              borderRadius: '12px',
              fontSize: '14px',
              lineHeight: 1.6,
              color: 'var(--text-primary)',
              whiteSpace: 'pre-wrap',
              maxHeight: '60vh',
              overflowY: 'auto'
            }}>
              {viewRule.content}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Added on {formatDate(viewRule.created_at)}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-secondary" onClick={() => { setViewRule(null); openModal(viewRule); }}>
                  <Edit2 size={16} /> Edit
                </button>
                <button className="btn btn-danger" onClick={(e) => handleDelete(viewRule.id, e)}>
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">{formData.id ? 'Edit Policy' : 'Add Policy'}</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Policy Title</label>
                <input type="text" className="input" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="select" required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                  <option value="Company Policy">Company Policy</option>
                  <option value="Work Rule">Work Rule</option>
                  <option value="Attendance Policy">Attendance Policy</option>
                  <option value="HR Guideline">HR Guideline</option>
                  <option value="Department Procedure">Department Procedure</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Policy Content</label>
                <textarea 
                  className="textarea" 
                  required 
                  rows={8}
                  value={formData.content} 
                  onChange={e => setFormData({...formData, content: e.target.value})} 
                  placeholder="Enter the full policy details here..."
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Save Policy</button>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
// Note: Users icon is imported at the top, need to add to lucide-react import list.
