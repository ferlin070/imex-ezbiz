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
  Landmark,
  Settings,
  ChevronRight,
} from 'lucide-react'
import NotificationBell from '@/components/NotificationBell'

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
    await supabase.auth.signOut()
    router.push('/login')
  }

  const menuItems: { name: string; href: string; icon: any }[] = []

  if (profile.role === 'entrepreneur') {
    menuItems.push(
      { name: 'Konsol Kelayakan', href: '/usahawan', icon: LayoutDashboard },
      { name: 'Profil Syarikat', href: '/usahawan/syarikat', icon: Landmark },
      { name: 'Skim Pembiayaan', href: '/loans', icon: CreditCard },
      { name: 'Profil & Tetapan', href: '/tetapan', icon: Settings }
    )
  } else if (profile.role === 'admin' || profile.role === 'mara_officer') {
    menuItems.push(
      { name: 'Konsol Pegawai', href: '/pegawai', icon: Landmark },
      { name: 'Profil & Tetapan', href: '/tetapan', icon: Settings }
    )
  }

  const roleLabel =
    profile.role === 'entrepreneur' ? 'Usahawan' :
    profile.role === 'admin' ? 'Pentadbir' : 'Pegawai MARA'

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row relative">

      {/* Mobile Top Bar — sticky so content scrolls below it */}
      <div className="md:hidden flex items-center justify-between px-4 py-3.5 bg-slate-900/90 border-b border-slate-800 w-full z-30 backdrop-blur-md sticky top-0">
        <div className="flex items-center gap-2">
          <Landmark className="w-5 h-5 text-mara-red" />
          <span className="font-extrabold text-sm text-white">MARA AI-Advisor</span>
        </div>
        <div className="flex items-center gap-1">
          <NotificationBell />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Buka / tutup menu navigasi"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile backdrop — clicking it closes the sidebar */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-10 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-6 z-20 transition-transform duration-300 ease-in-out md:transform-none ${
          mobileMenuOpen ? 'translate-x-0 shadow-2xl shadow-black/60' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="space-y-8">
          {/* Brand Logo */}
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-mara-red to-mara-gold flex items-center justify-center shadow-lg shadow-mara-red/20 shrink-0">
              <Landmark className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <span className="font-black text-sm text-white block leading-none">MARA AI-Advisor</span>
              <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider mt-0.5">MARA Ecosystem</span>
            </div>
            <div className="hidden md:block">
              <NotificationBell />
            </div>
          </div>

          {/* Nav Links */}
          <nav className="space-y-1">
            {menuItems.map((item, index) => {
              const Icon = item.icon
              const active = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ animationDelay: `${index * 60}ms` }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all animate-slide-in-left ${
                    active
                      ? 'bg-gradient-to-r from-mara-red to-mara-gold text-white shadow-md shadow-mara-red/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1">{item.name}</span>
                  {active && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* User info & Logout */}
        <div className="space-y-3 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-800 to-slate-700 border border-slate-700 flex items-center justify-center text-mara-red font-black text-sm shrink-0">
              {profile.name?.charAt(0)?.toUpperCase() || <User className="w-4 h-4" />}
            </div>
            <div className="truncate">
              <span className="text-xs font-bold text-slate-200 block truncate">{profile.name || 'Pengguna'}</span>
              <span className="text-[10px] text-mara-gold block truncate font-semibold">{roleLabel}</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all border border-transparent hover:border-rose-500/20"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Daftar Keluar</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto min-w-0">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
