const { Client } = require('pg')

// Database URL from previous session:
const connectionString = 'postgresql://postgres.ojxejzrzttoszxkzqvsl:S3cr3t%40imexezbiz@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres'

async function main() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  })

  try {
    await client.connect()
    console.log('Connected to Supabase DB successfully!')

    // 1. Check if loan_products table exists
    const tableCheckRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('projects', 'loan_products', 'self_assessments', 'business_profiles', 'loan_applications')
    `)
    console.log('Existing tables:', tableCheckRes.rows.map(r => r.table_name))

    // 2. Check projects table columns
    const columnsCheckRes = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'projects'
    `)
    console.log('Projects table columns:')
    columnsCheckRes.rows.forEach(r => {
      console.log(` - ${r.column_name}: ${r.data_type}`)
    })

  } catch (err) {
    console.error('Database query error:', err)
  } finally {
    await client.end()
  }
}

main()
