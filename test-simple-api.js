// Simple test to check if the API is working
const testSimpleEndpoint = async () => {
  try {
    console.log('Testing simple endpoint...')
    
    // Test a basic endpoint first
    const response = await fetch('http://localhost:3000/api/associates')
    const data = await response.text()
    console.log('Response status:', response.status)
    console.log('Response preview:', data.substring(0, 200))
    
    if (response.ok) {
      console.log('✅ Basic API is working')
    } else {
      console.log('❌ Basic API returned error:', response.status)
    }
  } catch (error) {
    console.log('❌ Error:', error.message)
  }
}

testSimpleEndpoint()
