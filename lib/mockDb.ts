// Mock Database for IMEX AI-Biz MVP fallback mode
// This allows the app to be fully functional locally even when Supabase URL is invalid/dummy.

export interface MockProject {
  id: string
  event_id: string
  title: string
  description: string
  category: string
  team_members: string[]
  owner_user_id: string | null
}

export interface MockCriterion {
  id: string
  event_id: string
  code: string
  label: string
  max_score: number
  weight: number
  sort_order: number
}

export interface MockJudge {
  id: string
  event_id: string
  user_id: string
  panel_label: string
  name: string
}

export interface MockScore {
  id: string
  project_id: string
  judge_id: string
  criteria_id: string
  score: number
}

export interface MockReport {
  id: string
  project_id: string
  feasibility_score: number
  feasibility_tier: string
  swot: any
  blueprint: any
  pitch_script: string
  grant_notes: any
  generated_at: string
}

// In-memory data store mimicking the Supabase seeds
const mockEvent = {
  id: 'e1111111-1111-1111-1111-111111111111',
  name: 'Festival Inovasi IKM Besut 2026',
  slug: 'ikm-besut-2026',
  status: 'active',
}

const mockCriteria: MockCriterion[] = [
  { id: 'c1111111-1111-1111-1111-111111111111', event_id: mockEvent.id, code: 'A', label: 'Persembahan', max_score: 65, weight: 1.5, sort_order: 1 },
  { id: 'c2222222-2222-2222-2222-222222222222', event_id: mockEvent.id, code: 'B', label: 'Semangat Berpasukan', max_score: 40, weight: 1.0, sort_order: 2 },
  { id: 'c3333333-3333-3333-3333-333333333333', event_id: mockEvent.id, code: 'C', label: 'Idea Boleh Dipasarkan', max_score: 65, weight: 2.0, sort_order: 3 },
]

const mockProjects: MockProject[] = [
  {
    id: 'p1111111-1111-1111-1111-111111111111',
    event_id: mockEvent.id,
    title: 'F.O.C.U.S DRIVE',
    description: 'Sistem pemanduan pintar berasaskan IoT untuk mengurangkan kemalangan jalan raya akibat keletihan pemandu dengan memantau pergerakan mata dan memberikan amaran masa nyata.',
    category: 'Automotif & IoT',
    team_members: ['Ahmad', 'Ali', 'Abu'],
    owner_user_id: 'b1111111-1111-1111-1111-111111111111',
  },
  {
    id: 'p2222222-2222-2222-2222-222222222222',
    event_id: mockEvent.id,
    title: 'FOOD DRYER',
    description: 'Mesin pengering makanan berasaskan tenaga solar hibrid dengan kawalan suhu automatik untuk kegunaan usahawan mikro desa memproses hasil tani dengan lebih cepat.',
    category: 'Teknologi Makanan',
    team_members: ['Siti', 'Sarah'],
    owner_user_id: 'b2222222-2222-2222-2222-222222222222',
  },
  {
    id: 'p3333333-3333-3333-3333-333333333333',
    event_id: mockEvent.id,
    title: 'Smart Grass Chopper',
    description: 'Alat pemotong rumput pintar yang dikawal melalui aplikasi telefon pintar dengan sensor pengesanan halangan untuk keselamatan dan kecekapan penyelenggaraan landskap.',
    category: 'Mekanikal & Robotik',
    team_members: ['Chong', 'Muthu'],
    owner_user_id: null,
  },
  {
    id: 'p4444444-4444-4444-4444-444444444444',
    event_id: mockEvent.id,
    title: 'Mobile Poison Sprayer',
    description: 'Mesin penyembur racun tanaman mudah alih berautonomi menggunakan roda berkuasa tinggi untuk aplikasi sektor pertanian pintar berskala kecil.',
    category: 'Pertanian Pintar',
    team_members: ['Wan', 'Zaki'],
    owner_user_id: null,
  },
]

const mockJudges: MockJudge[] = [
  { id: 'j1111111-1111-1111-1111-111111111111', event_id: mockEvent.id, user_id: 'a1111111-1111-1111-1111-111111111111', panel_label: 'Panel 1', name: 'Encik Khairul' },
  { id: 'j2222222-2222-2222-2222-222222222222', event_id: mockEvent.id, user_id: 'a2222222-2222-2222-2222-222222222222', panel_label: 'Panel 2', name: 'Puan Zaimah' },
  { id: 'j3333333-3333-3333-3333-333333333333', event_id: mockEvent.id, user_id: 'a3333333-3333-3333-3333-333333333333', panel_label: 'Panel 3', name: 'Dr. Firdaus' },
]

// Initialize mock scores with preseeded scores for F.O.C.U.S DRIVE
const initialScores: MockScore[] = [
  { id: 's1', project_id: 'p1111111-1111-1111-1111-111111111111', judge_id: 'j1111111-1111-1111-1111-111111111111', criteria_id: 'c1111111-1111-1111-1111-111111111111', score: 58 },
  { id: 's2', project_id: 'p1111111-1111-1111-1111-111111111111', judge_id: 'j1111111-1111-1111-1111-111111111111', criteria_id: 'c2222222-2222-2222-2222-222222222222', score: 32 },
  { id: 's3', project_id: 'p1111111-1111-1111-1111-111111111111', judge_id: 'j1111111-1111-1111-1111-111111111111', criteria_id: 'c3333333-3333-3333-3333-333333333333', score: 55 },
  { id: 's4', project_id: 'p1111111-1111-1111-1111-111111111111', judge_id: 'j2222222-2222-2222-2222-222222222222', criteria_id: 'c1111111-1111-1111-1111-111111111111', score: 60 },
  { id: 's5', project_id: 'p1111111-1111-1111-1111-111111111111', judge_id: 'j2222222-2222-2222-2222-222222222222', criteria_id: 'c2222222-2222-2222-2222-222222222222', score: 35 },
  { id: 's6', project_id: 'p1111111-1111-1111-1111-111111111111', judge_id: 'j2222222-2222-2222-2222-222222222222', criteria_id: 'c3333333-3333-3333-3333-333333333333', score: 58 },
  { id: 's7', project_id: 'p1111111-1111-1111-1111-111111111111', judge_id: 'j3333333-3333-3333-3333-333333333333', criteria_id: 'c1111111-1111-1111-1111-111111111111', score: 55 },
  { id: 's8', project_id: 'p1111111-1111-1111-1111-111111111111', judge_id: 'j3333333-3333-3333-3333-333333333333', criteria_id: 'c2222222-2222-2222-2222-222222222222', score: 30 },
  { id: 's9', project_id: 'p1111111-1111-1111-1111-111111111111', judge_id: 'j3333333-3333-3333-3333-333333333333', criteria_id: 'c3333333-3333-3333-3333-333333333333', score: 52 },
]

// Global simulation storage in Node.js server environment memory (survives requests but not server resets)
let globalScores: MockScore[] = [...initialScores]
let globalReports: MockReport[] = []
let globalProjects: MockProject[] = [...mockProjects]

export const mockDb = {
  getEventBySlug: (slug: string) => {
    return mockEvent.slug === slug ? mockEvent : null
  },
  getCriteriaByEventId: (eventId: string) => {
    return mockCriteria.filter((c) => c.event_id === eventId)
  },
  getProjectsByEventId: (eventId: string) => {
    return globalProjects.filter((p) => p.event_id === eventId)
  },
  getProjectById: (projectId: string) => {
    return globalProjects.find((p) => p.id === projectId) || null
  },
  getScoresByProjectId: (projectId: string) => {
    return globalScores.filter((s) => s.project_id === projectId)
  },
  getScoresByEvent: (eventId: string) => {
    // Return scores for projects belonging to this event
    const eventProjIds = globalProjects.filter((p) => p.event_id === eventId).map((p) => p.id)
    return globalScores.filter((s) => eventProjIds.includes(s.project_id))
  },
  submitScore: (projectId: string, judgeId: string, criteriaId: string, score: number) => {
    const index = globalScores.findIndex(
      (s) => s.project_id === projectId && s.judge_id === judgeId && s.criteria_id === criteriaId
    )
    if (index > -1) {
      globalScores[index].score = score
    } else {
      globalScores.push({
        id: `s-generated-${Math.random()}`,
        project_id: projectId,
        judge_id: judgeId,
        criteria_id: criteriaId,
        score,
      })
    }
    return true
  },
  getAiReport: (projectId: string) => {
    return globalReports.find((r) => r.project_id === projectId) || null
  },
  upsertAiReport: (projectId: string, data: Partial<MockReport>) => {
    const index = globalReports.findIndex((r) => r.project_id === projectId)
    const reportVal: MockReport = {
      id: data.id || `r-generated-${Math.random()}`,
      project_id: projectId,
      feasibility_score: data.feasibility_score || 0,
      feasibility_tier: data.feasibility_tier || 'Layak Komersial',
      swot: data.swot || {},
      blueprint: data.blueprint || {},
      pitch_script: data.pitch_script || '',
      grant_notes: data.grant_notes || {},
      generated_at: new Date().toISOString(),
    }

    if (index > -1) {
      globalReports[index] = reportVal
    } else {
      globalReports.push(reportVal)
    }
    return reportVal
  },
  getJudgesByEventId: (eventId: string) => {
    return mockJudges.filter((j) => j.event_id === eventId)
  },
  getJudgeByUserId: (userId: string) => {
    return mockJudges.find((j) => j.user_id === userId) || null
  },
  getProfileById: (userId: string) => {
    const judge = mockJudges.find((j) => j.user_id === userId)
    if (judge) {
      return { id: userId, email: `${judge.name.toLowerCase().replace(/\s/g, '')}@gmail.com`, role: 'judge', name: judge.name }
    }
    
    // Check entrepreneurs
    if (userId === 'b1111111-1111-1111-1111-111111111111') {
      return { id: userId, email: 'usahawan1@gmail.com', role: 'entrepreneur', name: 'Ahmad FOCUS' }
    }
    if (userId === 'b2222222-2222-2222-2222-222222222222') {
      return { id: userId, email: 'usahawan2@gmail.com', role: 'entrepreneur', name: 'Siti Food Dryer' }
    }
    
    // Check default admin
    if (userId === 'admin-id-mock-uuid') {
      return { id: userId, email: 'admin@gmail.com', role: 'admin', name: 'Super Admin' }
    }

    return null
  },
  insertProject: (project: Omit<MockProject, 'id'>) => {
    const newProj = {
      ...project,
      id: `p-gen-${Math.random()}`,
    }
    globalProjects.push(newProj)
    return newProj
  },
  deleteProject: (id: string) => {
    globalProjects = globalProjects.filter((p) => p.id !== id)
    globalScores = globalScores.filter((s) => s.project_id !== id)
    globalReports = globalReports.filter((r) => r.project_id !== id)
    return true
  }
}
