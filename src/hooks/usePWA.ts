'use client'

import { useEffect, useState, useCallback, useRef } from 'react'

type InstallState = 'idle' | 'installable' | 'installed' | 'ios'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function usePWA() {
  const [state, setState] = useState<InstallState>('idle')
  const [showIosGuide, setShowIosGuide] = useState(false)
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    // Already installed as PWA?
    if (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone) {
      setState('installed')
      return
    }

    // iOS detection
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent)
    if (isIos) {
      setState('ios')
      return
    }

    // Listen for beforeinstallprompt (Chrome/Edge/Samsung)
    const handler = (e: Event) => {
      e.preventDefault()
      deferredPrompt.current = e as BeforeInstallPromptEvent
      setState('installable')
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Detect if app was installed
    window.addEventListener('appinstalled', () => {
      setState('installed')
      deferredPrompt.current = null
    })

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const install = useCallback(async () => {
    if (state === 'ios') {
      setShowIosGuide(true)
      return
    }

    if (!deferredPrompt.current) return

    await deferredPrompt.current.prompt()
    const { outcome } = await deferredPrompt.current.userChoice
    if (outcome === 'accepted') {
      setState('installed')
    }
    deferredPrompt.current = null
  }, [state])

  return {
    state,
    install,
    showIosGuide,
    closeIosGuide: () => setShowIosGuide(false),
  }
}
