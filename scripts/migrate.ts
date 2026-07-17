import { Client } from 'pg'
import * as fs from 'fs'
import * as path from 'path'

async function run() {
  const connectionString = 'postgresql://postgres.ojxejzrzttoszxkzqvsl:S3cr3t%40imexezbiz@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres'
  
  console.log('Connecting to Supabase Database...')
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false } // Required for cloud databases like Supabase
  })

  await client.connect()
  console.log('Successfully connected to Database.')

  const migrationDir = path.join(__dirname, '../supabase/migrations')
  const migrationFiles = [
    '20260716000000_initial_schema.sql',
    '20260716000001_seed_data.sql',
    '20260716000002_mara_module.sql',
    '20260716000003_scout_schemas.sql',
    '20260717000000_dual_track_loan.sql'
  ]

  try {
    for (const file of migrationFiles) {
      console.log(`\n----------------------------------------`)
      console.log(`Running migration: ${file}...`)
      const filePath = path.join(migrationDir, file)
      const sqlContent = fs.readFileSync(filePath, 'utf8')

      // Execute SQL content
      await client.query(sqlContent)
      console.log(`✅ Success: ${file} completed.`)
    }
    console.log(`\n🎉 All migrations executed successfully on Supabase!`)
  } catch (error) {
    console.error('❌ Migration failed:', error)
  } finally {
    await client.end()
    console.log('Database connection closed.')
  }
}

run()
