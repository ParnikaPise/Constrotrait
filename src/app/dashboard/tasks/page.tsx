'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, X, Calendar, AlertCircle, Edit2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const [formData, setFormData] = useState({
    id: '', title: '', description: '', status: 'TO_DO', priority: 'MEDIUM',
    deadline: '', assignee_ids: [] as string[], project_id: '', progress: 0
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const [taskRes, projRes, empRes] = await Promise.all([
      supabase.from('tasks').select('*').order('created_at', { ascending: false }),
      supabase.from('projects').select('id, name'),
      supabase.from('employees').select('id, firstName, lastName').eq('status', 'ACTIVE')
    ])
    if (taskRes.data) setTasks(taskRes.data)
    if (projRes.data) setProjects(projRes.data)
    if (empRes.data) setEmployees(empRes.data)
    setLoading(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const { id, ...data } = formData
    
    // Fix foreign keys
    const payload = {
      ...data,
      project_id: data.project_id === '' ? null : data.project_id
    }

    if (id) {
      await supabase.from('tasks').update(payload).eq('id', id)
    } else {
      const { error: insertErr } = await supabase.from('tasks').insert({ id: crypto.randomUUID(), ...payload }); if (insertErr) { alert('Error: ' + insertErr.message); return }
    }
    setIsModalOpen(false)
    fetchData()
  }

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId)
    fetchData()
  }

  const openModal = (task?: any) => {
    if (task) {
      setFormData({
        id: task.id, title: task.title, description: task.description || '', status: task.status,
        priority: task.priority, deadline: task.deadline || '', assignee_ids: task.assignee_ids || [],
        project_id: task.project_id || '', progress: task.progress || 0
      })
    } else {
      setFormData({
        id: '', title: '', description: '', status: 'TO_DO', priority: 'MEDIUM',
        deadline: new Date().toISOString().split('T')[0], assignee_ids: [], project_id: '', progress: 0
      })
    }
    setIsModalOpen(true)
  }

  const toggleAssignee = (empId: string) => {
    setFormData(prev => ({
      ...prev,
      assignee_ids: prev.assignee_ids.includes(empId)
        ? prev.assignee_ids.filter(id => id !== empId)
        : [...prev.assignee_ids, empId]
    }))
  }

  const COLUMNS = ['TO_DO', 'IN_PROGRESS', 'UNDER_REVIEW', 'COMPLETED']

  return (
    <div className="page-content">
      <div className="section-header">
        <div>
          <h1 className="page-title">Task Management</h1>
          <p className="page-subtitle">Track project tasks and team deliverables</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <Plus size={16} /> Create Task
        </button>
      </div>

      {loading ? (
        <div className="spinner" />
      ) : (
        <div className="kanban-board">
          {COLUMNS.map(col => {
            const colTasks = tasks.filter(t => t.status === col)
            return (
              <div key={col} className="kanban-col">
                <div className="kanban-col-header">
                  {col.replace('_', ' ')}
                  <span className="kanban-count">{colTasks.length}</span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {colTasks.map(task => (
                    <div key={task.id} className="kanban-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <span className={`badge ${
                          task.priority === 'CRITICAL' ? 'badge-inactive' :
                          task.priority === 'HIGH' ? 'badge-pending' :
                          task.priority === 'MEDIUM' ? 'badge-approved' : 'badge-active'
                        }`} style={{ fontSize: '9px', padding: '2px 6px' }}>
                          {task.priority}
                        </span>
                        <button className="btn btn-secondary btn-sm" onClick={() => openModal(task)} style={{ padding: '2px', border: 'none', background: 'transparent' }}>
                          <Edit2 size={12} color="var(--text-secondary)" />
                        </button>
                      </div>
                      
                      <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px', lineHeight: 1.3 }}>
                        {task.title}
                      </h4>
                      
                      {task.deadline && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                          <Calendar size={10} /> {formatDate(task.deadline)}
                        </div>
                      )}
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <div style={{ flex: 1, height: '6px', background: 'var(--surface-3)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${task.progress || 0}%`, height: '100%', background: 'var(--primary)', borderRadius: '3px' }} />
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-secondary)' }}>{task.progress || 0}%</span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                        <div style={{ display: 'flex' }}>
                          {(task.assignee_ids || []).slice(0, 3).map((id: string, index: number) => {
                            const emp = employees.find(e => e.id === id)
                            if (!emp) return null
                            return (
                              <div key={id} className="avatar" style={{ 
                                width: 24, height: 24, fontSize: 10, 
                                marginLeft: index > 0 ? -8 : 0, 
                                border: '2px solid var(--surface)' 
                              }} title={`${emp.firstName} ${emp.lastName}`}>
                                {emp.firstName[0]}{emp.lastName[0]}
                              </div>
                            )
                          })}
                          {(task.assignee_ids || []).length > 3 && (
                            <div className="avatar" style={{ width: 24, height: 24, fontSize: 10, marginLeft: -8, border: '2px solid var(--surface)', background: 'var(--surface-3)' }}>
                              +{(task.assignee_ids || []).length - 3}
                            </div>
                          )}
                        </div>
                        
                        <select 
                          className="select" 
                          style={{ padding: '2px 6px', fontSize: '11px', width: 'auto', height: '24px', background: 'transparent', border: 'none', color: 'var(--text-secondary)' }}
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value)}
                        >
                          {COLUMNS.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
                        </select>
                      </div>
                    </div>
                  ))}
                  {colTasks.length === 0 && (
                    <div className="empty-state" style={{ padding: '20px' }}>No tasks.</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">{formData.id ? 'Edit Task' : 'Create Task'}</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Task Title</label>
                <input type="text" className="input" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="textarea" rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="select" required value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                    {COLUMNS.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="select" required value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Deadline</label>
                  <input type="date" className="input" required value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Project (Optional)</label>
                  <select className="select" value={formData.project_id} onChange={e => setFormData({...formData, project_id: e.target.value})}>
                    <option value="">Select Project</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  Progress <span>{formData.progress}%</span>
                </label>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={formData.progress} 
                  onChange={e => setFormData({...formData, progress: parseInt(e.target.value)})} 
                  style={{ width: '100%', accentColor: 'var(--primary)' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Assignees</label>
                <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {employees.map(emp => (
                    <label key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={formData.assignee_ids.includes(emp.id)}
                        onChange={() => toggleAssignee(emp.id)}
                      />
                      <div className="avatar" style={{ width: 20, height: 20, fontSize: 9 }}>{emp.firstName[0]}{emp.lastName[0]}</div>
                      {emp.firstName} {emp.lastName}
                    </label>
                  ))}
                  {employees.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>No active employees found.</div>}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Save Task</button>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
