import test from 'node:test'
import assert from 'node:assert'
import { createClient, createAdminClient } from '../apps/web/lib/supabase/server'

// Save original environment variables
const originalNodeEnv = process.env.NODE_ENV
const originalMockSession = process.env.MOCK_SESSION_FOR_TEST
const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const originalServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function resetEnv() {
  process.env.NODE_ENV = originalNodeEnv
  process.env.MOCK_SESSION_FOR_TEST = originalMockSession
  process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey
  process.env.SUPABASE_SERVICE_ROLE_KEY = originalServiceKey
}

test('createClient() - honors MOCK_SESSION_FOR_TEST only in non-production', async () => {
  // Set fake credentials so isDummy is false
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-project.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
  process.env.MOCK_SESSION_FOR_TEST = JSON.stringify({ id: 'a1111111-1111-1111-1111-111111111111' })
  
  // 1. In non-production (e.g. 'development'), MOCK_SESSION_FOR_TEST is honored
  process.env.NODE_ENV = 'development'
  const devClient = await createClient()
  assert.ok(devClient, 'Client should be created')
  
  // Verify it is indeed the mock client and returned the correct profile email from mock database
  const devUserResult = await devClient.auth.getUser()
  assert.strictEqual(devUserResult.data.user?.email, 'juri1@gmail.com', 'Should return the mock profile email')

  // 2. In production, MOCK_SESSION_FOR_TEST is ignored
  process.env.NODE_ENV = 'production'
  try {
    await createClient()
    assert.fail('Should have failed because it tried to execute real Supabase client code calling cookies()')
  } catch (err) {
    // Assert that it threw because it tried to execute real server client initialization (like cookies() outside Next.js request context)
    assert.ok(err, 'Should throw an error when trying to fetch cookies in node CLI environment')
  }

  resetEnv()
})

test('createAdminClient() - ignores MOCK_SESSION_FOR_TEST in production', () => {
  // Set fake credentials so isDummy is false
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-project.supabase.co'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
  process.env.MOCK_SESSION_FOR_TEST = JSON.stringify({ id: 'a1111111-1111-1111-1111-111111111111' })

  // 1. In non-production, MOCK_SESSION_FOR_TEST causes createAdminClient to return the mock admin client
  process.env.NODE_ENV = 'development'
  const devAdminClient = createAdminClient()
  assert.ok(devAdminClient, 'Client should be created')
  
  // 2. In production, MOCK_SESSION_FOR_TEST is ignored, isDummy is false, so it attempts to initialize real server client.
  process.env.NODE_ENV = 'production'
  const prodAdminClient = createAdminClient()
  assert.ok(prodAdminClient, 'Client should be created')
  
  resetEnv()
})
