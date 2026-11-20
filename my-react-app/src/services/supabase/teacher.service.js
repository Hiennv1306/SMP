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
