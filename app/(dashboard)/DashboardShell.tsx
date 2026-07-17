'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard,
  Trophy,
  MapPin,
  CreditCard,
  FileText,
  LogOut,
  Menu,
  X,
  User,
  FolderGit2
} from 'lucide-react'

interface Profile {
  id: string
  email: string
  role: 'judge' | 'entrepreneur' | 'admin' | 'mara_officer'
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
    // Write cookie deletion on client side for mock session cleanup
    if (typeof document !== 'undefined') {
      document.cookie = 'imex_mock_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    }
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Define sidebar menu items based on role
  const menuItems = []

  if (profile.role === 'entrepreneur') {
    menuItems.push(
      { name: 'Dashboard Projek', href: '/usahawan', icon: LayoutDashboard },
      { name: 'Daftar Projek Baru', href: '/usahawan/projek/daftar', icon: FolderGit2 },
      { name: 'Skim Pinjaman', href: '/loans', icon: CreditCard }
    )
  } else if (profile.role === 'admin') {
    menuItems.push(
      { name: 'Pengurusan Event', href: '/admin/events', icon: Trophy },
      { name: 'Pengurusan Tempat', href: '/admin/venues', icon: MapPin },
      { name: 'Produk Pinjaman', href: '/admin/loan-products', icon: CreditCard },
      { name: 'Skim Geran', href: '/admin/grant-schemes', icon: FileText }
    )
  } else if (profile.role === 'judge') {
    menuItems.push(
      { name: 'Konsol Penilaian', href: '/juror', icon: Trophy }
    )
  }

  const roleLabels: Record<string, string> = {
    admin: 'Pentadbir (Admin)',
    judge: 'Juri Penilai',
    entrepreneur: 'Usahawan',
    mara_officer: 'Pegawai MARA'
  }

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex md:flex-col md:w-64 bg-slate-950 border-r border-slate-800">
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
          <Link href="/" className="text-xl font-bold bg-gradient-to-r from-teal-400 to-cyan-500 bg-clip-text text-transparent flex items-center gap-2">
            <Trophy className="h-6 w-6 text-teal-400" />
            IMEX EzBiz
          </Link>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-teal-500/20 to-cyan-500/10 text-teal-300 border border-teal-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                }`}
              >
                <Icon className={`h-5 w-5 transition-transform duration-200 group-hover:scale-110 ${
                  isActive ? 'text-teal-400' : 'text-slate-500 group-hover:text-slate-400'
                }`} />
                <span className="font-medium text-sm">{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* User profile section */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3 px-2 py-3 rounded-xl bg-slate-900 border border-slate-800 mb-2">
            <div className="h-9 w-9 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-400 font-bold border border-teal-500/20">
              <User className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate text-slate-200">{profile.name}</p>
              <p className="text-xs text-slate-500 truncate">{roleLabels[profile.role] || profile.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 rounded-xl transition-all duration-200"
          >
            <LogOut className="h-4 w-4" />
            Log Keluar
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header bar */}
        <header className="h-16 flex items-center justify-between px-6 bg-slate-950 md:bg-slate-900/40 border-b border-slate-800/80 md:border-transparent z-10">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900"
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="flex items-center gap-4 ml-auto">
            <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-400/10 text-teal-300 border border-teal-400/20">
              {roleLabels[profile.role]}
            </span>
          </div>
        </header>

        {/* Page children */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950">
          {children}
        </main>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 flex z-40 md:hidden animate-fade-in">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          ></div>

          {/* Drawer Body */}
          <div className="relative flex flex-col w-full max-w-xs bg-slate-950 border-r border-slate-800 text-slate-100 p-6 animate-slide-in">
            <div className="flex items-center justify-between mb-8">
              <span className="text-xl font-bold bg-gradient-to-r from-teal-400 to-cyan-500 bg-clip-text text-transparent flex items-center gap-2">
                <Trophy className="h-6 w-6 text-teal-400" />
                IMEX EzBiz
              </span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <nav className="flex-1 space-y-1">
              {menuItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-teal-500/20 to-cyan-500/10 text-teal-300 border border-teal-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <Icon className="h-5 w-5 text-teal-400" />
                    <span className="font-medium text-sm">{item.name}</span>
                  </Link>
                )
              })}
            </nav>

            <div className="mt-auto pt-6 border-t border-slate-800">
              <div className="flex items-center gap-3 px-2 py-3 rounded-xl bg-slate-900 border border-slate-800 mb-4">
                <div className="h-8 w-8 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-400 font-bold">
                  <User className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate text-slate-200">{profile.name}</p>
                  <p className="text-xs text-slate-500 truncate">{roleLabels[profile.role]}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/10 rounded-xl transition-all duration-200"
              >
                <LogOut className="h-4 w-4" />
                Log Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
