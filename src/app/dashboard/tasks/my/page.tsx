'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { formatDate } from '@/lib/utils'

import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd'

import {
  Calendar,
  Flag,
  CheckSquare,
  Clock,
} from 'lucide-react'

type Task = {
  id: string
  title: string
  description: string | null

  status:
    | 'TO_DO'
    | 'IN_PROGRESS'
    | 'UNDER_REVIEW'
    | 'COMPLETED'

  priority:
    | 'LOW'
    | 'MEDIUM'
    | 'HIGH'
    | 'CRITICAL'

  progress: number
  deadline: string | null

  assignee_ids: string[]
  creator_id: string
  project_id: string | null
}

const TASK_COLUMNS = [
  {
    id: 'TO_DO',
    title: 'TO DO',
  },
  {
    id: 'IN_PROGRESS',
    title: 'IN PROGRESS',
  },
  {
    id: 'UNDER_REVIEW',
    title: 'UNDER REVIEW',
  },
  {
    id: 'COMPLETED',
    title: 'COMPLETED',
  },
] as const

const PRIORITY_COLORS: Record<string, string> = {
  LOW: '#22c55e',
  MEDIUM: '#3b82f6',
  HIGH: '#f59e0b',
  CRITICAL: '#ef4444',
}

const STATUS_BADGES: Record<string, string> = {
  TO_DO: 'badge-pending',
  IN_PROGRESS: 'badge-approved',
  UNDER_REVIEW: 'badge-active',
  COMPLETED: 'badge-active',
}

export default function MyTasksPage() {
    const { currentUser, loading: userLoading } = useCurrentUser()

  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<Task[]>([])
  const [updating, setUpdating] = useState(false)

  // Load employee tasks
  const fetchTasks = async () => {
    if (!currentUser) return

    setLoading(true)

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .contains('assignee_ids', [currentUser.id])
      .order('deadline', { ascending: true })

    if (!error && data) {
      setTasks(data as Task[])
    }

    setLoading(false)
  }

  useEffect(() => {
    if (currentUser) {
      fetchTasks()
    }
  }, [currentUser])

  // Update task status in Supabase
  const updateTaskStatus = async (
    taskId: string,
    newStatus: Task['status']
  ) => {
    setUpdating(true)

    const updates: any = {
      status: newStatus,
    }

    // Auto update progress
    if (newStatus === 'TO_DO') updates.progress = 0
    if (newStatus === 'IN_PROGRESS') updates.progress = 25
    if (newStatus === 'UNDER_REVIEW') updates.progress = 90
    if (newStatus === 'COMPLETED') updates.progress = 100

    const { error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)

    if (!error) {
      setTasks(prev =>
        prev.map(task =>
          task.id === taskId
            ? {
                ...task,
                ...updates,
              }
            : task
        )
      )
    }

    setUpdating(false)
  }

  // Group tasks into Kanban columns
  const groupedTasks = useMemo(() => {
    return {
      TO_DO: tasks.filter(task => task.status === 'TO_DO'),
      IN_PROGRESS: tasks.filter(task => task.status === 'IN_PROGRESS'),
      UNDER_REVIEW: tasks.filter(task => task.status === 'UNDER_REVIEW'),
      COMPLETED: tasks.filter(task => task.status === 'COMPLETED'),
    }
  }, [tasks])
    // Drag & Drop Handler
  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result

    // Dropped outside any column
    if (!destination) return

    // Same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return
    }

    const newStatus = destination.droppableId as Task['status']

    // Optimistic UI update
    setTasks(prev =>
      prev.map(task =>
        task.id === draggableId
          ? {
              ...task,
              status: newStatus,
              progress:
                newStatus === 'TO_DO'
                  ? 0
                  : newStatus === 'IN_PROGRESS'
                  ? 25
                  : newStatus === 'UNDER_REVIEW'
                  ? 90
                  : 100,
            }
          : task
      )
    )

    // Update database
    const { error } = await supabase
      .from('tasks')
      .update({
        status: newStatus,
        progress:
          newStatus === 'TO_DO'
            ? 0
            : newStatus === 'IN_PROGRESS'
            ? 25
            : newStatus === 'UNDER_REVIEW'
            ? 90
            : 100,
      })
      .eq('id', draggableId)

    if (error) {
      console.error(error)

      // Reload original data if update fails
      fetchTasks()
    }
  }

  // Loading State
  if (userLoading || loading) {
    return (
      <div className="page-content">
        <div className="spinner" />
      </div>
    )
  }
    return (
    <div className="page-content">

      <div className="section-header">
        <div>
          <h1 className="page-title">My Tasks</h1>
          <p className="page-subtitle">
            Drag & Drop your assigned tasks
          </p>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(280px, 1fr))',
            gap: '20px',
            alignItems: 'flex-start',
            overflowX: 'auto',
            paddingBottom: '20px',
          }}
        >
          {TASK_COLUMNS.map((column) => (
            <Droppable
              key={column.id}
              droppableId={column.id}
            >
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  style={{
                    background: snapshot.isDraggingOver
                      ? 'var(--surface-2)'
                      : 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    minHeight: '650px',
                    padding: '14px',
                    transition: '.2s',
                  }}
                >

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '18px',
                    }}
                  >
                    <h3
                      style={{
                        fontWeight: 700,
                        fontSize: '15px',
                      }}
                    >
                      {column.title}
                    </h3>

                    <span className="badge badge-active">
                      {groupedTasks[column.id].length}
                    </span>
                  </div>

                  {groupedTasks[column.id].map((task, index) => (
                    <Draggable
                      key={task.id}
                      draggableId={task.id}
                      index={index}
                    >
                                          {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="card"
                          style={{
                            marginBottom: '14px',
                            cursor: 'grab',
                            userSelect: 'none',
                            borderRadius: '12px',
                            border: snapshot.isDragging
                              ? '2px solid var(--primary)'
                              : '1px solid var(--border)',
                            boxShadow: snapshot.isDragging
                              ? '0 10px 30px rgba(0,0,0,.15)'
                              : 'none',
                            background: 'var(--surface)',
                            ...provided.draggableProps.style,
                          }}
                        >
                          {/* Task Title */}
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              marginBottom: '10px',
                            }}
                          >
                            <h4
                              style={{
                                fontSize: '15px',
                                fontWeight: 600,
                                lineHeight: 1.4,
                              }}
                            >
                              {task.title}
                            </h4>

                            <span
                              style={{
                                padding: '4px 8px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 600,
                                color: '#fff',
                                background: PRIORITY_COLORS[task.priority],
                              }}
                            >
                              {task.priority}
                            </span>
                          </div>

                          {/* Description */}
                          {task.description && (
                            <p
                              style={{
                                fontSize: '13px',
                                color: 'var(--text-secondary)',
                                marginBottom: '12px',
                                lineHeight: 1.5,
                              }}
                            >
                              {task.description}
                            </p>
                          )}

                          {/* Deadline */}
                          {task.deadline && (
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                marginBottom: '12px',
                                fontSize: '12px',
                                color: 'var(--text-secondary)',
                              }}
                            >
                              <Calendar size={14} />
                              {formatDate(task.deadline)}
                            </div>
                          )}

                          {/* Progress */}
                          <div style={{ marginBottom: '10px' }}>
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginBottom: '6px',
                                fontSize: '12px',
                              }}
                            >
                              <span>Progress</span>

                              <strong>
                                {task.progress ?? 0}%
                              </strong>
                            </div>

                            <div
                              style={{
                                width: '100%',
                                height: '8px',
                                background: 'var(--surface-3)',
                                borderRadius: '999px',
                                overflow: 'hidden',
                              }}
                            >
                              <div
                                style={{
                                  width: `${task.progress ?? 0}%`,
                                  height: '100%',
                                  background: 'var(--primary)',
                                  transition: '.3s',
                                }}
                              />
                            </div>
                          </div>

                          {/* Status */}
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <span
                              className={`badge ${STATUS_BADGES[task.status]}`}
                            >
                              {task.status.replaceAll('_', ' ')}
                            </span>

                            <Clock size={15} />
                          </div>
                        </div>
                      )}
                                          </Draggable>
                  ))}

                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>

      {updating && (
        <div
          style={{
            position: 'fixed',
            right: 20,
            bottom: 20,
            background: 'var(--primary)',
            color: '#fff',
            padding: '10px 18px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 600,
            boxShadow: '0 8px 25px rgba(0,0,0,.18)',
            zIndex: 9999,
          }}
        >
          Updating task...
        </div>
      )}
    </div>
  )
}
