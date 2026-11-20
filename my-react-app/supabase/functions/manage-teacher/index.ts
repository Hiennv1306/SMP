import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function normalizeVietnamesePhone(input: string) {
  const digits = String(input).replace(/\D/g, '')
  if (digits.startsWith('84')) return `+${digits}`
  if (digits.startsWith('0')) return `+84${digits.slice(1)}`
  return `+84${digits}`
}

function isE164(phone: string) {
  return /^\+[1-9]\d{7,14}$/.test(phone)
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const authorization = request.headers.get('Authorization') ?? ''

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
    })
    const { data: authData, error: authError } = await userClient.auth.getUser()
    if (authError || !authData.user) {
      return new Response(JSON.stringify({ ok: false, code: 'UNAUTHORIZED' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: caller } = await userClient
      .from('users')
      .select('role')
      .eq('auth_user_id', authData.user.id)
      .maybeSingle()

    if (caller?.role !== 'admin') {
      return new Response(JSON.stringify({ ok: false, code: 'FORBIDDEN' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await request.json()
    const action = body.action
    const admin = createClient(supabaseUrl, serviceRoleKey)

    if (action === 'list') {
      const { data: result, error: listError } = await userClient.rpc('admin_list_teachers')
      if (listError || !result?.ok) {
        return new Response(JSON.stringify({
          ok: false,
          code: 'LIST_FAILED',
          message: listError?.message || result?.code || 'Khong the tai danh sach giao vien.',
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      return new Response(JSON.stringify({ ok: true, data: result.data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'create') {
      const { email, phone, password, fullName, specialty, bio } = body
      if (!email || !phone || !password || !fullName) {
        return new Response(JSON.stringify({ ok: false, code: 'VALIDATION' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const normalizedPhone = normalizeVietnamesePhone(phone)
      if (!isE164(normalizedPhone)) {
        return new Response(JSON.stringify({
          ok: false,
          code: 'INVALID_PHONE',
          message: 'So dien thoai phai dung dinh dang E.164.',
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        phone: normalizedPhone,
        password,
        email_confirm: true,
        phone_confirm: true,
        user_metadata: { full_name: fullName, phone: normalizedPhone, role: 'teacher' },
      })

      if (createError) {
        return new Response(JSON.stringify({ ok: false, code: 'AUTH_CREATE_FAILED', message: createError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { data: result, error: rpcError } = await userClient.rpc('admin_create_teacher', {
        p_auth_user_id: created.user.id,
        p_phone: normalizedPhone,
        p_full_name: fullName,
        p_specialty: specialty || null,
        p_bio: bio || null,
      })

      if (rpcError || !result?.ok) {
        await admin.auth.admin.deleteUser(created.user.id)
        return new Response(JSON.stringify({ ok: false, code: rpcError?.code || result?.code }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({ ok: true, data: result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'update') {
      const { teacherId, authUserId, phone, email, fullName, specialty, bio, isActive } = body
      const normalizedPhone = normalizeVietnamesePhone(phone)
      if (!isE164(normalizedPhone)) {
        return new Response(JSON.stringify({
          ok: false,
          code: 'INVALID_PHONE',
          message: 'So dien thoai phai dung dinh dang E.164.',
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      const { data: result, error: rpcError } = await userClient.rpc('admin_update_teacher', {
        p_teacher_id: teacherId,
        p_phone: normalizedPhone,
        p_full_name: fullName,
        p_specialty: specialty,
        p_bio: bio,
        p_is_active: isActive,
      })

      if (rpcError || !result?.ok) {
        return new Response(JSON.stringify({ ok: false, code: rpcError?.code || result?.code }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if (authUserId) {
        await admin.auth.admin.updateUserById(authUserId, {
          email,
          phone: normalizedPhone,
          phone_confirm: true,
          email_confirm: true,
          ban_duration: isActive === false ? '876000h' : 'none',
          user_metadata: { full_name: fullName, phone: normalizedPhone, role: 'teacher' },
        })
      }

      return new Response(JSON.stringify({ ok: true, data: result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'delete') {
      const { teacherId, authUserId } = body
      const { data: result, error: rpcError } = await userClient.rpc('admin_delete_teacher', {
        p_teacher_id: teacherId,
      })

      if (rpcError || !result?.ok) {
        return new Response(JSON.stringify({ ok: false, code: rpcError?.code || result?.code }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if (authUserId) {
        await admin.auth.admin.updateUserById(authUserId, {
          ban_duration: '876000h',
        })
      }

      return new Response(JSON.stringify({ ok: true, data: result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ ok: false, code: 'INVALID_ACTION' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, code: 'INTERNAL_ERROR', message: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
