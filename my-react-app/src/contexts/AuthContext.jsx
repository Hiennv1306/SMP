import { useEffect, useMemo, useState, useCallback } from 'react'
import { authService } from '../services/supabase/auth.service'
import { supabase } from '../config/supabase'
import { AuthContext } from './AuthContext.js'

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile(nextSession) {
    if (!nextSession?.user) {
      setProfile(null)
      setRole(null)
      return
    }

    if (!supabase) {
      setProfile(null)
      setRole(null)
      return
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', nextSession.user.id)
      .maybeSingle()

    if (error) {
      setProfile(null)
      setRole(null)
      return
    }

    setProfile(data)
    setRole(data?.role ?? null)
  }

  useEffect(() => {
    let subscription

    async function loadSession() {
      try {
        const { data } = await authService.getSession()
        setSession(data.session)
        setUser(data.session?.user ?? null)
        await loadProfile(data.session)
      } catch {
        setSession(null)
        setUser(null)
        setProfile(null)
        setRole(null)
      } finally {
        setLoading(false)
      }
    }

    try {
      const { data } = authService.onAuthStateChange((_event, nextSession) => {
        setSession(nextSession)
        setUser(nextSession?.user ?? null)
        loadProfile(nextSession)
        setLoading(false)
      })
      subscription = data.subscription
    } catch {
      // loadSession handles the missing or unavailable session state.
    }

    loadSession()

    return () => subscription?.unsubscribe()
  }, [])

  const signOut = useCallback(async () => {
    const { error } = role === 'admin'
      ? await authService.signOutAdmin()
      : await authService.signOut()
    if (!error) {
      setSession(null)
      setUser(null)
      setProfile(null)
      setRole(null)
    }
    return { error }
  }, [role])

  const value = useMemo(
    () => ({ session, user, profile, role, loading, signOut }),
    [session, user, profile, role, loading, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
