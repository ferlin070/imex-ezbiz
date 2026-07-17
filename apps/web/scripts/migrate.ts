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

  const migrationDir = path.join(__dirname, '../../../supabase/migrations')
  const migrationFiles = [
    '20260718000000_mara_agentic_restructure.sql'
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
