// Simple test to check environment variables
console.log('🔍 Checking environment variables...')

// Check if .env.local exists
const fs = require('fs')
const path = require('path')

const envPath = path.join(__dirname, '.env.local')
console.log('📁 .env.local path:', envPath)
console.log('📁 .env.local exists:', fs.existsSync(envPath))

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  console.log('📄 .env.local content:')
  console.log(envContent)
} else {
  console.log('❌ .env.local file not found!')
  console.log('💡 Create .env.local with:')
  console.log('EMAIL_USER=your_email@gmail.com')
  console.log('EMAIL_APP_PASSWORD=your_app_password')
}
