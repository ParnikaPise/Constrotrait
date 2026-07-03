'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Project } from '@/types/index'
import {
  Briefcase, Plus, Edit2, Trash2, X, Calendar,
  AlertTriangle, CheckCircle, Clock, PauseCircle, Search,
  Flag, Layers
} from 'lucide-react'

type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'SUSPENDED'
type ProjectPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

const STATUS_CONFIG: Record<ProjectStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  PLANNING: { label: 'Planning', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', icon: <Clock size={12} /> },
  ACTIVE: { label: 'Active', color: '#34d399', bg: 'rgba(52,211,153,0.12)', icon: <CheckCircle size={12} /> },
  COMPLETED: { label: 'Completed', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', icon: <CheckCircle size={12} /> },
  SUSPENDED: { label: 'Suspended', color: '#f87171', bg: 'rgba(248,113,113,0.12)', icon: <PauseCircle size={12} /> },
}

const PRIORITY_CONFIG: Record<ProjectPriority, { label: string; color: string; bg: string }> = {
  LOW: { label: 'Low', color: '#6ee7b7', bg: 'rgba(110,231,183,0.1)' },
  MEDIUM: { label: 'Medium', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
  HIGH: { label: 'High', color: '#fb923c', bg: 'rgba(251,146,60,0.1)' },
  CRITICAL: { label: 'Critical', color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
}

const emptyForm = {
  name: '', description: '', status: 'PLANNING' as ProjectStatus,
  priority: 'MEDIUM' as ProjectPriority, start_date: '', deadline: '',
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('ALL')
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { fetchProjects() }, [])

  const fetchProjects = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
    setProjects(data || [])
    setLoading(false)
  }

  const openAdd = () => {
    setEditing(null)
    setForm(emptyForm)
    setError('')
    setShowModal(true)
  }

  const openEdit = (p: Project) => {
    setEditing(p)
    setForm({
      name: p.name,
      description: p.description || '',
      status: p.status,
      priority: p.priority,
      start_date: p.start_date || '',
      deadline: p.deadline || '',
    })
    setError('')
    setShowModal(true)
  }

  const openDelete = (p: Project) => {
    setDeleteTarget(p)
    setShowDeleteModal(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Project name is required.'); return }
    setSaving(true)
    setError('')
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      status: form.status,
      priority: form.priority,
      start_date: form.start_date || null,
      deadline: form.deadline || null,
    }
    if (editing) {
      const { error: e } = await supabase.from('projects').update(payload).eq('id', editing.id)
      if (e) { setError(e.message); setSaving(false); return }
    } else {
      const { error: e } = await supabase.from('projects').insert(payload)
      if (e) { setError(e.message); setSaving(false); return }
    }
    setSaving(false)
    setShowModal(false)
    fetchProjects()
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await supabase.from('projects').delete().eq('id', deleteTarget.id)
    setShowDeleteModal(false)
    setDeleteTarget(null)
    fetchProjects()
  }

  const filtered = projects.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'ALL' || p.status === filterStatus
    return matchSearch && matchStatus
  })

  const stats = {
    total: projects.length,
    active: projects.filter(p => p.status === 'ACTIVE').length,
    completed: projects.filter(p => p.status === 'COMPLETED').length,
    planning: projects.filter(p => p.status === 'PLANNING').length,
  }

  const formatDate = (d?: string) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const isOverdue = (deadline?: string, status?: ProjectStatus) => {
    if (!deadline) return false
    if (status === 'COMPLETED') return false
    return new Date(deadline) < new Date()
  }

  return (
    <div className="page-content">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Briefcase size={26} color="var(--primary-light)" />
            Projects
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Manage and track all your construction projects
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> New Project
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        {[
          { label: 'Total Projects', value: stats.total, color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', icon: <Layers size={22} /> },
          { label: 'Active', value: stats.active, color: '#34d399', bg: 'rgba(52,211,153,0.12)', icon: <CheckCircle size={22} /> },
          { label: 'Completed', value: stats.completed, color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', icon: <CheckCircle size={22} /> },
          { label: 'Planning', value: stats.planning, color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', icon: <Clock size={22} /> },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>
              {s.icon}
            </div>
            <div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            className="input"
            style={{ paddingLeft: '36px', width: '100%' }}
            placeholder="Search projects..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ minWidth: '160px' }}>
          <option value="ALL">All Statuses</option>
          <option value="PLANNING">Planning</option>
          <option value="ACTIVE">Active</option>
          <option value="COMPLETED">Completed</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div className="spinner" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Briefcase size={48} color="var(--text-muted)" />
          <h3>No Projects Found</h3>
          <p>{search || filterStatus !== 'ALL' ? 'Try adjusting your filters.' : 'Create your first project to get started.'}</p>
          {!search && filterStatus === 'ALL' && (
            <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> New Project</button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
          {filtered.map(project => {
            const sc = STATUS_CONFIG[project.status]
            const pc = PRIORITY_CONFIG[project.priority]
            const overdue = isOverdue(project.deadline, project.status)
            return (
              <div key={project.id} style={{
                background: 'var(--surface)',
                border: `1px solid ${overdue ? 'rgba(248,113,113,0.4)' : 'var(--border)'}`,
                borderRadius: '16px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                transition: 'all 0.2s',
                position: 'relative',
                overflow: 'hidden',
              }}>
                {/* Accent bar top */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(90deg, ${pc.color}, transparent)` }} />

                {/* Top Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px', lineHeight: '1.3' }}>
                      {project.name}
                    </h3>
                    {overdue && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f87171', fontSize: '11px', fontWeight: '600' }}>
                        <AlertTriangle size={11} /> OVERDUE
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <button
                      onClick={() => openEdit(project)}
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}
                      title="Edit"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => openDelete(project)}
                      style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#f87171', display: 'flex', alignItems: 'center' }}
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Badges */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: sc.bg, color: sc.color, border: `1px solid ${sc.color}30` }}>
                    {sc.icon} {sc.label}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: pc.bg, color: pc.color, border: `1px solid ${pc.color}30` }}>
                    <Flag size={10} /> {pc.label}
                  </span>
                </div>

                {/* Description */}
                {project.description && (
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as React.CSSProperties}>
                    {project.description}
                  </p>
                )}

                {/* Dates */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px', fontWeight: '600' }}>Start Date</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={11} color="var(--text-muted)" />
                      {formatDate(project.start_date)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px', fontWeight: '600' }}>Deadline</div>
                    <div style={{ fontSize: '12px', color: overdue ? '#f87171' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: overdue ? '600' : '400' }}>
                      <Calendar size={11} color={overdue ? '#f87171' : 'var(--text-muted)'} />
                      {formatDate(project.deadline)}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: '560px', width: '100%' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editing ? 'Edit Project' : 'New Project'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px', display: 'flex' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {error && (
                <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', fontSize: '13px' }}>
                  {error}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Project Name *</label>
                <input
                  className="input"
                  placeholder="Enter project name"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="textarea"
                  placeholder="Project description..."
                  rows={3}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as ProjectStatus }))}>
                    <option value="PLANNING">Planning</option>
                    <option value="ACTIVE">Active</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="select" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as ProjectPriority }))}>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input className="input" type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Deadline</label>
                  <input className="input" type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  {saving
                    ? <><div className="spinner" style={{ width: '14px', height: '14px' }} /> Saving...</>
                    : editing ? 'Update Project' : 'Create Project'
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && deleteTarget && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal" style={{ maxWidth: '420px', width: '100%' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ color: '#f87171' }}>Delete Project</h2>
              <button onClick={() => setShowDeleteModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <AlertTriangle size={20} color="#f87171" />
                </div>
                <div>
                  <p style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>
                    Are you sure you want to delete <strong>"{deleteTarget.name}"</strong>?
                  </p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                    This action cannot be undone. Associated tasks may be affected.
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                <button className="btn btn-danger" onClick={handleDelete}>Delete Project</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
