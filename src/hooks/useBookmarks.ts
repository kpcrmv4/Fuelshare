'use client'

import { useState, useCallback, useEffect } from 'react'

const STORAGE_KEY = 'fuel_bookmarks_v1'

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<number[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setBookmarks(JSON.parse(raw))
    } catch { /* ignore */ }
  }, [])

  const save = useCallback((ids: number[]) => {
    setBookmarks(ids)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  }, [])

  const toggle = useCallback((id: number) => {
    setBookmarks((prev) => {
      const next = prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const has = useCallback((id: number) => bookmarks.includes(id), [bookmarks])

  return { bookmarks, toggle, has, count: bookmarks.length }
}
