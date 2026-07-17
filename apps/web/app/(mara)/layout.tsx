import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function MaraLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/mara/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || (profile.role !== 'mara_officer' && profile.role !== 'admin')) {
    redirect('/mara/login')
  }

  return <>{children}</>
}
