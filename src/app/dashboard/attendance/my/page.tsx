'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
} from 'lucide-react'
type AttendanceStatus =
  | 'PRESENT'
  | 'ABSENT'
  | 'LEAVE'
  | 'HALF_DAY'
  | 'HOLIDAY'

interface AttendanceRecord {
  id: string
  employee_id: string
  date: string
  status: AttendanceStatus
}
const WEEK_DAYS = [
  'SUN',
  'MON',
  'TUE',
  'WED',
  'THU',
  'FRI',
  'SAT',
]

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]
export default function MyAttendancePage() {
  const { currentUser, loading: userLoading } = useCurrentUser()

  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

useEffect(() => {
  if (currentUser) {
    fetchAttendance()
  }
}, [currentUser, currentDate])

const fetchAttendance = async () => {
  if (!currentUser) return

  setLoading(true)

  const startDate = new Date(year, month, 1)
  const endDate = new Date(year, month + 1, 0)

  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('employee_id', currentUser.id)
    .gte('date', startDate.toISOString().split('T')[0])
    .lte('date', endDate.toISOString().split('T')[0])
    .order('date')

  if (!error) {
    setAttendance((data || []) as AttendanceRecord[])
  }

  setLoading(false)
}

const previousMonth = () => {
  setCurrentDate(new Date(year, month - 1, 1))
}

const nextMonth = () => {
  setCurrentDate(new Date(year, month + 1, 1))
}
const attendanceMap = useMemo(() => {
  const map: Record<string, AttendanceStatus> = {}

  attendance.forEach((item) => {
    map[item.date] = item.status
  })

  return map
}, [attendance])

const calendarDays = useMemo(() => {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  const startDay = firstDay.getDay()
  const totalDays = lastDay.getDate()

  const days: {
    date: Date
    currentMonth: boolean
    status?: AttendanceStatus
  }[] = []

  // Previous Month Days
  for (let i = startDay; i > 0; i--) {
    days.push({
      date: new Date(year, month, 1 - i),
      currentMonth: false,
    })
  }

  // Current Month Days
  for (let day = 1; day <= totalDays; day++) {
    const date = new Date(year, month, day)

    const key = date.toISOString().split('T')[0]

    days.push({
      date,
      currentMonth: true,
      status: attendanceMap[key],
    })
  }

  // Next Month Days
  while (days.length < 42) {
    const nextDay = days.length - (startDay + totalDays) + 1

    days.push({
      date: new Date(year, month + 1, nextDay),
      currentMonth: false,
    })
  }

  return days
}, [attendanceMap, month, year])

const presentCount = attendance.filter(
  (a) => a.status === 'PRESENT'
).length

const absentCount = attendance.filter(
  (a) => a.status === 'ABSENT'
).length

const leaveCount = attendance.filter(
  (a) => a.status === 'LEAVE'
).length

const holidayCount = attendance.filter(
  (a) => a.status === 'HOLIDAY'
).length
const monthlyPaidLeaves = 2

const usedLeaves = leaveCount

const remainingLeaves = monthlyPaidLeaves - usedLeaves
if (userLoading || loading) {
  return (
    <div className="page-content">
      <div className="spinner" />
    </div>
  )
}
return (
  <div className="page-content">

    {/* Header */}
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
      }}
    >
      <div>
        <h1 className="page-title">Attendance & Leaves</h1>
        <p className="page-subtitle">
          View your monthly attendance calendar
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <button
          className="btn btn-secondary"
          onClick={previousMonth}
        >
          <ChevronLeft size={18} />
        </button>

        <div
          style={{
            minWidth: '170px',
            textAlign: 'center',
            fontWeight: 600,
            fontSize: '16px',
          }}
        >
          {MONTHS[month]} {year}
        </div>

        <button
          className="btn btn-secondary"
          onClick={nextMonth}
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>

    {/* Main Layout */}
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 320px',
        gap: '24px',
        alignItems: 'start',
      }}
    >

      {/* Calendar Section */}
      <div
        className="card"
        style={{
          padding: '22px',
        }}
      >
              {/* Week Days */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7,1fr)',
            gap: '10px',
            marginBottom: '12px',
          }}
        >
          {WEEK_DAYS.map((day) => (
            <div
              key={day}
              style={{
                textAlign: 'center',
                fontWeight: 700,
                fontSize: '13px',
                color: 'var(--text-secondary)',
                paddingBottom: '8px',
              }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7,1fr)',
            gap: '10px',
          }}
        >
          {calendarDays.map((day, index) => {
            const today = new Date()

            const isToday =
              day.date.toDateString() === today.toDateString()

            let bg = 'var(--surface)'
            let color = 'var(--text-primary)'
            let border = '1px solid var(--border)'

            switch (day.status) {
              case 'PRESENT':
                bg = '#DCFCE7'
                color = '#166534'
                break

              case 'ABSENT':
                bg = '#FEE2E2'
                color = '#991B1B'
                break

              case 'LEAVE':
                bg = '#FEF3C7'
                color = '#92400E'
                break

              case 'HALF_DAY':
                bg = '#DBEAFE'
                color = '#1E40AF'
                break

              case 'HOLIDAY':
                bg = '#EDE9FE'
                color = '#6D28D9'
                break
            }

            if (isToday) {
              border = '2px solid var(--primary)'
            }

            return (
              <div
                key={index}
                style={{
                  height: '82px',
                  border,
                  borderRadius: '12px',
                  background: bg,
                  color,
                  padding: '10px',
                  opacity: day.currentMonth ? 1 : 0.35,
                  transition: '.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: '15px',
                  }}
                >
                  {day.date.getDate()}
                </div>

                {day.status && (
                  <div
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                    }}
                  >
                    {day.status.replace(/_/g, ' ')}
                  </div>
                )}
              </div>
            )
          })}
        </div>

      </div>
            {/* Right Sidebar */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        {/* Employee Card */}
        <div className="card" style={{ padding: '20px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              marginBottom: '16px',
            }}
          >
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                background: 'var(--primary)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '18px',
              }}
            >
              {currentUser?.firstName?.charAt(0)}
              {currentUser?.lastName?.charAt(0)}
            </div>

            <div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: '16px',
                }}
              >
                {currentUser?.firstName} {currentUser?.lastName}
              </div>

              <div
                style={{
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                }}
              >
                {currentUser?.roleLabel}
              </div>
            </div>
          </div>

          <div
            style={{
              borderTop: '1px solid var(--border)',
              paddingTop: '14px',
            }}
          >
            <div
              style={{
                fontSize: '13px',
                color: 'var(--text-secondary)',
                marginBottom: '6px',
              }}
            >
              Remaining Paid Leaves
            </div>

            <div
              style={{
                fontSize: '34px',
                fontWeight: 700,
                color: 'var(--primary)',
              }}
            >
            {remainingLeaves}
            </div>
          </div>
        </div>

        {/* Attendance Summary */}
        <div className="card" style={{ padding: '20px' }}>
          <h3
            style={{
              marginBottom: '18px',
              fontWeight: 700,
            }}
          >
            Monthly Summary
          </h3>

          {[
            {
              label: 'Present',
              value: presentCount,
              color: '#22C55E',
            },
            {
              label: 'Absent',
              value: absentCount,
              color: '#EF4444',
            },
            {
              label: 'Leave',
              value: leaveCount,
              color: '#F59E0B',
            },
            {
              label: 'Holiday',
              value: holidayCount,
              color: '#8B5CF6',
            },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '14px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: item.color,
                  }}
                />

                <span>{item.label}</span>
              </div>

              <strong>{item.value}</strong>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="card" style={{ padding: '20px' }}>
          <h3
            style={{
              marginBottom: '16px',
              fontWeight: 700,
            }}
          >
            Legend
          </h3>

          {[
            ['Present', '#DCFCE7'],
            ['Absent', '#FEE2E2'],
            ['Leave', '#FEF3C7'],
            ['Half Day', '#DBEAFE'],
            ['Holiday', '#EDE9FE'],
          ].map(([label, color]) => (
            <div
              key={label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '10px',
              }}
            >
              <div
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '4px',
                  background: color,
                  border: '1px solid var(--border)',
                }}
              />

              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
)
}
