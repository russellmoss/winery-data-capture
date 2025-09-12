const axios = require('axios');

// Test the reports API to see if manual profiles are being detected
async function testReportsAPI() {
  try {
    console.log('🔍 Testing Reports API for manual profile detection...\n');
    
    // Test the analytics API
    console.log('1. Calling analytics API:');
    const response = await axios.post('http://localhost:3000/api/analytics/metrics', {
      startDate: '2025-08-13T00:00:00.000Z',
      endDate: '2025-09-12T23:59:59.999Z',
      refresh: true
    });
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Period: ${response.data.period}`);
    console.log(`   Cached: ${response.data.cached}`);
    console.log('');
    
    // Look for Russell Moss specifically
    console.log('2. Russell Moss metrics:');
    const russellMoss = response.data.associates?.find(a => a.name === 'Russell Moss');
    if (russellMoss) {
      console.log('   ✅ Russell Moss found in results:');
      console.log(`     Manual Profiles: ${russellMoss.manualProfiles}`);
      console.log(`     Total Profiles: ${russellMoss.profilesCreated}`);
      console.log(`     With Email: ${russellMoss.profilesWithEmail}`);
      console.log(`     With Phone: ${russellMoss.profilesWithPhone}`);
      console.log(`     With Data: ${russellMoss.profilesWithData}`);
      console.log(`     With Data (No Wedding): ${russellMoss.profilesWithDataNoWedding}`);
      console.log(`     Subscribed: ${russellMoss.profilesWithSubscription}`);
      console.log(`     Wedding Leads: ${russellMoss.weddingLeads}`);
      console.log(`     Total Orders: ${russellMoss.totalOrders}`);
      console.log(`     Guest Count: ${russellMoss.guestCount}`);
      console.log(`     Capture Rate: ${russellMoss.captureRate}%`);
      console.log(`     Subscription Rate: ${russellMoss.subscriptionRate}%`);
    } else {
      console.log('   ❌ Russell Moss not found in associates list');
      console.log('   Available associates:', response.data.associates?.map(a => a.name).join(', '));
    }
    console.log('');
    
    // Check company metrics
    console.log('3. Company metrics:');
    const company = response.data.companyMetrics;
    if (company) {
      console.log(`   Total Profiles: ${company.totalProfiles}`);
      console.log(`   Total Profiles with Data: ${company.totalProfilesWithData}`);
      console.log(`   Total Guest Count: ${company.totalGuestCount}`);
      console.log(`   Wedding Lead Profiles: ${company.weddingLeadProfiles}`);
      console.log(`   Company Capture Rate: ${company.companyCaptureRate}%`);
      console.log(`   Company Capture Rate (Less Weddings): ${company.companyCaptureRateLessWeddings}%`);
    }
    console.log('');
    
    // Show all associates with manual profiles
    console.log('4. All associates with manual profiles:');
    const associatesWithManual = response.data.associates?.filter(a => a.manualProfiles > 0);
    if (associatesWithManual && associatesWithManual.length > 0) {
      associatesWithManual.forEach(associate => {
        console.log(`   ${associate.name}: ${associate.manualProfiles} manual profiles`);
      });
    } else {
      console.log('   No associates with manual profiles found');
    }
    console.log('');
    
    // Show top 5 associates by total profiles
    console.log('5. Top 5 associates by total profiles:');
    const topAssociates = response.data.associates
      ?.sort((a, b) => b.profilesCreated - a.profilesCreated)
      ?.slice(0, 5);
    
    if (topAssociates) {
      topAssociates.forEach((associate, index) => {
        console.log(`   ${index + 1}. ${associate.name}: ${associate.profilesCreated} total, ${associate.manualProfiles} manual`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Run the test
testReportsAPI();
