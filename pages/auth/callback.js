import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabaseBrowser } from '../../lib/supabaseClient'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    // The @supabase/auth-helpers-nextjs package automatically exchanges the
    // code for a session when using createPagesServerClient. On the client,
    // we just need to let the Supabase JS library finish its URL hash/code
    // exchange, then redirect.
    supabaseBrowser.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        router.replace('/?signedin=1')
      }
    })
  }, [router])

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f172a',
        color: '#f1f5f9',
        fontFamily: 'sans-serif',
      }}
    >
      <p style={{ fontSize: '1.1rem' }}>Signing you in…</p>
      <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem' }}>
        You will be redirected automatically.
      </p>
    </div>
  )
}
