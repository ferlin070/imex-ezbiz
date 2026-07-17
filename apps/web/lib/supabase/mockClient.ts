import { mockDb } from '../mockDb'

// Mock Supabase client fluent builder
export function createMockSupabaseClient(userId: string | null) {
  const clientObj = {
    auth: {
      async getUser() {
        let currentUserId = userId
        if (!currentUserId && typeof document !== 'undefined') {
          const match = document.cookie.match(/imex_mock_session=([^;]+)/)
          if (match) {
            currentUserId = match[1]
          }
        }
        if (!currentUserId) return { data: { user: null }, error: null }
        const profile = mockDb.getProfileById(currentUserId)
        if (!profile) return { data: { user: null }, error: null }
        return { data: { user: { id: currentUserId, email: profile.email } }, error: null }
      },
      async signInWithPassword({ email }: any) {
        const profile = mockDb.getProfiles().find(p => p.email.toLowerCase() === email.toLowerCase())
        if (!profile) {
          return { data: { user: null }, error: { message: 'E-mel atau kata laluan salah.' } }
        }
        if (typeof document !== 'undefined') {
          document.cookie = `imex_mock_session=${profile.id}; path=/; max-age=3600`
        }
        return { data: { user: { id: profile.id, email: profile.email } }, error: null }
      },
      async signOut() {
        if (typeof document !== 'undefined') {
          document.cookie = 'imex_mock_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
        }
        return { error: null }
      },
      admin: {
        async createUser(payload: any) {
          const email = payload.email
          const existing = mockDb.getProfiles().find(p => p.email.toLowerCase() === email.toLowerCase())
          if (existing) {
            return { data: { user: null }, error: { message: 'User already exists' } }
          }
          const customId = `b-gen-${Math.random()}`
          return { data: { user: { id: customId, email } }, error: null }
        }
      }
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
        _updatePayload: null as any,
        _insertPayload: null as any,
        _upsertPayload: null as any,
        _deleteFlag: false,
        _orFilter: null as string | null,

        select(fields?: string) { return this },
        or(val: string) {
          this._orFilter = val
          return this
        },
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
            if (this._updatePayload) {
              const id = this._eq['id']
              if (table === 'projects' && id) {
                const updated = mockDb.updateProject(id, this._updatePayload)
                resolve({ data: updated, error: null })
                return
              }
              if (table === 'events' && id) {
                const updated = mockDb.updateEvent(id, this._updatePayload)
                resolve({ data: updated, error: null })
                return
              }
              if (table === 'venues' && id) {
                const updated = mockDb.updateVenue(id, this._updatePayload)
                resolve({ data: updated, error: null })
                return
              }
              if (table === 'grant_schemes' && id) {
                const updated = mockDb.updateGrantScheme(id, this._updatePayload)
                resolve({ data: updated, error: null })
                return
              }
              if (table === 'mara_shortlist') {
                const officerId = this._eq['officer_id']
                const projectId = this._eq['project_id']
                if (officerId && projectId) {
                  const updated = mockDb.upsertShortlist({ officer_id: officerId, project_id: projectId, ...this._updatePayload })
                  resolve({ data: updated, error: null })
                  return
                }
              }
              resolve({ data: null, error: null })
              return
            }
            if (this._upsertPayload) {
              let upsertData = null
              if (table === 'scores') {
                mockDb.submitScore(this._upsertPayload.project_id, this._upsertPayload.judge_id, this._upsertPayload.criteria_id, this._upsertPayload.score)
                upsertData = this._upsertPayload
              } else if (table === 'evaluations') {
                upsertData = mockDb.submitEvaluation(this._upsertPayload.project_id, this._upsertPayload.jury_id, this._upsertPayload.score, this._upsertPayload.comment)
              } else if (table === 'ai_reports') {
                upsertData = mockDb.upsertAiReport(this._upsertPayload.project_id, this._upsertPayload)
              } else if (table === 'grant_matches') {
                upsertData = mockDb.upsertGrantMatch(this._upsertPayload)
              } else if (table === 'mara_shortlist') {
                upsertData = mockDb.upsertShortlist(this._upsertPayload)
              }
              const finalData = this._single || this._maybeSingle ? upsertData : (upsertData ? [upsertData] : null)
              resolve({ data: finalData, error: null })
              return
            }
            if (this._insertPayload) {
              let insertData = null
              if (table === 'projects') {
                insertData = mockDb.insertProject(this._insertPayload)
              } else if (table === 'events') {
                insertData = mockDb.insertEvent(this._insertPayload)
              } else if (table === 'venues') {
                insertData = mockDb.insertVenue(this._insertPayload)
              } else if (table === 'jury_assignments') {
                insertData = mockDb.insertJuryAssignment(this._insertPayload)
              } else if (table === 'evaluations') {
                insertData = mockDb.submitEvaluation(this._insertPayload.project_id, this._insertPayload.jury_id, this._insertPayload.score, this._insertPayload.comment)
              } else if (table === 'judges') {
                const { judge } = mockDb.insertJudge(
                  this._insertPayload.name,
                  this._insertPayload.panel_label,
                  this._insertPayload.email,
                  this._insertPayload.event_id,
                  this._insertPayload.user_id
                )
                insertData = judge
              } else if (table === 'profiles') {
                insertData = mockDb.insertProfile(
                  this._insertPayload.id,
                  this._insertPayload.name,
                  this._insertPayload.email,
                  this._insertPayload.role
                )
              } else if (table === 'mara_access_log') {
                insertData = mockDb.insertAccessLog(this._insertPayload.officer_id, this._insertPayload.project_id)
              } else if (table === 'grant_schemes') {
                insertData = mockDb.insertGrantScheme(this._insertPayload)
              }
              const finalData = this._single || this._maybeSingle ? insertData : (insertData ? [insertData] : null)
              resolve({ data: finalData, error: null })
              return
            }
            if (this._deleteFlag) {
              const id = this._eq['id']
              if (table === 'projects' && id) {
                mockDb.deleteProject(id)
                resolve({ error: null })
                return
              }
              if (table === 'events' && id) {
                mockDb.deleteEvent(id)
                resolve({ error: null })
                return
              }
              if (table === 'venues' && id) {
                mockDb.deleteVenue(id)
                resolve({ error: null })
                return
              }
              if (table === 'jury_assignments') {
                const eventId = this._eq['event_id']
                const userId = this._eq['user_id']
                if (eventId && userId) {
                  mockDb.deleteJuryAssignment(eventId, userId)
                }
                resolve({ error: null })
                return
              }
              if (table === 'judges' && id) {
                mockDb.deleteJudge(id)
                resolve({ error: null })
                return
              }
              if (table === 'profiles' && id) {
                mockDb.deleteProfile(id)
                resolve({ error: null })
                return
              }
              if (table === 'grant_schemes' && id) {
                mockDb.deleteGrantScheme(id)
                resolve({ error: null })
                return
              }
              resolve({ error: null })
              return
            }
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
            return mockDb.getProfiles()
          }
          if (table === 'events') {
            const slug = this._eq['slug']
            if (slug) {
              return mockDb.getEventBySlug(slug)
            }
            const id = this._eq['id']
            if (id) {
              return mockDb.getEventById(id)
            }
            return mockDb.getEvents()
          }
          if (table === 'venues') {
            return mockDb.getVenues()
          }
          if (table === 'jury_assignments') {
            const eventId = this._eq['event_id']
            let assignments = mockDb.getJuryAssignments(eventId)
            const userId = this._eq['user_id']
            if (userId) {
              assignments = assignments.filter((a) => a.user_id === userId)
            }
            return assignments
          }
          if (table === 'evaluations') {
            const projectId = this._eq['project_id']
            if (projectId) {
              return mockDb.getEvaluationsByProjectId(projectId)
            }
            return mockDb.getEvaluations()
          }
          if (table === 'criteria') {
            const eventId = this._eq['event_id'] || 'e1111111-1111-1111-1111-111111111111'
            return mockDb.getCriteriaByEventId(eventId)
          }
          if (table === 'projects') {
            const id = this._eq['id']
            if (id) {
              return mockDb.getProjectById(id)
            }
            
            // Get all projects for event (or default event)
            const eventId = this._eq['event_id'] || 'e1111111-1111-1111-1111-111111111111'
            let all = mockDb.getProjectsByEventId(eventId)

            if (this._orFilter) {
              if (this._orFilter.includes('mara_visible.eq.true') || this._orFilter.includes('entry_type.eq.direct')) {
                all = (mockDb as any).getProjects().filter((p: any) => p.mara_visible === true || p.entry_type === 'direct')
              }
            }

            // Dynamically apply other filters from this._eq
            Object.keys(this._eq).forEach((key) => {
              if (key !== 'id' && key !== 'event_id' && this._eq[key] !== undefined) {
                all = all.filter((p: any) => p[key] === this._eq[key])
              }
            })

            return all
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
            const projectIds = this._in['project_id']
            if (projectIds) {
              return mockDb.getAiReports().filter((r: any) => projectIds.includes(r.project_id))
            }
            return mockDb.getAiReports()
          }
          if (table === 'grant_schemes') {
            return mockDb.getGrantSchemes()
          }
          if (table === 'grant_matches') {
            const projectId = this._eq['project_id']
            if (projectId) {
              return mockDb.getGrantMatchesByProject(projectId)
            }
            return []
          }
          if (table === 'mara_shortlist') {
            const officerId = this._eq['officer_id']
            if (officerId) {
              return mockDb.getShortlistByOfficer(officerId)
            }
            return []
          }
          if (table === 'mara_access_log') {
            return mockDb.getAccessLogs()
          }
          return null
        },

        insert(payload: any) {
          this._insertPayload = payload
          return this
        },

        upsert(payload: any, options?: any) {
          this._upsertPayload = payload
          return this
        },

        update(payload: any) {
          this._updatePayload = payload
          return this
        },

        delete() {
          this._deleteFlag = true
          return this
        },
      }
      return builder
    },
  }
  return clientObj as any
}
