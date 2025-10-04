"use client"
import React, { useEffect, useState } from 'react'

export default function DebugOverlay() {
  const [info, setInfo] = useState<any>(null)
  const [headers, setHeaders] = useState<Record<string, string>>({})

  useEffect(() => {
    if (typeof window === 'undefined') return
    const url = new URL(window.location.href)
    if (url.searchParams.get('debug') !== '1') return

    fetch('/api/debug/status')
      .then(r => r.json())
      .then(setInfo)
      .catch(() => {})

    // Try to read middleware debug headers via a HEAD request to current path
    fetch(url.pathname + url.search, { method: 'HEAD' })
      .then(r => {
        const h: Record<string, string> = {}
        r.headers.forEach((v, k) => { if (k.startsWith('x-debug')) h[k] = v })
        setHeaders(h)
      })
      .catch(() => {})
  }, [])

  const url = typeof window !== 'undefined' ? new URL(window.location.href) : null
  if (!url || url.searchParams.get('debug') !== '1') return null

  return (
    <div style={{ position: 'fixed', right: 8, bottom: 8, zIndex: 9999 }}>
      <details open style={{ background: '#111827', color: 'white', padding: 12, borderRadius: 8, width: 360 }}>
        <summary>Debug</summary>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify({ headers, info }, null, 2)}</pre>
      </details>
    </div>
  )
}


