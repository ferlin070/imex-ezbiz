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
  mara_visible?: boolean
  state?: string
  institution?: string
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

export interface MockProfile {
  id: string
  email: string
  role: 'judge' | 'entrepreneur' | 'admin' | 'mara_officer'
  name: string
}

export interface MockGrantScheme {
  id: string
  name: string
  agency: string
  description: string
  eligibility_criteria: string
  sector_tags: string[]
  max_amount_myr: number
  active: boolean
  created_at: string
}

export interface MockGrantMatch {
  id: string
  project_id: string
  scheme_id: string
  match_score: number
  match_reasoning: string
  generated_at: string
  model_version: string
}

export interface MockShortlist {
  id: string
  officer_id: string
  project_id: string
  status: 'berpotensi' | 'dihubungi' | 'ditolak' | 'diluluskan'
  notes: string
  created_at: string
  updated_at: string
}

export interface MockAccessLog {
  id: string
  officer_id: string
  project_id: string
  accessed_at: string
}

// In-memory data store mimicking the Supabase seeds
const mockEvent = {
  id: 'e1111111-1111-1111-1111-111111111111',
  name: 'Festival Inovasi IKM Besut 2026',
  slug: 'ikm-besut-2026',
  status: 'active',
}

const mockCriteria: MockCriterion[] = [
  { id: 'c1111111-1111-1111-1111-111111111111', event_id: mockEvent.id, code: 'K1', label: 'Idea (Kreativiti)', max_score: 20, weight: 20.0, sort_order: 1 },
  { id: 'c2222222-2222-2222-2222-222222222222', event_id: mockEvent.id, code: 'K2', label: 'Hasil Inovasi (Output)', max_score: 30, weight: 30.0, sort_order: 2 },
  { id: 'c3333333-3333-3333-3333-333333333333', event_id: mockEvent.id, code: 'K3', label: 'Impak (Efisien / Keberkesanan)', max_score: 20, weight: 20.0, sort_order: 3 },
  { id: 'c4444444-4444-4444-4444-444444444444', event_id: mockEvent.id, code: 'K4', label: 'Impak (Signifikal / Relevan)', max_score: 25, weight: 25.0, sort_order: 4 },
  { id: 'c5555555-5555-5555-5555-555555555555', event_id: mockEvent.id, code: 'K5', label: 'Pengurusan (Komitmen)', max_score: 5, weight: 5.0, sort_order: 5 },
]

const mockProjects: MockProject[] = [
  {
    id: 'd1111111-1111-1111-1111-111111111111',
    event_id: mockEvent.id,
    title: 'F.O.C.U.S DRIVE',
    description: 'Sistem pemanduan pintar berasaskan IoT untuk mengurangkan kemalangan jalan raya akibat keletihan pemandu dengan memantau pergerakan mata dan memberikan amaran masa nyata.',
    category: 'Automotif & IoT',
    team_members: ['Ahmad', 'Ali', 'Abu'],
    owner_user_id: 'b1111111-1111-1111-1111-111111111111',
    mara_visible: false,
    state: 'Terengganu',
    institution: 'IKM Besut',
  },
  {
    id: 'd2222222-2222-2222-2222-222222222222',
    event_id: mockEvent.id,
    title: 'FOOD DRYER',
    description: 'Mesin pengering makanan berasaskan tenaga solar hibrid dengan kawalan suhu automatik untuk kegunaan usahawan mikro desa memproses hasil tani dengan lebih cepat.',
    category: 'Teknologi Makanan',
    team_members: ['Siti', 'Sarah'],
    owner_user_id: 'b2222222-2222-2222-2222-222222222222',
    mara_visible: false,
    state: 'Kelantan',
    institution: 'IKM Besut',
  },
  {
    id: 'd3333333-3333-3333-3333-333333333333',
    event_id: mockEvent.id,
    title: 'Smart Grass Chopper',
    description: 'Alat pemotong rumput pintar yang dikawal melalui aplikasi telefon pintar dengan sensor pengesanan halangan untuk keselamatan dan kecekapan penyelenggaraan landskap.',
    category: 'Mekanikal & Robotik',
    team_members: ['Chong', 'Muthu'],
    owner_user_id: null,
    mara_visible: false,
    state: 'Pahang',
    institution: 'IKM Tan Sri Yahaya Ahmad',
  },
  {
    id: 'd4444444-4444-4444-4444-444444444444',
    event_id: mockEvent.id,
    title: 'Mobile Poison Sprayer',
    description: 'Mesin penyembur racun tanaman mudah alih berautonomi menggunakan roda berkuasa tinggi untuk aplikasi sektor pertanian pintar berskala kecil.',
    category: 'Pertanian Pintar',
    team_members: ['Wan', 'Zaki'],
    owner_user_id: null,
    mara_visible: false,
    state: 'Kedah',
    institution: 'IKM Alor Setar',
  },
]

const mockJudges: MockJudge[] = [
  { id: 'f1111111-1111-1111-1111-111111111111', event_id: mockEvent.id, user_id: 'a1111111-1111-1111-1111-111111111111', panel_label: 'Panel 1', name: 'Encik Khairul' },
  { id: 'f2222222-2222-2222-2222-222222222222', event_id: mockEvent.id, user_id: 'a2222222-2222-2222-2222-222222222222', panel_label: 'Panel 2', name: 'Puan Zaimah' },
  { id: 'f3333333-3333-3333-3333-333333333333', event_id: mockEvent.id, user_id: 'a3333333-3333-3333-3333-333333333333', panel_label: 'Panel 3', name: 'Dr. Firdaus' },
]

const mockProfiles: MockProfile[] = [
  { id: 'a1111111-1111-1111-1111-111111111111', email: 'juri1@gmail.com', role: 'judge', name: 'Encik Khairul' },
  { id: 'a2222222-2222-2222-2222-222222222222', email: 'juri2@gmail.com', role: 'judge', name: 'Puan Zaimah' },
  { id: 'a3333333-3333-3333-3333-333333333333', email: 'juri3@gmail.com', role: 'judge', name: 'Dr. Firdaus' },
  { id: 'b1111111-1111-1111-1111-111111111111', email: 'usahawan1@gmail.com', role: 'entrepreneur', name: 'Ahmad FOCUS' },
  { id: 'b2222222-2222-2222-2222-222222222222', email: 'usahawan2@gmail.com', role: 'entrepreneur', name: 'Siti Food Dryer' },
  { id: 'admin-id-mock-uuid', email: 'admin@gmail.com', role: 'admin', name: 'Super Admin' },
  { id: 'mara-officer-mock-uuid', email: 'mara1@gmail.com', role: 'mara_officer', name: 'Encik Tarmizi (MARA)' },
]

const initialGrantSchemes: MockGrantScheme[] = [
  {
    id: 's1111111-1111-1111-1111-111111111111',
    name: 'Skim Pembiayaan Mikro MARA',
    agency: 'MARA',
    description: 'Pembiayaan modal pusingan dan pembelian peralatan untuk perniagaan mikro Bumiputera.',
    eligibility_criteria: 'Usahawan Bumiputera, skor kebolehsanaan juri sekurang-kurangnya 50 markah, kategori perkhidmatan, pertanian, atau perdagangan am.',
    sector_tags: ['Perkhidmatan', 'Pertanian', 'Teknologi Makanan', 'Am'],
    max_amount_myr: 50000,
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 's2222222-2222-2222-2222-222222222222',
    name: 'Geran Inovasi MARA',
    agency: 'MARA',
    description: 'Geran sokongan untuk pembangunan produk inovatif berskala kecil hingga sederhana bagi pasaran komersial.',
    eligibility_criteria: 'Projek dengan skor kebolehsanaan tinggi (sekurang-kurangnya 70 markah), memiliki aspek teknologi tinggi (IoT, Mekanikal, Digital), prototaip sedia diuji.',
    sector_tags: ['Automotif & IoT', 'Mekanikal & Robotik', 'Pertanian Pintar', 'Teknologi'],
    max_amount_myr: 100000,
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 's3333333-3333-3333-3333-333333333333',
    name: 'Program Usahawan Bumiputera Digital',
    agency: 'MARA',
    description: 'Dana sokongan peralihan digital bagi membolehkan usahawan mengintegrasikan teknologi awan, pemasaran digital, atau e-dagang.',
    eligibility_criteria: 'Perniagaan aktif, skor kebolehsanaan juri sekurang-kurangnya 60 markah, berhasrat membina aplikasi digital atau pendigitalan operasi.',
    sector_tags: ['Teknologi', 'Perkhidmatan', 'Am', 'Digital'],
    max_amount_myr: 20000,
    active: true,
    created_at: new Date().toISOString(),
  }
]

const initialScores: MockScore[] = [
  // Judge 1 (Total: 18 + 25 + 17 + 20 + 4 = 84)
  { id: 's1', project_id: 'd1111111-1111-1111-1111-111111111111', judge_id: 'f1111111-1111-1111-1111-111111111111', criteria_id: 'c1111111-1111-1111-1111-111111111111', score: 18 },
  { id: 's2', project_id: 'd1111111-1111-1111-1111-111111111111', judge_id: 'f1111111-1111-1111-1111-111111111111', criteria_id: 'c2222222-2222-2222-2222-222222222222', score: 25 },
  { id: 's3', project_id: 'd1111111-1111-1111-1111-111111111111', judge_id: 'f1111111-1111-1111-1111-111111111111', criteria_id: 'c3333333-3333-3333-3333-333333333333', score: 17 },
  { id: 's4', project_id: 'd1111111-1111-1111-1111-111111111111', judge_id: 'f1111111-1111-1111-1111-111111111111', criteria_id: 'c4444444-4444-4444-4444-444444444444', score: 20 },
  { id: 's5', project_id: 'd1111111-1111-1111-1111-111111111111', judge_id: 'f1111111-1111-1111-1111-111111111111', criteria_id: 'c5555555-5555-5555-5555-555555555555', score: 4 },

  // Judge 2 (Total: 19 + 27 + 18 + 21 + 5 = 90)
  { id: 's6', project_id: 'd1111111-1111-1111-1111-111111111111', judge_id: 'f2222222-2222-2222-2222-222222222222', criteria_id: 'c1111111-1111-1111-1111-111111111111', score: 19 },
  { id: 's7', project_id: 'd1111111-1111-1111-1111-111111111111', judge_id: 'f2222222-2222-2222-2222-222222222222', criteria_id: 'c2222222-2222-2222-2222-222222222222', score: 27 },
  { id: 's8', project_id: 'd1111111-1111-1111-1111-111111111111', judge_id: 'f2222222-2222-2222-2222-222222222222', criteria_id: 'c3333333-3333-3333-3333-333333333333', score: 18 },
  { id: 's9', project_id: 'd1111111-1111-1111-1111-111111111111', judge_id: 'f2222222-2222-2222-2222-222222222222', criteria_id: 'c4444444-4444-4444-4444-444444444444', score: 21 },
  { id: 's10', project_id: 'd1111111-1111-1111-1111-111111111111', judge_id: 'f2222222-2222-2222-2222-222222222222', criteria_id: 'c5555555-5555-5555-5555-555555555555', score: 5 },

  // Judge 3 (Total: 17 + 24 + 16 + 18 + 4 = 79)
  { id: 's11', project_id: 'd1111111-1111-1111-1111-111111111111', judge_id: 'f3333333-3333-3333-3333-333333333333', criteria_id: 'c1111111-1111-1111-1111-111111111111', score: 17 },
  { id: 's12', project_id: 'd1111111-1111-1111-1111-111111111111', judge_id: 'f3333333-3333-3333-3333-333333333333', criteria_id: 'c2222222-2222-2222-2222-222222222222', score: 24 },
  { id: 's13', project_id: 'd1111111-1111-1111-1111-111111111111', judge_id: 'f3333333-3333-3333-3333-333333333333', criteria_id: 'c3333333-3333-3333-3333-333333333333', score: 16 },
  { id: 's14', project_id: 'd1111111-1111-1111-1111-111111111111', judge_id: 'f3333333-3333-3333-3333-333333333333', criteria_id: 'c4444444-4444-4444-4444-444444444444', score: 18 },
  { id: 's15', project_id: 'd1111111-1111-1111-1111-111111111111', judge_id: 'f3333333-3333-3333-3333-333333333333', criteria_id: 'c5555555-5555-5555-5555-555555555555', score: 4 },
]

// Shared global state cache for Next.js dev server hot reloading and module bundles isolation
interface MockDbState {
  scores: MockScore[]
  reports: MockReport[]
  projects: MockProject[]
  judges: MockJudge[]
  profiles: MockProfile[]
  grantSchemes: MockGrantScheme[]
  grantMatches: MockGrantMatch[]
  shortlist: MockShortlist[]
  accessLogs: MockAccessLog[]
}

const globalForMockDb = global as unknown as {
  mockDbState?: MockDbState
}

if (!globalForMockDb.mockDbState) {
  globalForMockDb.mockDbState = {
    scores: [...initialScores],
    reports: [],
    projects: [...mockProjects],
    judges: [...mockJudges],
    profiles: [...mockProfiles],
    grantSchemes: [...initialGrantSchemes],
    grantMatches: [],
    shortlist: [],
    accessLogs: [],
  }
}

const state = globalForMockDb.mockDbState

export const mockDb = {
  getEventBySlug: (slug: string) => {
    return mockEvent.slug === slug ? mockEvent : null
  },
  getCriteriaByEventId: (eventId: string) => {
    return mockCriteria.filter((c) => c.event_id === eventId)
  },
  getProjects: () => {
    return state.projects
  },
  getProjectsByEventId: (eventId: string) => {
    return state.projects.filter((p) => p.event_id === eventId)
  },
  getProjectById: (projectId: string) => {
    return state.projects.find((p) => p.id === projectId) || null
  },
  getScoresByProjectId: (projectId: string) => {
    return state.scores.filter((s) => s.project_id === projectId)
  },
  getScoresByEvent: (eventId: string) => {
    const eventProjIds = state.projects.filter((p) => p.event_id === eventId).map((p) => p.id)
    return state.scores.filter((s) => eventProjIds.includes(s.project_id))
  },
  submitScore: (projectId: string, judgeId: string, criteriaId: string, score: number) => {
    const index = state.scores.findIndex(
      (s) => s.project_id === projectId && s.judge_id === judgeId && s.criteria_id === criteriaId
    )
    if (index > -1) {
      state.scores[index].score = score
    } else {
      state.scores.push({
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
    return state.reports.find((r) => r.project_id === projectId) || null
  },
  getAiReports: () => {
    return state.reports
  },
  upsertAiReport: (projectId: string, data: Partial<MockReport>) => {
    const index = state.reports.findIndex((r) => r.project_id === projectId)
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
      state.reports[index] = reportVal
    } else {
      state.reports.push(reportVal)
    }
    return reportVal
  },
  getJudgesByEventId: (eventId: string) => {
    return state.judges.filter((j) => j.event_id === eventId)
  },
  getJudgeByUserId: (userId: string) => {
    return state.judges.find((j) => j.user_id === userId) || null
  },
  getProfileById: (userId: string) => {
    return state.profiles.find((p) => p.id === userId) || null
  },
  getProfiles: () => {
    return state.profiles
  },
  insertProject: (project: Omit<MockProject, 'id'>) => {
    const newProj = {
      ...project,
      id: `p-gen-${Math.random()}`,
    }
    state.projects.push(newProj)
    return newProj
  },
  deleteProject: (id: string) => {
    state.projects = state.projects.filter((p) => p.id !== id)
    state.scores = state.scores.filter((s) => s.project_id !== id)
    state.reports = state.reports.filter((r) => r.project_id !== id)
    return true
  },
  insertJudge: (name: string, panelLabel: string, email: string) => {
    const userId = `a-gen-${Math.random()}`
    const judgeId = `j-gen-${Math.random()}`
    
    const newProfile: MockProfile = {
      id: userId,
      email,
      role: 'judge',
      name
    }
    const newJudge: MockJudge = {
      id: judgeId,
      event_id: mockEvent.id,
      user_id: userId,
      panel_label: panelLabel,
      name
    }

    state.profiles.push(newProfile)
    state.judges.push(newJudge)
    return { profile: newProfile, judge: newJudge }
  },
  deleteJudge: (judgeId: string) => {
    const judge = state.judges.find((j) => j.id === judgeId)
    if (judge) {
      state.profiles = state.profiles.filter((p) => p.id !== judge.user_id)
      state.judges = state.judges.filter((j) => j.id !== judgeId)
      state.scores = state.scores.filter((s) => s.judge_id !== judgeId)
    }
    return true
  },
  insertEntrepreneur: (name: string, email: string, projectId: string | null) => {
    const userId = `b-gen-${Math.random()}`
    
    const newProfile: MockProfile = {
      id: userId,
      email,
      role: 'entrepreneur',
      name
    }

    state.profiles.push(newProfile)

    if (projectId) {
      const projIdx = state.projects.findIndex((p) => p.id === projectId)
      if (projIdx > -1) {
        state.projects[projIdx].owner_user_id = userId
      }
    }
    return newProfile
  },
  deleteProfile: (userId: string) => {
    state.profiles = state.profiles.filter((p) => p.id !== userId)
    // Clear project ownership if they owned any
    state.projects = state.projects.map((p) => {
      if (p.owner_user_id === userId) {
        return { ...p, owner_user_id: null }
      }
      return p
    })
    return true
  },
  updateProject: (id: string, payload: Partial<MockProject>) => {
    const idx = state.projects.findIndex((p) => p.id === id)
    if (idx > -1) {
      state.projects[idx] = { ...state.projects[idx], ...payload }
      return state.projects[idx]
    }
    return null
  },
  getGrantSchemes: () => {
    return state.grantSchemes
  },
  insertGrantScheme: (scheme: Partial<MockGrantScheme>) => {
    const newScheme: MockGrantScheme = {
      id: scheme.id || `s-gen-${Math.random()}`,
      name: scheme.name || '',
      agency: scheme.agency || 'MARA',
      description: scheme.description || '',
      eligibility_criteria: scheme.eligibility_criteria || '',
      sector_tags: scheme.sector_tags || [],
      max_amount_myr: Number(scheme.max_amount_myr) || 0,
      active: scheme.active !== undefined ? scheme.active : true,
      created_at: scheme.created_at || new Date().toISOString(),
    }
    state.grantSchemes.push(newScheme)
    return newScheme
  },
  updateGrantScheme: (id: string, payload: Partial<MockGrantScheme>) => {
    const idx = state.grantSchemes.findIndex((s) => s.id === id)
    if (idx > -1) {
      state.grantSchemes[idx] = { ...state.grantSchemes[idx], ...payload }
      return state.grantSchemes[idx]
    }
    return null
  },
  deleteGrantScheme: (id: string) => {
    state.grantSchemes = state.grantSchemes.filter((s) => s.id !== id)
    state.grantMatches = state.grantMatches.filter((m) => m.scheme_id !== id)
    return true
  },
  getGrantMatchesByProject: (projectId: string) => {
    return state.grantMatches.filter((m) => m.project_id === projectId)
  },
  upsertGrantMatch: (match: Partial<MockGrantMatch>) => {
    const index = state.grantMatches.findIndex(
      (m) => m.project_id === match.project_id && m.scheme_id === match.scheme_id
    )
    const matchVal: MockGrantMatch = {
      id: match.id || `gm-gen-${Math.random()}`,
      project_id: match.project_id || '',
      scheme_id: match.scheme_id || '',
      match_score: Number(match.match_score) || 0,
      match_reasoning: match.match_reasoning || '',
      generated_at: match.generated_at || new Date().toISOString(),
      model_version: match.model_version || 'gemini-1.5-flash',
    }
    if (index > -1) {
      state.grantMatches[index] = matchVal
    } else {
      state.grantMatches.push(matchVal)
    }
    return matchVal
  },
  getShortlistByOfficer: (officerId: string) => {
    return state.shortlist.filter((s) => s.officer_id === officerId)
  },
  upsertShortlist: (shortlist: Partial<MockShortlist>) => {
    const index = state.shortlist.findIndex(
      (s) => s.officer_id === shortlist.officer_id && s.project_id === shortlist.project_id
    )
    const val: MockShortlist = {
      id: shortlist.id || `sl-gen-${Math.random()}`,
      officer_id: shortlist.officer_id || '',
      project_id: shortlist.project_id || '',
      status: shortlist.status || 'berpotensi',
      notes: shortlist.notes || '',
      created_at: shortlist.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    if (index > -1) {
      state.shortlist[index] = { ...state.shortlist[index], ...val }
      return state.shortlist[index]
    } else {
      state.shortlist.push(val)
      return val
    }
  },
  insertAccessLog: (officerId: string, projectId: string) => {
    const log: MockAccessLog = {
      id: `al-gen-${Math.random()}`,
      officer_id: officerId,
      project_id: projectId,
      accessed_at: new Date().toISOString(),
    }
    state.accessLogs.push(log)
    return log
  },
  getAccessLogs: () => {
    return state.accessLogs
  }
}
