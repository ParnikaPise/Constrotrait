'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Search, Plus, Edit2, Trash2, X, Megaphone, Bell, 
  Calendar, MessageSquare, Send, Paperclip, Smile, MoreVertical,
  Filter, MessageCircle, PenSquare, Users, Check, Clock
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function CommunicationCenterPage() {
  const [activeTab, setActiveTab] = useState('INBOX') // NOTICES, INBOX
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)
  
  // Notice creation modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    id: '', title: '', content: '', priority: 'LOW', expiry_date: ''
  })

  // Chat/Direct Messages State
  const [activeContactId, setActiveContactId] = useState<string | null>(null)
  const [msgInput, setMsgInput] = useState('')
  const messageEndRef = useRef<HTMLDivElement>(null)

  // Reader list modal state
  const [selectedNoticeReaders, setSelectedNoticeReaders] = useState<any[] | null>(null)

  // Notice Management Roles
  const CAN_MANAGE_NOTICES = ['SUPER_ADMIN', 'BRANCH_ADMIN', 'HR', 'QUALITY_MANAGER', 'TECHNICAL_MANAGER']
  const canManageNotices = currentUser ? CAN_MANAGE_NOTICES.includes(currentUser.role_id) : false

  useEffect(() => {
    fetchData()
  }, [])

  // Auto-scroll to bottom of chat when active contact changes or new messages load
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, activeContactId])

  // Setup Supabase Realtime Subscription for incoming messages
  useEffect(() => {
    if (!currentUser) return

    const channel = supabase
      .channel('realtime_chats')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMsg = payload.new
          if (!newMsg) return

          if (newMsg.sender_id === currentUser.id || newMsg.receiver_id === currentUser.id) {
            fetchMessagesOnly()
          }
        }
      )
      .subscribe()

    const intervalId = window.setInterval(() => {
      fetchMessagesOnly()
    }, 10000)

    return () => {
      window.clearInterval(intervalId)
      supabase.removeChannel(channel)
    }
  }, [currentUser])

  // Mark notices as read when the employee opens the Notice Board tab
  useEffect(() => {
    if (activeTab === 'NOTICES' && announcements.length > 0 && currentUser && !canManageNotices) {
      markNoticesAsRead(announcements)
    }
  }, [activeTab, announcements, currentUser])

  const markNoticesAsRead = async (noticesList: any[]) => {
    try {
      const inserts = noticesList.map(notice => ({
        notice_id: notice.id,
        employee_id: currentUser.id
      }))
      // Insert read receipts (ignores if already exists due to unique constraint)
      await supabase.from('notice_reads').upsert(inserts, { onConflict: 'notice_id,employee_id' })
    } catch (err) {
      console.error('Error marking notices as read:', err)
    }
  }

  const fetchMessagesOnly = async () => {
    if (!currentUser) return
    const { data: msgRes } = await supabase
      .from('messages')
      .select('*, sender:sender_id(firstName, lastName, role_id, email), receiver:receiver_id(firstName, lastName, role_id, email)')
      .or(`receiver_id.eq.${currentUser.id},sender_id.eq.${currentUser.id}`)
      .order('created_at', { ascending: true })
    
    if (msgRes) setMessages(msgRes)
  }

  const fetchData = async () => {
    setLoading(true)
    const { data: authData } = await supabase.auth.getUser()
    
    let currentEmpId = null
    if (authData.user) {
      const { data: emps } = await supabase.from('employees').select('id, email, firstName, lastName, role_id')
      if (emps) {
        setEmployees(emps)
        const me = emps.find(e => e.email === authData.user?.email)
        if (me) {
          currentEmpId = me.id
          setCurrentUser(me)
        }
      }
    }

    // Load announcements along with notice_reads and corresponding employee names
    const [annRes, msgRes] = await Promise.all([
      supabase
        .from('announcements')
        .select('*, notice_reads(employee_id, read_at, employees(firstName, lastName, role_id))')
        .order('created_at', { ascending: false }),
      currentEmpId 
        ? supabase.from('messages').select('*, sender:sender_id(firstName, lastName, role_id, email), receiver:receiver_id(firstName, lastName, role_id, email)').or(`receiver_id.eq.${currentEmpId},sender_id.eq.${currentEmpId}`).order('created_at', { ascending: true })
        : Promise.resolve({ data: [] })
    ])
    
    if (annRes.data) setAnnouncements(annRes.data)
    if (msgRes.data) setMessages(msgRes.data)
    
    setLoading(false)
  }

  // Create/Edit Notice
  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canManageNotices) return alert('Unauthorized')
    
    const { id, ...data } = formData
    const payload = {
      ...data,
      expiry_date: data.expiry_date === '' ? null : data.expiry_date
    }
    if (id) {
      await supabase.from('announcements').update(payload).eq('id', id)
    } else {
      await supabase.from('announcements').insert({ id: crypto.randomUUID(), ...payload })
    }
    setIsModalOpen(false)
    fetchData()
  }

  // Delete Notice
  const handleDeleteAnnouncement = async (id: string) => {
    if (!canManageNotices) return alert('Unauthorized')
    if (confirm('Are you sure you want to delete this notice?')) {
      await supabase.from('announcements').delete().eq('id', id)
      fetchData()
    }
  }

  // Send Chat Message
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser || !activeContactId || !msgInput.trim()) return

    const payload = {
      id: crypto.randomUUID(),
      sender_id: currentUser.id,
      receiver_id: activeContactId,
      subject: 'Chat Message',
      content: msgInput.trim()
    }

    const messageToSend = {
      ...payload,
      created_at: new Date().toISOString(),
      sender: currentUser,
      receiver: employees.find(emp => emp.id === activeContactId) || null
    }

    setMsgInput('') // Clear input immediately for responsive UI
    setMessages(prev => [...prev, messageToSend])

    const { error } = await supabase.from('messages').insert(payload)
    if (error) {
      alert(error.message)
      setMessages(prev => prev.filter(m => m.id !== payload.id))
    } else {
      fetchMessagesOnly()
    }
  }

  const isExpired = (dateString: string) => {
    if (!dateString) return false
    return new Date(dateString) < new Date()
  }

  const formatRoleLabel = (roleId: string) => {
    if (!roleId) return 'Team Member'
    return roleId.replace('_', ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
  }

  // Filter notices
  const filteredNotices = announcements.filter(a => 
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.content.toLowerCase().includes(search.toLowerCase())
  )

  // Filter contacts (employees list)
  const filteredContacts = employees.filter(emp => {
    if (emp.id === currentUser?.id) return false // Hide myself
    const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase()
    return fullName.includes(search.toLowerCase())
  })

  // Get conversation messages between current user and active contact
  const conversationMessages = messages.filter(m => 
    (m.sender_id === currentUser?.id && m.receiver_id === activeContactId) ||
    (m.sender_id === activeContactId && m.receiver_id === currentUser?.id)
  )

  const activeContact = employees.find(e => e.id === activeContactId)

  // Get last message info for each contact
  const getContactLastMsg = (contactId: string) => {
    const chatHistory = messages.filter(m => 
      (m.sender_id === currentUser?.id && m.receiver_id === contactId) ||
      (m.sender_id === contactId && m.receiver_id === currentUser?.id)
    )
    if (chatHistory.length === 0) return { content: 'Tap to start chat', time: '' }
    const lastMsg = chatHistory[chatHistory.length - 1]
    
    let displayContent = lastMsg.content
    if (displayContent.length > 28) displayContent = displayContent.substring(0, 25) + '...'
    
    const date = new Date(lastMsg.created_at)
    const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    
    return { content: displayContent, time: timeStr }
  }

  return (
    <div className="page-content" style={{ padding: '32px 40px', maxWidth: '1600px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)' }}>
      
      {/* Header and top illustrations */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', position: 'relative' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Messages</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginTop: '4px' }}>Real-time collaboration with your team.</p>
        </div>

        {/* Notice Creation Button for Managers */}
        {activeTab === 'NOTICES' && canManageNotices && (
          <button className="btn btn-primary" onClick={() => { setFormData({ id: '', title: '', content: '', priority: 'LOW', expiry_date: '' }); setIsModalOpen(true); }}>
            <Plus size={16} /> New Notice
          </button>
        )}
      </div>

      {/* Tabs Layout */}
      <div style={{ display: 'flex', gap: '8px', background: 'var(--surface-2)', padding: '4px', borderRadius: '12px', width: 'fit-content', border: '1px solid var(--border)', marginBottom: '24px' }}>
        <button 
          onClick={() => { setActiveTab('INBOX'); setSearch(''); }}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px', border: 'none', 
            background: activeTab === 'INBOX' ? 'var(--primary)' : 'transparent', 
            color: activeTab === 'INBOX' ? 'white' : 'var(--text-secondary)', 
            fontWeight: 600, fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' 
          }}
        >
          <MessageCircle size={16} /> Direct Messages
        </button>
        <button 
          onClick={() => { setActiveTab('NOTICES'); setSearch(''); }}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px', border: 'none', 
            background: activeTab === 'NOTICES' ? 'var(--primary)' : 'transparent', 
            color: activeTab === 'NOTICES' ? 'white' : 'var(--text-secondary)', 
            fontWeight: 600, fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' 
          }}
        >
          <Megaphone size={16} /> Notice Board
        </button>
      </div>

      {loading ? (
        <div className="spinner" />
      ) : activeTab === 'NOTICES' ? (
        
        /* Notice Board Tab */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, overflowY: 'auto' }}>
          <div className="card" style={{ padding: '16px' }}>
            <div className="search-bar" style={{ maxWidth: '400px' }}>
              <Search size={18} />
              <input 
                type="text" 
                placeholder="Search notices..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="grid-2">
            {filteredNotices.map(ann => {
              const expired = isExpired(ann.expiry_date)
              const readersCount = ann.notice_reads?.length || 0

              return (
                <div key={ann.id} className="card" style={{ 
                  display: 'flex', flexDirection: 'column',
                  opacity: expired ? 0.6 : 1,
                  borderLeft: `4px solid ${ann.priority === 'HIGH' && !expired ? 'var(--accent-red)' : 'transparent'}`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ 
                        width: 40, height: 40, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: ann.priority === 'HIGH' ? 'rgba(239,68,68,0.1)' : 'var(--surface-3)',
                        color: ann.priority === 'HIGH' ? 'var(--accent-red)' : 'var(--primary-light)'
                      }}>
                        {ann.priority === 'HIGH' ? <Megaphone size={20} /> : <Bell size={20} />}
                      </div>
                      <div>
                        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{ann.title}</h3>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {formatDate(ann.created_at)}
                        </div>
                      </div>
                    </div>
                    
                    {/* Management Edit/Delete Buttons */}
                    {canManageNotices && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => { setFormData(ann); setIsModalOpen(true); }} style={{ padding: '6px' }}>
                          <Edit2 size={14} />
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteAnnouncement(ann.id)} style={{ padding: '6px' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div style={{ 
                    background: 'var(--surface-2)', padding: '16px', borderRadius: '8px', 
                    fontSize: '14px', lineHeight: 1.6, color: 'var(--text-primary)', marginBottom: '16px', flex: 1,
                    whiteSpace: 'pre-wrap'
                  }}>
                    {ann.content}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <span className={`badge ${ann.priority === 'HIGH' ? 'badge-inactive' : 'badge-active'}`}>
                        Priority: {ann.priority}
                      </span>

                      {/* Read Receipts Count for Managers */}
                      {canManageNotices && (
                        <button 
                          onClick={() => setSelectedNoticeReaders(ann.notice_reads || [])}
                          style={{ background: 'none', border: 'none', color: 'var(--primary-light)', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                          className="hover:underline"
                        >
                          <Users size={12} /> Read by {readersCount} {readersCount === 1 ? 'person' : 'people'}
                        </button>
                      )}
                    </div>
                    
                    {ann.expiry_date && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: expired ? 'var(--accent-red)' : 'var(--text-secondary)' }}>
                        <Calendar size={14} />
                        {expired ? 'Expired on' : 'Expires'}: {formatDate(ann.expiry_date)}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
            {filteredNotices.length === 0 && (
              <div className="empty-state" style={{ gridColumn: '1 / -1' }}>No notices found.</div>
            )}
          </div>
        </div>

      ) : (

        /* Chat / Direct Messages Tab (Exactly as Mockup) */
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px', flex: 1,minHeight: 0, overflow: 'hidden', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px' }}>
          
          {/* Left panel: Contacts list */}
          <div style={{ borderRight: '1px solid var(--border)', display: 'flex', height: '100%',
    minHeight: 0, flexDirection: 'column', background: 'rgba(18, 18, 26, 0.4)' }}>
            <div style={{ padding: '16px', display: 'flex', gap: '8px' }}>
              <div className="search-bar" style={{ background: 'var(--surface-2)', flex: 1 }}>
                <Search size={16} />
                <input 
                  type="text" 
                  placeholder="Search conversations..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ fontSize: '13px' }}
                />
              </div>
              <button style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '8px', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', cursor: 'pointer' }} className="hover:text-white">
                <Filter size={16} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
              {filteredContacts.map(emp => {
                const isSelected = activeContactId === emp.id
                const lastMsg = getContactLastMsg(emp.id)

                return (
                  <div
                    key={emp.id}
                    onClick={() => setActiveContactId(emp.id)}
                    style={{
                      padding: '14px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                      borderLeft: isSelected ? '3px solid var(--primary)' : '3px solid transparent',
                      borderBottom: '1px solid rgba(42, 42, 69, 0.3)',
                      transition: 'all 0.15s'
                    }}
                    className={!isSelected ? "hover:bg-[rgba(99,102,241,0.04)]" : ""}
                  >
                    <div style={{ position: 'relative' }}>
                      <div className="avatar" style={{ width: '40px', height: '40px', fontSize: '14px', background: isSelected ? 'linear-gradient(135deg, var(--primary), var(--primary-light))' : 'var(--surface-3)' }}>
                        {emp.firstName[0]}{emp.lastName[0]}
                      </div>
                      {/* Green dot for active/online status, defaulted grey/green based on name for visuals */}
                      <div style={{ 
                        width: '10px', height: '10px', 
                        background: emp.firstName.startsWith('S') ? '#10b981' : '#94a3b8', 
                        borderRadius: '50%', border: '2px solid var(--surface)', 
                        position: 'absolute', bottom: '0', right: '0' 
                      }} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2px' }}>
                        <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {emp.firstName} {emp.lastName}
                        </div>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{lastMsg.time}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--primary-light)', fontWeight: 500, marginBottom: '2px' }}>
                        {formatRoleLabel(emp.role_id)}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {lastMsg.content}
                      </div>
                    </div>
                  </div>
                )
              })}
              {filteredContacts.length === 0 && (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No contacts found.
                </div>
              )}
            </div>
          </div>

          {/* Right panel: Active Chat Thread */}
          {activeContactId ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'rgba(10, 10, 15, 0.2)' }}>
              
              {/* Active Chat Header */}
              <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(18, 18, 26, 0.8)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="avatar" style={{ width: '40px', height: '40px', fontSize: '14px' }}>
                    {activeContact?.firstName[0]}{activeContact?.lastName[0]}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                      {activeContact?.firstName} {activeContact?.lastName}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--primary-light)', fontWeight: 600 }}>
                        {formatRoleLabel(activeContact?.role_id || '')}
                      </span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>•</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {activeContact?.firstName.startsWith('S') ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveContactId(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '6px' }}
                  className="hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Chat Thread Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {conversationMessages.map((msg) => {
                  const isMe = msg.sender_id === currentUser.id
                  const msgDate = new Date(msg.created_at)
                  const timeString = msgDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })

                  return (
                    <div
                      key={msg.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isMe ? 'flex-end' : 'flex-start',
                        maxWidth: '70%',
                        alignSelf: isMe ? 'flex-end' : 'flex-start',
                      }}
                    >
                      <div
                        style={{
                          background: isMe ? 'var(--primary)' : 'var(--surface-2)',
                          color: 'var(--text-primary)',
                          borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                          padding: '12px 16px',
                          fontSize: '13px',
                          lineHeight: 1.5,
                          boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                          whiteSpace: 'pre-wrap'
                        }}
                      >
                        {msg.content}
                      </div>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', padding: '0 4px' }}>
                        {timeString}
                      </span>
                    </div>
                  )
                })}
                {conversationMessages.length === 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--text-muted)' }}>
                    <MessageSquare size={36} style={{ marginBottom: '12px', opacity: 0.4 }} />
                    <div style={{ fontSize: '13px' }}>Start your conversation. Type a message below.</div>
                  </div>
                )}
                <div ref={messageEndRef} />
              </div>

              {/* Chat Footer Input */}
              <form onSubmit={handleSendChat} style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', background: 'rgba(18, 18, 26, 0.8)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '8px 16px' }}>
                  <button type="button" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }} className="hover:text-white">
                    <Paperclip size={18} />
                  </button>
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={msgInput}
                    onChange={e => setMsgInput(e.target.value)}
                    style={{
                      flex: 1,
                      background: 'none',
                      border: 'none',
                      outline: 'none',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                    }}
                  />
                  <button type="button" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }} className="hover:text-white">
                    <Smile size={18} />
                  </button>
                  <button 
                    type="submit" 
                    disabled={!msgInput.trim()}
                    style={{ 
                      background: msgInput.trim() ? 'var(--primary)' : 'var(--surface-3)', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '50%', 
                      width: '32px', 
                      height: '32px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      cursor: msgInput.trim() ? 'pointer' : 'default',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Send size={14} />
                  </button>
                </div>
              </form>

            </div>
          ) : (
            /* Empty Chat State (Sleek matching SVG as Mockup) */
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', padding: '40px' }}>
              
              {/* Mockup matching floating messages header graphics */}
              <div style={{ position: 'relative', width: '220px', height: '140px', marginBottom: '24px' }}>
                <svg width="100%" height="100%" viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Left speech bubble */}
                  <g filter="drop-shadow(0px 8px 16px rgba(99, 102, 241, 0.15))">
                    <path d="M20 20C20 8.95431 28.9543 0 40 0H140C151.046 0 160 8.95431 160 20V60C160 71.0457 151.046 80 140 80H80L50 100V80H40C28.9543 80 20 71.0457 20 60V20Z" fill="url(#bubbleGrad1)" />
                  </g>
                  {/* Right speech bubble */}
                  <g filter="drop-shadow(0px 8px 16px rgba(139, 92, 246, 0.15))">
                    <path d="M80 50C80 44.4772 84.4772 40 90 40H170C175.523 40 180 44.4772 180 50V90C180 95.5228 175.523 100 170 100H130L110 115V100H90C84.4772 100 80 95.5228 80 90V50Z" fill="url(#bubbleGrad2)" />
                  </g>
                  {/* Lines inside bubble 1 */}
                  <rect x="40" y="24" width="80" height="6" rx="3" fill="white" fillOpacity="0.8" />
                  <rect x="40" y="38" width="50" height="6" rx="3" fill="white" fillOpacity="0.8" />
                  <rect x="40" y="52" width="65" height="6" rx="3" fill="white" fillOpacity="0.8" />
                  {/* Lines inside bubble 2 */}
                  <rect x="96" y="58" width="60" height="4" rx="2" fill="white" fillOpacity="0.8" />
                  <rect x="96" y="68" width="45" height="4" rx="2" fill="white" fillOpacity="0.8" />
                  <rect x="96" y="78" width="52" height="4" rx="2" fill="white" fillOpacity="0.8" />
                  
                  <defs>
                    <linearGradient id="bubbleGrad1" x1="20" y1="0" x2="160" y2="80" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#6366f1" />
                      <stop offset="1" stopColor="#4f46e5" />
                    </linearGradient>
                    <linearGradient id="bubbleGrad2" x1="80" y1="40" x2="180" y2="100" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#8b5cf6" />
                      <stop offset="1" stopColor="#7c3aed" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              <div style={{ background: 'rgba(99, 102, 241, 0.1)', width: '56px', height: '56px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <MessageSquare size={28} color="var(--primary-light)" />
              </div>
              <h3 style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>
                Your conversations will appear here
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center', maxWidth: '340px', lineHeight: 1.5, marginBottom: '20px' }}>
                Select a user from the list to start messaging and collaborate in real-time.
              </p>
              <button 
                onClick={() => {
                  const searchEl = document.querySelector('input[placeholder="Search conversations..."]') as HTMLInputElement;
                  searchEl?.focus();
                }}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '8px', 
                  border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-primary)', 
                  padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' 
                }}
                className="hover:bg-primary/10 hover:border-primary"
              >
                <PenSquare size={14} /> Start a new conversation
              </button>
            </div>
          )}

        </div>
      )}

      {/* Notice Board Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">{formData.id ? 'Edit Notice' : 'New Notice'}</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveAnnouncement}>
              <div className="form-group">
                <label className="form-label">Notice Title</label>
                <input type="text" className="input" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>

              <div className="form-group">
                <label className="form-label">Message Content</label>
                <textarea className="textarea" required rows={5} value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="select" required value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}>
                    <option value="LOW">Low (Normal Update)</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High (Important Alert)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Expiry Date (Optional)</label>
                  <input type="date" className="input" value={formData.expiry_date} onChange={e => setFormData({...formData, expiry_date: e.target.value})} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Save Notice</button>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reader list modal */}
      {selectedNoticeReaders !== null && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Read Receipts</h3>
              <button onClick={() => setSelectedNoticeReaders(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto' }}>
              {selectedNoticeReaders.map((read, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--surface-2)', padding: '10px 14px', borderRadius: '8px' }}>
                  <div className="avatar" style={{ width: '28px', height: '28px', fontSize: '11px' }}>
                    {read.employees?.firstName?.[0]}{read.employees?.lastName?.[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {read.employees?.firstName} {read.employees?.lastName}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--primary-light)' }}>
                      {formatRoleLabel(read.employees?.role_id)}
                    </div>
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={10} /> {new Date(read.read_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
              ))}
              {selectedNoticeReaders.length === 0 && (
                <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No one has read this notice yet.
                </div>
              )}
            </div>
            
            <button className="btn btn-secondary" onClick={() => setSelectedNoticeReaders(null)} style={{ width: '100%', justifyContent: 'center', marginTop: '20px' }}>
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
