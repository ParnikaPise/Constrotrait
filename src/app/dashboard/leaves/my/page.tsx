'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { formatDate } from '@/lib/utils'
import {
  Calendar,
  Clock,
  CheckCircle,
  Activity,
  ChevronRight,
  Heart,
  Briefcase,
  AlertCircle,
  Send,
  MoreVertical,
  Check
} from 'lucide-react'

const LEAVE_TYPES = [
  {
    id: 'CASUAL',
    name: 'CASUAL',
    label: 'Casual Leave',
    description: 'For personal work or short breaks',
    icon: Calendar,
    color: 'rgba(99,102,241,0.15)',
    textColor: '#818cf8',
    borderColor: 'rgba(99,102,241,0.3)'
  },
  {
    id: 'SICK',
    name: 'SICK',
    label: 'Sick Leave',
    description: 'For medical or health issues',
    icon: Heart,
    color: 'rgba(245,158,11,0.15)',
    textColor: '#fbbf24',
    borderColor: 'rgba(245,158,11,0.3)'
  },
  {
    id: 'UNPAID',
    name: 'UNPAID',
    label: 'Unpaid Leave',
    description: 'Without pay or long duration',
    icon: Briefcase,
    color: 'rgba(59,130,246,0.15)',
    textColor: '#60a5fa',
    borderColor: 'rgba(59,130,246,0.3)'
  }
]

export default function MyLeavesPage() {
  const { currentUser, loading: userLoading } = useCurrentUser()
  const [leaves, setLeaves] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('ALL')
  
  const [formData, setFormData] = useState({
    type: 'CASUAL',
    start_date: '',
    end_date: '',
    reason: ''
  })

  useEffect(() => {
    if (currentUser) fetchData()
  }, [currentUser])

  const fetchData = async () => {
    if (!currentUser) return
    setLoading(true)
    const { data } = await supabase
      .from('leaves')
      .select('*')
      .eq('employee_id', currentUser.id)
      .order('created_at', { ascending: false })
    setLeaves(data || [])
    setLoading(false)
  }

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) return
    
    if (new Date(formData.start_date) > new Date(formData.end_date)) {
      alert('Start date cannot be after End date')
      return
    }

    const { error } = await supabase.from('leaves').insert([{
      id: crypto.randomUUID(),
      employee_id: currentUser.id,
      type: formData.type,
      start_date: formData.start_date,
      end_date: formData.end_date,
      reason: formData.reason,
      status: 'PENDING'
    }])

    if (error) {
      alert(error.message)
      return
    }

    // Reset form reason and dates
    setFormData(prev => ({
      ...prev,
      start_date: '',
      end_date: '',
      reason: ''
    }))
    fetchData()
  }

  const getDurationDays = (start: string, end: string) => {
    const diffTime = Math.abs(new Date(end).getTime() - new Date(start).getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    return diffDays === 1 ? '1 day' : `${diffDays} days`
  }

  const filteredLeaves = filterStatus === 'ALL' 
    ? leaves 
    : leaves.filter(l => l.status === filterStatus)

  // Calculations
  const pendingCount = leaves.filter(l => l.status === 'PENDING').length
  const approvedCount = leaves.filter(l => l.status === 'APPROVED').length
  const totalCount = leaves.length
  
  // Static 6 available paid minus any approved casual/sick leaves
  const usedPaidCount = leaves.filter(l => l.status === 'APPROVED' && (l.type === 'CASUAL' || l.type === 'SICK')).length
  const availablePaid = Math.max(0, 6 - usedPaidCount)

  if (userLoading || loading) {
    return (
      <div className="page-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div className="page-content" style={{ padding: '32px 40px', maxWidth: '1600px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <div style={{ background: 'var(--primary)', padding: '12px', borderRadius: '16px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Calendar size={28} />
        </div>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Leave Management</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginTop: '4px' }}>Apply for time off and track your leave history.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
        
        {/* Pending */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', padding: '12px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={24} />
          </div>
          <div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{pendingCount}</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>Pending</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Awaiting approval</div>
          </div>
        </div>

        {/* Approved */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '12px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{approvedCount}</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>Approved</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Successfully approved</div>
          </div>
        </div>

        {/* Total */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', padding: '12px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Calendar size={24} />
          </div>
          <div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{totalCount}</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>Total</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Overall leave requests</div>
          </div>
        </div>

        {/* Available Paid */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--primary-light)', padding: '12px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={24} />
            </div>
            <div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{availablePaid}</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>Available Paid</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Paid leaves remaining</div>
            </div>
          </div>
          <ChevronRight size={20} color="var(--text-secondary)" />
        </div>

      </div>

      {/* Apply for Leave Form Block */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '28px', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={20} color="var(--primary-light)" /> Apply for Leave
        </h2>

        <form onSubmit={handleApply}>
          {/* Step 1: Select Leave Type */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <div style={{ background: 'var(--primary)', color: 'white', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>1</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>Select Leave Type</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              {LEAVE_TYPES.map(type => {
                const isSelected = formData.type === type.id
                const IconComponent = type.icon

                return (
                  <div
                    key={type.id}
                    onClick={() => setFormData(prev => ({ ...prev, type: type.id }))}
                    style={{
                      background: 'var(--surface-2)',
                      border: isSelected ? `2px solid var(--primary)` : '1px solid var(--border)',
                      borderRadius: '12px',
                      padding: '20px',
                      cursor: 'pointer',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ background: type.color, color: type.textColor, padding: '12px', borderRadius: '10px' }}>
                      <IconComponent size={24} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)' }}>{type.label}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{type.description}</div>
                    </div>
                    {isSelected && (
                      <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'var(--primary)', color: 'white', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Check size={10} strokeWidth={3} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px' }}>
            {/* Step 2: Select Dates */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <div style={{ background: 'var(--primary)', color: 'white', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>2</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>Select Dates</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '12px' }}>Start Date</label>
                  <input
                    type="date"
                    className="input"
                    required
                    value={formData.start_date}
                    onChange={e => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '12px' }}>End Date</label>
                  <input
                    type="date"
                    className="input"
                    required
                    value={formData.end_date}
                    onChange={e => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                  />
                </div>
              </div>
            </div>

            {/* Step 3: Reason */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <div style={{ background: 'var(--primary)', color: 'white', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>3</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>Reason for Leave</div>
              </div>

              <div className="form-group" style={{ position: 'relative' }}>
                <textarea
                  className="textarea"
                  placeholder="Please provide a detailed reason for your leave..."
                  maxLength={500}
                  required
                  value={formData.reason}
                  onChange={e => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  style={{ minHeight: '80px', background: 'var(--surface-2)', border: '1px solid var(--border)', fontSize: '13px' }}
                />
                <div style={{ position: 'absolute', bottom: '10px', right: '12px', fontSize: '11px', color: 'var(--text-muted)' }}>
                  {formData.reason.length}/500
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '14px', borderRadius: '12px', fontSize: '15px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px' }}
          >
            <Send size={16} /> Submit Request
          </button>
        </form>
      </div>

      {/* Leave History Card */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              My Leave History 
              <span style={{ background: 'var(--surface-2)', color: 'var(--primary-light)', padding: '2px 8px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>
                {filteredLeaves.length}
              </span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>Track and manage your past leave requests</p>
          </div>

          <select
            className="select"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            style={{ width: 'auto', background: 'var(--surface-2)', border: '1px solid var(--border)', fontSize: '13px', padding: '8px 16px', borderRadius: '8px' }}
          >
            <option value="ALL">All Requests</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredLeaves.map(leave => {
            const leaveTypeConfig = LEAVE_TYPES.find(t => t.id === leave.type) || LEAVE_TYPES[0]
            const IconComponent = leaveTypeConfig.icon
            const duration = getDurationDays(leave.start_date, leave.end_date)

            return (
              <div
                key={leave.id}
                style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  display: 'grid',
                  gridTemplateColumns: '1.5fr 1fr 1fr 1fr auto',
                  alignItems: 'center',
                  gap: '20px'
                }}
              >
                {/* Left side info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ background: leaveTypeConfig.color, color: leaveTypeConfig.textColor, padding: '12px', borderRadius: '10px' }}>
                    <IconComponent size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>
                      {leaveTypeConfig.label}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {new Date(leave.start_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} — {new Date(leave.end_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} • {duration}
                    </div>
                  </div>
                </div>

                {/* Applied On */}
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Applied On</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={14} color="var(--text-secondary)" />
                    {formatDate(leave.created_at)}
                  </div>
                </div>

                {/* Status */}
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</div>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: leave.status === 'APPROVED' ? 'rgba(16,185,129,0.1)' : leave.status === 'REJECTED' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                    color: leave.status === 'APPROVED' ? '#10b981' : leave.status === 'REJECTED' ? '#ef4444' : '#f59e0b',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: 700,
                    marginTop: '4px'
                  }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: leave.status === 'APPROVED' ? '#10b981' : leave.status === 'REJECTED' ? '#ef4444' : '#f59e0b' }} />
                    {leave.status}
                  </span>
                </div>

                {/* Approved By */}
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Approved By</div>
                  {leave.status === 'APPROVED' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                      <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700 }}>
                        AD
                      </div>
                      <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>Admin</span>
                    </div>
                  ) : (
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>—</div>
                  )}
                </div>

                {/* Action menu */}
                <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '8px' }}>
                  <MoreVertical size={16} />
                </button>
              </div>
            )
          })}

          {filteredLeaves.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
              <div style={{ background: 'var(--surface-3)', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <AlertCircle size={24} color="var(--text-muted)" />
              </div>
              <div style={{ fontSize: '14px' }}>No leave history found.</div>
            </div>
          )}
        </div>
      </div>
      
    </div>
  )
}
