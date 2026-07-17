'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard,
  CreditCard,
  LogOut,
  Menu,
  X,
  User,
  Landmark
} from 'lucide-react'

interface Profile {
  id: string
  email: string
  role: string
  name: string
}

interface DashboardShellProps {
  profile: Profile
  children: React.ReactNode
}

export default function DashboardShell({ profile, children }: DashboardShellProps) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    if (typeof document !== 'undefined') {
      document.cookie = 'imex_mock_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    }
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Sidebar menu items based on role
  const menuItems = []

  if (profile.role === 'entrepreneur') {
    menuItems.push(
      { name: 'Konsol Kelayakan', href: '/usahawan', icon: LayoutDashboard },
      { name: 'Skim Pembiayaan', href: '/loans', icon: CreditCard }
    )
  } else if (profile.role === 'admin' || profile.role === 'mara_officer') {
    menuItems.push(
      { name: 'Konsol Pegawai', href: '/pegawai', icon: Landmark }
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row relative">
      {/* Mobile Menu Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800 w-full z-30">
        <div className="flex items-center gap-2">
          <Landmark className="w-6 h-6 text-teal-400" />
          <span className="font-extrabold text-sm text-white">MARA AI-Advisor</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-slate-400 hover:text-white"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-slate-900/60 border-r border-slate-850 flex flex-col justify-between p-6 z-20 transition-transform duration-300 md:transform-none ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="space-y-8">
          {/* Logo */}
          <div className="flex items-center gap-2 border-b border-slate-850 pb-4">
            <Landmark className="w-7 h-7 text-teal-400" />
            <div>
              <span className="font-black text-sm text-white block">MARA AI-Advisor</span>
              <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">MARA Ecosystem</span>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              const active = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                    active
                      ? 'bg-gradient-to-r from-teal-400 to-cyan-400 text-slate-950 shadow-md shadow-teal-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/50'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* User profile & Logout */}
        <div className="space-y-4 pt-4 border-t border-slate-850">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-teal-400 font-black">
              {profile.name?.charAt(0).toUpperCase() || <User className="w-4 h-4" />}
            </div>
            <div className="truncate">
              <span className="text-xs font-bold text-slate-200 block truncate">{profile.name}</span>
              <span className="text-[10px] text-slate-500 block truncate capitalize">{profile.role}</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Daftar Keluar</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl">
        {children}
      </main>
    </div>
  )
}
