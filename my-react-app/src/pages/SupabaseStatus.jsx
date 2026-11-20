import { useEffect, useState } from 'react'
import { testSupabaseConnection } from '../services/supabase/connection.service'

function SupabaseStatus() {
  const [result, setResult] = useState({
    status: 'checking',
    message: 'Dang kiem tra ket noi...',
  })

  useEffect(() => {
    let active = true

    testSupabaseConnection().then((nextResult) => {
      if (active) {
        setResult(nextResult)
      }
    })

    return () => {
      active = false
    }
  }, [])

  return (
    <section id="center">
      <h1>Trang thai Supabase</h1>
      <p>{result.message}</p>
      {import.meta.env.DEV && (
        <code>Ket noi: {result.status}</code>
      )}
    </section>
  )
}

export default SupabaseStatus
