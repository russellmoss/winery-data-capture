const axios = require('axios');

// Test script to debug analytics API
async function testAnalyticsDebug() {
  try {
    console.log('🔍 Testing analytics API debug...\n');
    
    // Test the analytics API with refresh=true to bypass cache
    console.log('1. Calling analytics API with refresh...');
    const response = await axios.post('http://localhost:3000/api/analytics/metrics', {
      startDate: '2025-08-13T00:00:00.000Z',
      endDate: '2025-09-12T23:59:59.999Z',
      refresh: true
    });
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Response keys: ${Object.keys(response.data).join(', ')}`);
    
    // Look for Russell Moss specifically
    const russellMoss = response.data.associates?.find(a => a.name === 'Russell Moss');
    if (russellMoss) {
      console.log('\n2. Russell Moss metrics:');
      console.log(`   Manual Profiles: ${russellMoss.manualProfiles}`);
      console.log(`   Total Profiles: ${russellMoss.profilesCreated}`);
      console.log(`   With Data: ${russellMoss.profilesWithData}`);
      console.log(`   Guest Count: ${russellMoss.guestCount}`);
    } else {
      console.log('\n2. ❌ Russell Moss not found in associates list');
      console.log('   Available associates:', response.data.associates?.map(a => a.name).join(', '));
    }
    
    // Check company metrics
    console.log('\n3. Company metrics:');
    console.log(`   Total Profiles: ${response.data.companyMetrics?.totalProfiles}`);
    console.log(`   Total Profiles with Data: ${response.data.companyMetrics?.totalProfilesWithData}`);
    console.log(`   Wedding Lead Profiles: ${response.data.companyMetrics?.weddingLeadProfiles}`);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Run the test
testAnalyticsDebug();
