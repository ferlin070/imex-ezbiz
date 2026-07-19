'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, CheckCheck, X } from 'lucide-react'
import Link from 'next/link'

interface Notification {
  id: string
  type: string
  title: string
  message: string | null
  link: string | null
  is_read: boolean
  created_at: string
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchNotifications()
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function fetchNotifications() {
    const [notifRes, countRes] = await Promise.all([
      fetch('/api/notifications'),
      fetch('/api/notifications/count'),
    ])
    if (notifRes.ok) {
      const data = await notifRes.json()
      setNotifications(data)
    }
    if (countRes.ok) {
      const { count } = await countRes.json()
      setUnreadCount(count)
    }
  }

  async function markAllRead() {
    const res = await fetch('/api/notifications', { method: 'PATCH' })
    if (res.ok) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)
    }
  }

  async function markRead(id: string) {
    const res = await fetch(`/api/notifications/${id}`, { method: 'PATCH' })
    if (res.ok) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      )
      setUnreadCount((c) => Math.max(0, c - 1))
    }
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}j`
    const days = Math.floor(hours / 24)
    return `${days}h`
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
        aria-label="Notifikasi"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-mara-red text-white text-[9px] font-black rounded-full flex items-center justify-center leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl shadow-black/50 z-50 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Notifikasi</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-[10px] font-bold text-mara-gold hover:text-mara-red transition cursor-pointer"
              >
                <CheckCheck className="w-3 h-3" />
                Baca Semua
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">Tiada notifikasi</div>
            ) : (
              notifications.slice(0, 20).map((notif) => {
                const content = (
                  <div
                    className={`flex items-start gap-3 px-4 py-3 border-b border-slate-800/50 hover:bg-slate-800/30 transition cursor-pointer ${
                      !notif.is_read ? 'bg-mara-red/[0.02]' : ''
                    }`}
                    onClick={() => {
                      if (!notif.is_read) markRead(notif.id)
                      setOpen(false)
                    }}
                  >
                    <div
                      className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                        notif.is_read ? 'bg-slate-700' : 'bg-mara-red'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-200 truncate">{notif.title}</p>
                      {notif.message && (
                        <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">{notif.message}</p>
                      )}
                      <p className="text-[9px] text-slate-600 mt-1 font-mono">{timeAgo(notif.created_at)}</p>
                    </div>
                  </div>
                )

                if (notif.link) {
                  return (
                    <Link key={notif.id} href={notif.link}>
                      {content}
                    </Link>
                  )
                }
                return <div key={notif.id}>{content}</div>
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
