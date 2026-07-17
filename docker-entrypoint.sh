#!/sh
echo "🚀 Running database migrations..."
node --import tsx scripts/migrate.ts

echo "🚀 Starting Next.js application..."
npx next start
