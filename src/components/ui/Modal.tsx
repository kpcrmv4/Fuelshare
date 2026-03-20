'use client'

import { useEffect, useRef, type ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open) {
      dialog.showModal()
    } else {
      dialog.close()
    }
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="fixed inset-0 m-0 p-0 w-full h-full max-w-full max-h-full bg-transparent backdrop:bg-black/50 md:flex md:items-center md:justify-center"
    >
      <div className="absolute bottom-0 left-0 right-0 md:relative md:bottom-auto md:max-w-lg md:w-full md:mx-auto bg-surface rounded-t-2xl md:rounded-2xl shadow-2xl max-h-[85vh] flex flex-col animate-[slideUp_0.3s]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-text">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-hover text-muted"
          >
            ✕
          </button>
        </div>
        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {children}
        </div>
      </div>
    </dialog>
  )
}
