'use client'

import { Download, X, Share } from 'lucide-react'
import { usePWA } from '@/hooks/usePWA'

export function InstallButton() {
  const { state, install, showIosGuide, closeIosGuide } = usePWA()

  // Hide if already installed or not applicable
  if (state === 'installed' || state === 'idle') return null

  return (
    <>
      <button
        onClick={install}
        className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-hover transition-colors text-accent"
        title="ติดตั้งแอป"
      >
        <Download size={16} />
      </button>

      {/* iOS Install Guide Modal */}
      {showIosGuide ? (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center p-4" onClick={closeIosGuide}>
          <div
            className="bg-surface rounded-2xl w-full max-w-sm p-5 space-y-4 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-text">ติดตั้งแอป</h3>
              <button onClick={closeIosGuide} className="text-muted hover:text-text">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-accent/15 text-accent flex items-center justify-center shrink-0 text-sm font-bold">1</div>
                <p className="text-sm text-sub pt-0.5">
                  กดปุ่ม <Share size={14} className="inline text-accent mx-0.5" /> <span className="font-medium text-text">Share</span> ที่แถบด้านล่างของ Safari
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-accent/15 text-accent flex items-center justify-center shrink-0 text-sm font-bold">2</div>
                <p className="text-sm text-sub pt-0.5">
                  เลื่อนลงแล้วกด <span className="font-medium text-text">&quot;Add to Home Screen&quot;</span>
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-accent/15 text-accent flex items-center justify-center shrink-0 text-sm font-bold">3</div>
                <p className="text-sm text-sub pt-0.5">
                  กด <span className="font-medium text-text">&quot;Add&quot;</span> เพื่อติดตั้ง
                </p>
              </div>
            </div>

            <button
              onClick={closeIosGuide}
              className="w-full bg-accent text-white py-2.5 rounded-xl font-medium text-sm"
            >
              เข้าใจแล้ว
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}
