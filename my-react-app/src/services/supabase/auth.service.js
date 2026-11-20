import { supabase } from '../../config/supabase'
import { toSupabaseError } from '../../utils/errorHandler'

function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase chua Duoc cau hinh. Xem .env.example.')
  }

  return supabase
}

function normalizeVietnamesePhone(phone) {
  const digits = String(phone).trim().replace(/[^\d+]/g, '')
  if (digits.startsWith('+84')) return digits
  if (digits.startsWith('84')) return `+${digits}`
  if (digits.startsWith('0')) return `+84${digits.slice(1)}`
  return `+84${digits}`
}

export const authService = {
  getSession() {
    return requireSupabase().auth.getSession()
  },

  getUser() {
    return requireSupabase().auth.getUser()
  },

  signIn(email, password) {
    return requireSupabase().auth.signInWithPassword({ email, password })
  },

  async signInAdmin(email, password) {
    const client = requireSupabase()
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { data: null, error: toSupabaseError(error, 'Dang nhap Admin that bai.') }
    }

    if (!data.user) {
      return {
        data: null,
        error: { message: 'Khong tim thay tai khoan nguoi dung.' },
      }
    }

    const { data: profile, error: profileError } = await client
      .from('users')
      .select('id, auth_user_id, full_name, phone, role')
      .eq('auth_user_id', data.user.id)
      .maybeSingle()

    if (profileError) {
      await client.auth.signOut()
      return {
        data: null,
        error: toSupabaseError(profileError, 'Khong the kiem tra ho so Admin.'),
      }
    }

    if (!profile || profile.role !== 'admin') {
      await client.auth.signOut()
      return {
        data: null,
        error: { code: 'NOT_ADMIN', message: 'Tai khoan nay khong co quyen Admin.' },
      }
    }

    return {
      data: {
        session: data.session,
        user: data.user,
        profile,
      },
      error: null,
    }
  },

  async getAdminSession() {
    const client = requireSupabase()
    const { data: sessionData, error: sessionError } = await client.auth.getSession()

    if (sessionError) {
      return { data: null, error: toSupabaseError(sessionError) }
    }

    const authUser = sessionData.session?.user
    if (!authUser) {
      return { data: null, error: { code: 'NO_SESSION', message: 'Chua Dang nhap.' } }
    }

    const { data: profile, error: profileError } = await client
      .from('users')
      .select('id, auth_user_id, full_name, phone, role')
      .eq('auth_user_id', authUser.id)
      .maybeSingle()

    if (profileError) {
      return { data: null, error: toSupabaseError(profileError) }
    }

    if (!profile || profile.role !== 'admin') {
      return { data: null, error: { code: 'NOT_ADMIN', message: 'Tai khoan nay khong co quyen Admin.' } }
    }

    return {
      data: {
        session: sessionData.session,
        user: authUser,
        profile,
      },
      error: null,
    }
  },

  async signOutAdmin() {
    const client = requireSupabase()
    const { data: sessionData } = await client.auth.getSession()

    if (!sessionData.session) {
      return { data: { signedOut: true }, error: null }
    }

    const { error } = await client.auth.signOut({ scope: 'global' })
    if (error) {
      return { data: null, error: toSupabaseError(error, 'Dang xuat Admin that bai.') }
    }

    return { data: { signedOut: true }, error: null }
  },

  async signInTeacher(email, password) {
    const client = requireSupabase()
    const { data, error } = await client.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) {
      return {
        data: null,
        error: toSupabaseError(error, 'Dang nhap giao vien that bai.')
      }
    }

    if (!data.user) {
      return {
        data: null,
        error: { code: 'USER_NOT_FOUND', message: 'Khong tim thay tai khoan giao vien.' }
      }
    }

    const { data: profile, error: profileError } = await client
      .from('users')
      .select('id, auth_user_id, full_name, phone, role, is_active')
      .eq('auth_user_id', data.user.id)
      .maybeSingle()

    if (profileError) {
      await client.auth.signOut()
      return {
        data: null,
        error: toSupabaseError(profileError, 'Khong the kiem tra ho so giao vien.')
      }
    }

    if (!profile || profile.role !== 'teacher') {
      await client.auth.signOut()
      return {
        data: null,
        error: { code: 'NOT_TEACHER', message: 'Tai khoan nay khong phai tai khoan giao vien.' }
      }
    }

    if (profile.is_active === false) {
      await client.auth.signOut()
      return {
        data: null,
        error: { code: 'TEACHER_INACTIVE', message: 'Tai khoan giao vien dang bi tam dung.' }
      }
    }

    return {
      data: {
        session: data.session,
        user: data.user,
        profile,
      },
      error: null,
    }
  },

  async signUpParent({ password, fullName, phone, childName, childAge, gradeLevel }) {
    const client = requireSupabase()
    const normalizedPhone = normalizeVietnamesePhone(phone)

    if (!normalizedPhone) {
      return {
        data: null,
        error: { code: 'PHONE_REQUIRED', message: 'Vui long nhap so Dien thoai.' },
      }
    }

    const { data, error } = await client.auth.signUp({
      phone: normalizedPhone,
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          phone: normalizedPhone,
          role: 'parent',
          child_name: childName.trim(),
          child_age: Number(childAge),
          grade_level: gradeLevel.trim(),
        },
      },
    })

    if (error) {
      return { data: null, error: toSupabaseError(error, 'Dang ky phu huynh that bai.') }
    }

    if (data.user && data.session) {
      const { data: profile, error: profileError } = await client
        .from('users')
        .select('id, auth_user_id, full_name, phone, role')
        .eq('auth_user_id', data.user.id)
        .maybeSingle()

      if (profileError) {
        return { data: null, error: toSupabaseError(profileError) }
      }

      if (!profile || profile.role !== 'parent') {
        await client.auth.signOut()
        return {
          data: null,
          error: { code: 'PARENT_PROFILE_NOT_CREATED', message: 'Tai khoan Da tao nhung ho so phu huynh chua san sang.' },
        }
      }

      return { data: { session: data.session, user: data.user, profile }, error: null }
    }

    return {
      data: {
        user: data.user,
        session: null,
        confirmationRequired: true,
      },
      error: null,
    }
  },

  async signInParent(phone, password) {
    const client = requireSupabase()
    const normalizedPhone = normalizeVietnamesePhone(phone)
    const { data, error } = await client.auth.signInWithPassword({
      phone: normalizedPhone,
      password,
    })

    if (error) {
      return { data: null, error: toSupabaseError(error, 'Dang nhap phu huynh that bai.') }
    }

    if (!data.user) {
      return {
        data: null,
        error: { message: 'Khong tim thay tai khoan nguoi dung.' },
      }
    }

    const { data: profile, error: profileError } = await client
      .from('users')
      .select('id, auth_user_id, full_name, phone, role')
      .eq('auth_user_id', data.user.id)
      .maybeSingle()

    if (profileError) {
      await client.auth.signOut()
      return {
        data: null,
        error: toSupabaseError(profileError, 'Khong the kiem tra ho so phu huynh.'),
      }
    }

    if (!profile || profile.role !== 'parent') {
      await client.auth.signOut()
      return {
        data: null,
        error: { code: 'NOT_PARENT', message: 'Tai khoan nay khong phai tai khoan phu huynh.' },
      }
    }

    return {
      data: {
        session: data.session,
        user: data.user,
        profile,
      },
      error: null,
    }
  },

  signUp(email, password, metadata = {}) {
    return requireSupabase().auth.signUp({
      email,
      password,
      options: { data: metadata },
    })
  },

  signOut() {
    return requireSupabase().auth.signOut()
  },

  resetPassword(email, redirectTo) {
    return requireSupabase().auth.resetPasswordForEmail(email, { redirectTo })
  },

  onAuthStateChange(callback) {
    return requireSupabase().auth.onAuthStateChange(callback)
  },
}
