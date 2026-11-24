import { supabase } from '../../config/supabase'

function requireSupabase() {
  if (!supabase) throw new Error('Supabase chua Duoc cau hinh.')
  return supabase
}

export async function getCurrentTeacher() {
  const client = requireSupabase()
  const { data: sessionData } = await client.auth.getSession()
  const authUserId = sessionData.session?.user.id

  if (!authUserId) {
    return { data: null, error: { message: 'Chua Dang nhap.' } }
  }

  const result = await client
    .from('users')
    .select('id, teachers(id, specialty, bio)')
    .eq('auth_user_id', authUserId)
    .single()

  if (!result.error && result.data) {
    const teachers = Array.isArray(result.data.teachers)
      ? result.data.teachers
      : result.data.teachers
        ? [result.data.teachers]
        : []
    return { ...result, data: { ...result.data, teachers } }
  }

  return result
}

export const teacherService = {
  getDashboardSummary: async () => {
    const { data, error } = await requireSupabase().rpc('teacher_dashboard_summary')
    if (error) return { data: null, error }
    if (!data?.ok) return { data: null, error: { code: data?.code, message: data?.code } }
    return { data: data.data, error: null }
  },

  getDashboard: async () => {
    const teacherResult = await getCurrentTeacher()
    if (teacherResult.error) return teacherResult

    const teacher = teacherResult.data?.teachers?.[0]
    if (!teacher) return { data: null, error: { message: 'Khong tim thay ho so giao vien.' } }

    const client = requireSupabase()
    const [classesResult, sessionsResult] = await Promise.all([
      client.from('classes').select('*').eq('teacher_id', teacher.id),
      client.from('class_sessions').select('*, classes!inner(teacher_id)').eq('classes.teacher_id', teacher.id),
    ])

    if (classesResult.error || sessionsResult.error) {
      return { data: null, error: classesResult.error || sessionsResult.error }
    }

    return {
      data: {
        classes: classesResult.data ?? [],
        sessions: sessionsResult.data ?? [],
      },
      error: null,
    }
  },

  listClasses: async () => {
    const teacherResult = await getCurrentTeacher()
    if (teacherResult.error) return teacherResult
    const teacher = teacherResult.data?.teachers?.[0]
    if (!teacher) return { data: [], error: null }

    const { data, error } = await requireSupabase()
      .from('classes')
      .select(`
        *,
        class_schedules(id, day_of_week, start_time, end_time),
        enrollments(id, status)
      `)
      .eq('teacher_id', teacher.id)
      .order('id')

    if (error) return { data: null, error }

    const classes = (data || []).map((item) => ({
      ...item,
      enrolled: (item.enrollments || []).filter((enrollment) => enrollment.status === 'active').length,
      schedules: item.class_schedules || [],
    }))

    return { data: classes, error: null }
  },

  getClassDetail: async (classId, sessionDate) => {
    const { data, error } = await requireSupabase().rpc('teacher_get_class_detail', {
      p_class_id: classId,
      p_session_date: sessionDate,
    })

    if (error) return { data: null, error }
    if (!data?.ok) return { data: null, error: { code: data?.code, message: data?.code } }
    return { data: data.data, error: null }
  },

  saveClassAttendance: async (classId, sessionDate, rows) => {
    const { data, error } = await requireSupabase().rpc('teacher_save_attendance', {
      p_class_id: classId,
      p_session_date: sessionDate,
      p_attendance: rows,
    })

    if (error) return { data: null, error }
    if (!data?.ok) return { data: null, error: { code: data?.code, message: data?.code } }
    return { data, error: null }
  },

  previewTuition: async (classId, billingMonth) => {
    const client = requireSupabase()
    const rpcResult = await client.rpc('teacher_preview_monthly_tuition', {
      p_class_id: classId,
      p_billing_month: billingMonth,
    })

    if (!rpcResult.error && rpcResult.data?.ok) {
      return { data: rpcResult.data.data, error: null }
    }

    const [month, year] = String(billingMonth).split('/').map(Number)
    if (!month || !year) {
      return { data: null, error: { code: 'INVALID_BILLING_MONTH', message: 'Ky thanh toan khong hop le.' } }
    }

    const monthStart = `${year}-${String(month).padStart(2, '0')}-01`
    const monthEndDate = new Date(year, month, 0)
    const monthEnd = `${year}-${String(month).padStart(2, '0')}-${String(monthEndDate.getDate()).padStart(2, '0')}`

    const [enrollmentResult, sessionResult] = await Promise.all([
      client
        .from('enrollments')
        .select(`
          student_id,
          students(
            id,
            full_name,
            users:parent_id(id, full_name)
          )
        `)
        .eq('class_id', classId)
        .eq('status', 'active'),
      client
        .from('class_sessions')
        .select('id')
        .eq('class_id', classId)
        .gte('session_date', monthStart)
        .lte('session_date', monthEnd),
    ])

    if (enrollmentResult.error) return { data: null, error: enrollmentResult.error }
    if (sessionResult.error) return { data: null, error: sessionResult.error }

    const sessionIds = (sessionResult.data || []).map((item) => item.id)
    let attendanceRows = []
    if (sessionIds.length) {
      const attendanceResult = await client
        .from('attendances')
        .select('student_id, status')
        .in('session_id', sessionIds)
        .eq('status', 'absent')

      if (attendanceResult.error) return { data: null, error: attendanceResult.error }
      attendanceRows = attendanceResult.data || []
    }

    const absentByStudent = attendanceRows.reduce((counts, item) => {
      counts[item.student_id] = (counts[item.student_id] || 0) + 1
      return counts
    }, {})

    const students = (enrollmentResult.data || []).map((enrollment) => {
      const student = enrollment.students
      const absentCount = absentByStudent[enrollment.student_id] || 0
      const chargeableSessions = Math.max(8 - absentCount, 0)
      return {
        studentId: student?.id || enrollment.student_id,
        studentCode: `HV${String(student?.id || enrollment.student_id).padStart(4, '0')}`,
        studentName: student?.full_name || 'Chua ro',
        parentName: student?.users?.full_name || '',
        absentCount,
        chargeableSessions,
        amount: chargeableSessions * 35000,
      }
    })

    return { data: { students }, error: null }
  },

  listSchedules: async (classId) => {
    let query = requireSupabase().from('class_schedules').select('*')
    if (classId) query = query.eq('class_id', classId)
    return query.order('day_of_week').order('start_time')
  },

  listSessions: async (classId) => {
    let query = requireSupabase().from('class_sessions').select('*')
    if (classId) query = query.eq('class_id', classId)
    return query.order('session_date', { ascending: false })
  },

  listAttendance: (sessionId) => requireSupabase()
    .from('attendances')
    .select('*, students(full_name, grade_level)')
    .eq('session_id', sessionId),

  saveAttendance: (rows) => requireSupabase()
    .from('attendances')
    .upsert(rows, { onConflict: 'session_id,student_id' })
    .select(),

  createSession: (values) => requireSupabase()
    .from('class_sessions')
    .insert(values)
    .select()
    .single(),
}
