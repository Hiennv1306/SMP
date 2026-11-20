import { supabase } from '../../config/supabase'

function requireSupabase() {
  if (!supabase) throw new Error('Supabase chua Duoc cau hinh.')
  return supabase
}

export async function getCurrentParent() {
  const client = requireSupabase()
  const { data: sessionData } = await client.auth.getSession()
  const authUserId = sessionData.session?.user.id

  if (!authUserId) {
    return { data: null, error: { message: 'Chua Dang nhap.' } }
  }

  return client
    .from('users')
    .select('id, students(*)')
    .eq('auth_user_id', authUserId)
    .single()
}

export const parentService = {
  getChildren: async () => {
    const client = requireSupabase()
    const { data: sessionData } = await client.auth.getSession()
    const authUserId = sessionData.session?.user.id

    if (!authUserId) return { data: null, error: { message: 'Chua Dang nhap.' } }

    return client
      .from('users')
      .select('id, students(*)')
      .eq('auth_user_id', authUserId)
      .single()
  },

  addChild: async ({ fullName, age, gradeLevel, status = 'active' }) => {
    const client = requireSupabase()
    const { data: sessionData } = await client.auth.getSession()
    const authUserId = sessionData.session?.user.id

    if (!authUserId) return { data: null, error: { message: 'Chua Dang nhap.' } }

    const { data: parent, error: parentError } = await client
      .from('users')
      .select('id')
      .eq('auth_user_id', authUserId)
      .maybeSingle()

    if (parentError) return { data: null, error: parentError }
    if (!parent) return { data: null, error: { message: 'Khong tim thay ho so phu huynh.' } }

    const { count, error: countError } = await client
      .from('students')
      .select('id', { count: 'exact', head: true })
      .eq('parent_id', parent.id)
      .neq('status', 'inactive')

    if (countError) return { data: null, error: countError }
    if ((count ?? 0) >= 2) {
      return { data: null, error: { message: 'Moi phu huynh chi Duoc Dang ky toi Da 2 con.' } }
    }

    return client
      .from('students')
      .insert({
        parent_id: parent.id,
        full_name: fullName,
        age,
        grade_level: gradeLevel,
        status,
      })
      .select()
      .single()
  },

  updateChild: (studentId, values) => requireSupabase()
    .from('students')
    .update(values)
    .eq('id', studentId)
    .select()
    .single(),

  discoverClasses: (studentId = null) => {
    if (!requireSupabase()) {
      return Promise.resolve({ data: null, error: { message: 'Supabase chua Duoc cau hinh.' } })
    }

    return requireSupabase().rpc('parent_list_discoverable_classes', {
      p_student_id: studentId,
    })
  },

  listEnrollments: async () => {
    const client = requireSupabase()
    const { data: sessionData } = await client.auth.getSession()
    const authUserId = sessionData.session?.user.id

    if (!authUserId) return { data: null, error: { message: 'Chua Dang nhap.' } }

    const { data: parent, error: parentError } = await client
      .from('users')
      .select('id')
      .eq('auth_user_id', authUserId)
      .maybeSingle()

    if (parentError) return { data: null, error: parentError }
    if (!parent) return { data: [], error: null }

    return client
      .from('enrollments')
      .select('*, students!inner(parent_id, full_name), classes(*)')
      .eq('students.parent_id', parent.id)
  },

  listPayments: async (studentId) => {
    let query = requireSupabase()
      .from('payments')
      .select('*, enrollments!inner(student_id, classes(class_name))')

    if (studentId) query = query.eq('enrollments.student_id', studentId)
    return query.order('paid_at', { ascending: false })
  },

  listNotifications: async () => {
    const client = requireSupabase()
    const { data: sessionData } = await client.auth.getSession()
    const authUserId = sessionData.session?.user.id

    if (!authUserId) return { data: null, error: { message: 'Chua Dang nhap.' } }

    const { data: user } = await client
      .from('users')
      .select('id')
      .eq('auth_user_id', authUserId)
      .maybeSingle()

    if (!user) return { data: [], error: null }

    return client
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
  },

  markNotificationRead: (notificationId) => requireSupabase()
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .select()
    .single(),
}
