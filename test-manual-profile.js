const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

// Test script to find and verify manually created profile
async function testManualProfile() {
  try {
    console.log('🔍 Testing manual profile detection...\n');
    
    // Set up auth like our Commerce7 client
    const authString = `${process.env.C7_APP_ID}:${process.env.C7_API_KEY}`;
    const authToken = Buffer.from(authString).toString('base64');
    
    const headers = {
      'Authorization': `Basic ${authToken}`,
      'tenant': process.env.C7_TENANT_ID,
      'Content-Type': 'application/json'
    };
    
    console.log('Using headers:', { 
      'Authorization': `Basic ${authToken.substring(0, 20)}...`,
      'tenant': process.env.C7_TENANT_ID 
    });
    console.log('');
    
    // Test 1: Get the specific customer by ID
    console.log('1. Fetching customer by ID: cdac464f-d502-4b9e-ad45-29e285fcb709');
    const customerResponse = await axios.get('https://api.commerce7.com/v1/customer/cdac464f-d502-4b9e-ad45-29e285fcb709', {
      headers
    });
    
    const customer = customerResponse.data;
    console.log('✅ Customer found:');
    console.log(`   Name: ${customer.firstName} ${customer.lastName}`);
    console.log(`   Email: ${customer.emails?.[0]?.email || 'No email'}`);
    console.log(`   Created: ${customer.createdAt}`);
    console.log(`   MetaData:`, JSON.stringify(customer.metaData, null, 2));
    console.log(`   Tags:`, customer.tags?.map(t => t.title).join(', ') || 'No tags');
    console.log('');
    
    // Test 2: Check if customer is in date range (last 30 days)
    const customerDate = new Date(customer.createdAt);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    console.log('2. Checking date range:');
    console.log(`   Customer created: ${customerDate.toISOString()}`);
    console.log(`   30 days ago: ${thirtyDaysAgo.toISOString()}`);
    console.log(`   In range: ${customerDate >= thirtyDaysAgo ? '✅ YES' : '❌ NO'}`);
    console.log('');
    
    // Test 3: Test metadata extraction
    console.log('3. Testing metadata extraction:');
    const metadata = customer.metaData || {};
    console.log(`   Raw metadata:`, metadata);
    
    const associateAttribution = metadata['associate-sign-up-attribution'];
    console.log(`   Associate attribution: "${associateAttribution}"`);
    
    if (associateAttribution) {
      console.log('   ✅ Found associate attribution metadata');
    } else {
      console.log('   ❌ No associate attribution metadata found');
    }
    console.log('');
    
    // Test 4: Test name matching
    console.log('4. Testing name matching:');
    const knownAssociates = ['Russell Moss', 'Andrew Relyea', 'Test Associate'];
    console.log(`   Known associates: ${knownAssociates.join(', ')}`);
    console.log(`   Metadata value: "${associateAttribution}"`);
    
    if (associateAttribution) {
      // Simple exact match test
      const exactMatch = knownAssociates.find(associate => 
        associate.toLowerCase() === associateAttribution.toLowerCase()
      );
      console.log(`   Exact match: ${exactMatch || 'None'}`);
      
      // Test fuzzy matching
      const fuzzyMatch = findBestMatch(associateAttribution, knownAssociates);
      console.log(`   Fuzzy match: ${fuzzyMatch ? `${fuzzyMatch.match} (${fuzzyMatch.confidence}%)` : 'None'}`);
    }
    console.log('');
    
    // Test 5: Check if customer has orders
    console.log('5. Checking for orders:');
    try {
      const ordersResponse = await axios.get('https://api.commerce7.com/v1/order', {
        headers,
        params: {
          customerId: 'cdac464f-d502-4b9e-ad45-29e285fcb709',
          limit: 10
        }
      });
      
      const orders = ordersResponse.data;
      console.log(`   Orders found: ${orders.length}`);
      if (orders.length > 0) {
        console.log(`   First order: ${orders[0].orderNumber} (${orders[0].createdAt})`);
      }
    } catch (orderError) {
      console.log(`   Error fetching orders: ${orderError.message}`);
    }
    console.log('');
    
    // Test 6: Test our analytics API
    console.log('6. Testing analytics API:');
    const analyticsResponse = await axios.post('http://localhost:3000/api/analytics/metrics', {
      startDate: thirtyDaysAgo.toISOString(),
      endDate: new Date().toISOString(),
      refresh: true
    });
    
    const analytics = analyticsResponse.data;
    console.log(`   API Response Status: ${analyticsResponse.status}`);
    console.log(`   Total associates: ${analytics.associates.length}`);
    
    // Look for Russell Moss in results
    const russellMoss = analytics.associates.find(a => a.name === 'Russell Moss');
    if (russellMoss) {
      console.log(`   Russell Moss found:`);
      console.log(`     Manual Profiles: ${russellMoss.manualProfiles}`);
      console.log(`     Total Profiles: ${russellMoss.profilesCreated}`);
    } else {
      console.log(`   ❌ Russell Moss not found in analytics results`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Simple fuzzy matching function for testing
function findBestMatch(input, candidates) {
  let bestMatch = null;
  let bestScore = 0;
  
  for (const candidate of candidates) {
    const score = calculateSimilarity(input.toLowerCase(), candidate.toLowerCase());
    if (score > bestScore && score >= 85) {
      bestScore = score;
      bestMatch = candidate;
    }
  }
  
  return bestMatch ? { match: bestMatch, confidence: Math.round(bestScore) } : null;
}

function calculateSimilarity(str1, str2) {
  const distance = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  return maxLength === 0 ? 100 : ((maxLength - distance) / maxLength) * 100;
}

function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

// Run the test
testManualProfile();
