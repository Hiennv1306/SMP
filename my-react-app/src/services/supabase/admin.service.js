import { supabase } from '../../config/supabase'
import { toSupabaseError } from '../../utils/errorHandler'

function requireSupabase() {
  if (!supabase) throw new Error('Supabase chua Duoc cau hinh.')
  return supabase
}

async function invokeManageTeacher(body) {
  const client = requireSupabase()
  const { data: sessionData, error: sessionError } = await client.auth.getSession()

  if (sessionError) {
    return { data: null, error: toSupabaseError(sessionError) }
  }

  const accessToken = sessionData.session?.access_token
  if (!accessToken) {
    return {
      data: null,
      error: { code: 'NO_SESSION', message: 'Vui long dang nhap lai.' },
    }
  }

  const { data, error } = await client.functions.invoke('manage-teacher', {
    body,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (error) {
    const normalized = toSupabaseError(error)
    if (error.context?.status === 401 || data?.code === 'UNAUTHORIZED') {
      return {
        data: null,
        error: { code: 'UNAUTHORIZED', message: 'Phien dang nhap Admin da het han. Vui long dang nhap lai.' },
      }
    }
    return { data: null, error: normalized }
  }

  if (!data?.ok) {
    return {
      data: null,
      error: {
        code: data?.code,
        message: data?.message || 'Khong the thuc hien yeu cau.',
      },
    }
  }

  return { data: data.data, error: null }
}

async function countTable(table) {
  const client = requireSupabase()
  const { count, error } = await client
    .from(table)
    .select('*', { count: 'exact', head: true })

  if (error) return { data: null, error: toSupabaseError(error) }
  return { data: count ?? 0, error: null }
}

export const adminService = {
  getDashboard: async () => {
    const { data, error } = await requireSupabase().rpc('admin_dashboard_summary')
    if (error) return { data: null, error: toSupabaseError(error) }
    if (!data?.ok) return { data: null, error: { code: data?.code, message: data?.code } }
    return { data: data.data, error: null }
  },

  getDashboardCounts: async () => {
    const tables = ['teachers', 'students', 'classes', 'users', 'payments']
    const results = await Promise.all(tables.map(countTable))
    const error = results.find((result) => result.error)?.error

    if (error) return { data: null, error }

    return {
      data: {
        teachers: results[0].data,
        students: results[1].data,
        classes: results[2].data,
        users: results[3].data,
        payments: results[4].data,
      },
      error: null,
    }
  },

  listTeachers: async () => {
    return invokeManageTeacher({ action: 'list' })
  },

  createTeacher: (values) => invokeManageTeacher({ action: 'create', ...values }),

  updateTeacher: (values) => invokeManageTeacher({ action: 'update', ...values }),

  deleteTeacher: (values) => invokeManageTeacher({ action: 'delete', ...values }),

  listStudents: async () => {
    const { data, error } = await requireSupabase()
      .from('students')
      .select(`
        id,
        full_name,
        age,
        grade_level,
        status,
        parent_id,
        users:parent_id(id, full_name, phone),
        enrollments(id, status, classes(id, class_name))
      `)
      .order('id')

    if (error) {
      return { data: null, error: toSupabaseError(error) }
    }

    return { data, error: null }
  },

  listClasses: () => requireSupabase().rpc('admin_list_classes'),

  getClassDetail: (classId) => requireSupabase().rpc('admin_get_class_detail', {
    p_class_id: classId,
  }),

  createClass: (values) => requireSupabase().rpc('admin_create_class', {
    p_class_name: values.className,
    p_teacher_id: values.teacherId,
    p_max_students: values.maxStudents,
    p_min_age: values.minAge,
    p_max_age: values.maxAge,
    p_first_day: values.firstDay,
    p_first_start_time: values.firstStart,
    p_second_day: values.secondDay,
    p_second_start_time: values.secondStart,
  }),

  updateClass: (values) => requireSupabase().rpc('admin_update_class', {
    p_class_id: values.classId,
    p_class_name: values.className,
    p_teacher_id: values.teacherId,
    p_max_students: values.maxStudents,
    p_min_age: values.minAge,
    p_max_age: values.maxAge,
    p_first_day: values.firstDay,
    p_first_start_time: values.firstStart,
    p_second_day: values.secondDay,
    p_second_start_time: values.secondStart,
  }),

  deleteClass: (classId) => requireSupabase().rpc('admin_delete_class', {
    p_class_id: classId,
  }),

  listPayments: () => requireSupabase()
    .from('payments')
    .select('*, enrollments(*, students(full_name), classes(class_name))')
    .order('paid_at', { ascending: false }),

  listNotifications: () => requireSupabase()
    .from('notifications')
    .select('*, users(full_name, role)')
    .order('created_at', { ascending: false }),


  createNotification: (values) => requireSupabase()
    .from('notifications')
    .insert(values)
    .select(),

  createEnrollment: (values) => requireSupabase()
    .from('enrollments')
    .insert(values)
    .select()
    .single(),
}
