import { supabase } from '../config/supabase'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(base64)
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)))
}

export async function enablePushNotifications() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { ok: false, code: 'UNSUPPORTED', message: 'Thiet bi khong ho tro Push Notification.' }
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    return { ok: false, code: 'PERMISSION_DENIED', message: 'Nguoi dung tu choi thong bao.' }
  }

  const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY?.trim()
  if (!publicKey) {
    return { ok: false, code: 'VAPID_NOT_CONFIGURED', message: 'Chua cau hinh VAPID public key.' }
  }

  const registration = await navigator.serviceWorker.ready
  let subscription = await registration.pushManager.getSubscription()

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    })
  }

  if (supabase) {
    const { data: sessionData } = await supabase.auth.getSession()
    if (sessionData.session) {
      await supabase
        .from('push_subscriptions')
        .upsert({
          auth_user_id: sessionData.session.user.id,
          subscription: subscription.toJSON(),
        }, { onConflict: 'auth_user_id' })
    }
  }

  localStorage.setItem('edu_push_subscription', JSON.stringify(subscription.toJSON()))
  return { ok: true, subscription: subscription.toJSON() }
}

export async function getPushPermissionStatus() {
  if (!('Notification' in window)) return 'unsupported'
  return Notification.permission
}
