import { mockDb } from '../mockDb'

// Mock Supabase client fluent builder
export function createMockSupabaseClient(userId: string | null) {
  const clientObj = {
    auth: {
      async getUser() {
        if (!userId) return { data: { user: null }, error: null }
        const profile = mockDb.getProfileById(userId)
        if (!profile) return { data: { user: null }, error: null }
        return { data: { user: { id: userId, email: profile.email } }, error: null }
      },
      async signOut() {
        if (typeof document !== 'undefined') {
          document.cookie = 'imex_mock_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
        }
        return { error: null }
      },
    },
    channel(name: string) {
      return {
        on(event: string, filter: any, callback: any) {
          return this
        },
        subscribe() {
          return this
        }
      }
    },
    removeChannel(channel: any) {
      return
    },
    from(table: string) {
      const builder: any = {
        _eq: {} as Record<string, any>,
        _in: {} as Record<string, any[]>,
        _order: null as any,
        _single: false,
        _maybeSingle: false,

        select(fields?: string) { return this },
        eq(col: string, val: any) {
          this._eq[col] = val
          return this
        },
        in(col: string, vals: any[]) {
          this._in[col] = vals
          return this
        },
        order(col: string, opts?: any) {
          this._order = { col, opts }
          return this
        },
        limit(val: number) { return this },
        single() {
          this._single = true
          return this
        },
        maybeSingle() {
          this._maybeSingle = true
          return this
        },

        // Promise resolver to support awaiting the builder directly
        async then(resolve: any) {
          try {
            const data = await this.execute()
            const count = Array.isArray(data) ? data.length : (data ? 1 : 0)
            resolve({ data, count, error: null })
          } catch (err: any) {
            resolve({ data: null, count: 0, error: err })
          }
        },

        async execute() {
          if (table === 'profiles') {
            const uid = this._eq['id']
            if (uid) {
              return mockDb.getProfileById(uid)
            }
            return null
          }
          if (table === 'events') {
            const slug = this._eq['slug']
            if (slug) {
              return mockDb.getEventBySlug(slug)
            }
            return null
          }
          if (table === 'criteria') {
            const eventId = this._eq['event_id']
            if (eventId) {
              return mockDb.getCriteriaByEventId(eventId)
            }
            return []
          }
          if (table === 'projects') {
            const id = this._eq['id']
            if (id) {
              return mockDb.getProjectById(id)
            }
            const ownerId = this._eq['owner_user_id']
            if (ownerId) {
              const all = mockDb.getProjectsByEventId('e1111111-1111-1111-1111-111111111111')
              return all.filter((p) => p.owner_user_id === ownerId)
            }
            const eventId = this._eq['event_id']
            if (eventId) {
              return mockDb.getProjectsByEventId(eventId)
            }
            return mockDb.getProjectsByEventId('e1111111-1111-1111-1111-111111111111')
          }
          if (table === 'judges') {
            const uid = this._eq['user_id']
            if (uid) {
              return mockDb.getJudgeByUserId(uid)
            }
            const eventId = this._eq['event_id']
            if (eventId) {
              return mockDb.getJudgesByEventId(eventId)
            }
            return mockDb.getJudgesByEventId('e1111111-1111-1111-1111-111111111111')
          }
          if (table === 'scores') {
            const projectId = this._eq['project_id']
            if (projectId) {
              return mockDb.getScoresByProjectId(projectId)
            }
            const judgeId = this._eq['judge_id']
            if (judgeId) {
              const all = mockDb.getScoresByEvent('e1111111-1111-1111-1111-111111111111')
              return all.filter((s) => s.judge_id === judgeId)
            }
            const projectIds = this._in['project_id']
            if (projectIds) {
              const all = mockDb.getScoresByEvent('e1111111-1111-1111-1111-111111111111')
              return all.filter((s) => projectIds.includes(s.project_id))
            }
            return mockDb.getScoresByEvent('e1111111-1111-1111-1111-111111111111')
          }
          if (table === 'ai_reports') {
            const projectId = this._eq['project_id']
            if (projectId) {
              return mockDb.getAiReport(projectId)
            }
            return null
          }
          return null
        },

        async insert(payload: any) {
          if (table === 'projects') {
            const created = mockDb.insertProject(payload)
            return { data: created, error: null }
          }
          return { data: null, error: null }
        },

        async upsert(payload: any, options?: any) {
          if (table === 'scores') {
            mockDb.submitScore(payload.project_id, payload.judge_id, payload.criteria_id, payload.score)
            return { data: payload, error: null }
          }
          if (table === 'ai_reports') {
            const created = mockDb.upsertAiReport(payload.project_id, payload)
            return { data: created, error: null }
          }
          return { data: null, error: null }
        },

        async delete() {
          const id = this._eq['id']
          if (table === 'projects' && id) {
            mockDb.deleteProject(id)
            return { error: null }
          }
          return { error: null }
        },
      }
      return builder
    },
  }
  return clientObj as any
}
