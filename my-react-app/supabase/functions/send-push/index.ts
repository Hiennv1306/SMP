import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authorization = request.headers.get('Authorization') ?? ''
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')!
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!
    const vapidSubject = Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@educenter.vn'

    if (!vapidPublicKey || !vapidPrivateKey) {
      return new Response(JSON.stringify({ ok: false, code: 'VAPID_NOT_CONFIGURED' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)

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

    if (!caller || !['admin', 'teacher'].includes(caller.role)) {
      return new Response(JSON.stringify({ ok: false, code: 'FORBIDDEN' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await request.json()
    const targetAuthUserIds = Array.isArray(body.authUserIds)
      ? body.authUserIds
      : []

    if (!targetAuthUserIds.length) {
      return new Response(JSON.stringify({ ok: false, code: 'NO_TARGETS' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const admin = createClient(supabaseUrl, serviceRoleKey)
    const { data: subscriptions, error: subscriptionError } = await admin
      .from('push_subscriptions')
      .select('auth_user_id, subscription')
      .in('auth_user_id', targetAuthUserIds)

    if (subscriptionError) {
      return new Response(JSON.stringify({ ok: false, code: 'SUBSCRIPTIONS_ERROR' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const payload = JSON.stringify({
      title: body.title || 'EduCenter',
      body: body.body || 'Ban co thong bao moi.',
      url: body.url || '/',
    })

    const results = await Promise.allSettled(
      (subscriptions || []).map((item) =>
        webpush.sendNotification(item.subscription, payload),
      ),
    )

    const sent = results.filter((item) => item.status === 'fulfilled').length
    const failed = results.length - sent

    return new Response(JSON.stringify({ ok: true, sent, failed }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({
      ok: false,
      code: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
