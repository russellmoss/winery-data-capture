const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

// Test to examine the exact structure of our manually created customer
async function testCustomerStructure() {
  try {
    console.log('🔍 Examining customer structure for manual profile detection...\n');
    
    // Set up auth like our Commerce7 client
    const authString = `${process.env.C7_APP_ID}:${process.env.C7_API_KEY}`;
    const authToken = Buffer.from(authString).toString('base64');
    
    const headers = {
      'Authorization': `Basic ${authToken}`,
      'tenant': process.env.C7_TENANT_ID,
      'Content-Type': 'application/json'
    };
    
    // Get the specific customer
    console.log('1. Fetching customer cdac464f-d502-4b9e-ad45-29e285fcb709:');
    const response = await axios.get('https://api.commerce7.com/v1/customer/cdac464f-d502-4b9e-ad45-29e285fcb709', {
      headers
    });
    
    const customer = response.data;
    
    console.log('✅ Customer found! Full structure:');
    console.log(JSON.stringify(customer, null, 2));
    console.log('');
    
    // Analyze the metadata structure
    console.log('2. Analyzing metadata structure:');
    console.log(`   metaData type: ${typeof customer.metaData}`);
    console.log(`   metaData is null: ${customer.metaData === null}`);
    console.log(`   metaData is undefined: ${customer.metaData === undefined}`);
    console.log(`   metaData is object: ${typeof customer.metaData === 'object' && customer.metaData !== null}`);
    
    if (customer.metaData) {
      console.log(`   metaData keys: ${Object.keys(customer.metaData).join(', ')}`);
      console.log(`   Has associate-sign-up-attribution: ${!!customer.metaData['associate-sign-up-attribution']}`);
      console.log(`   associate-sign-up-attribution value: "${customer.metaData['associate-sign-up-attribution']}"`);
      console.log(`   associate-sign-up-attribution type: ${typeof customer.metaData['associate-sign-up-attribution']}`);
    }
    console.log('');
    
    // Analyze the tags structure
    console.log('3. Analyzing tags structure:');
    console.log(`   tags type: ${typeof customer.tags}`);
    console.log(`   tags is array: ${Array.isArray(customer.tags)}`);
    console.log(`   tags length: ${customer.tags?.length || 0}`);
    
    if (customer.tags && customer.tags.length > 0) {
      console.log('   Tags:');
      customer.tags.forEach((tag, index) => {
        console.log(`     ${index + 1}. ID: ${tag.id}, Title: "${tag.title}"`);
      });
    }
    console.log('');
    
    // Test our analytics logic step by step
    console.log('4. Testing analytics logic step by step:');
    
    // Step 1: Check if customer has associate-sign-up-attribution metadata
    const hasAttribution = customer.metaData && customer.metaData['associate-sign-up-attribution'];
    console.log(`   Step 1 - Has attribution metadata: ${hasAttribution ? '✅ YES' : '❌ NO'}`);
    
    if (hasAttribution) {
      const attributionValue = customer.metaData['associate-sign-up-attribution'];
      console.log(`   Step 2 - Attribution value: "${attributionValue}"`);
      
      // Step 3: Test name matching
      const knownAssociates = ['Russell Moss', 'Andrew Relyea', 'Test Associate'];
      console.log(`   Step 3 - Known associates: ${knownAssociates.join(', ')}`);
      
      // Simple exact match
      const exactMatch = knownAssociates.find(associate => 
        associate.toLowerCase() === attributionValue.toLowerCase()
      );
      console.log(`   Step 4 - Exact match: ${exactMatch || 'None'}`);
      
      // Test fuzzy matching
      const fuzzyMatch = findBestMatch(attributionValue, knownAssociates);
      console.log(`   Step 5 - Fuzzy match: ${fuzzyMatch ? `${fuzzyMatch.match} (${fuzzyMatch.confidence}%)` : 'None'}`);
      
      if (exactMatch || fuzzyMatch) {
        console.log(`   ✅ RESULT: Customer should be attributed to ${exactMatch || fuzzyMatch.match}`);
      } else {
        console.log(`   ❌ RESULT: No matching associate found`);
      }
    }
    console.log('');
    
    // Test the date range issue
    console.log('5. Testing date range inclusion:');
    const customerDate = new Date(customer.createdAt);
    const customerDateStr = customerDate.toISOString().split('T')[0];
    console.log(`   Customer created: ${customer.createdAt}`);
    console.log(`   Customer date string: ${customerDateStr}`);
    
    // Test with our fixed date range
    const startDate = new Date('2025-08-13T00:00:00.000Z');
    const endDate = new Date('2025-09-12T23:59:59.999Z');
    const inclusiveEndDate = new Date(endDate);
    inclusiveEndDate.setDate(inclusiveEndDate.getDate() + 1);
    
    console.log(`   Analytics start date: ${startDate.toISOString().split('T')[0]}`);
    console.log(`   Analytics end date: ${endDate.toISOString().split('T')[0]}`);
    console.log(`   Analytics inclusive end date: ${inclusiveEndDate.toISOString().split('T')[0]}`);
    console.log(`   Customer in range: ${customerDateStr >= startDate.toISOString().split('T')[0] && customerDateStr <= endDate.toISOString().split('T')[0] ? '✅ YES' : '❌ NO'}`);
    console.log(`   Customer in inclusive range: ${customerDateStr >= startDate.toISOString().split('T')[0] && customerDateStr < inclusiveEndDate.toISOString().split('T')[0] ? '✅ YES' : '❌ NO'}`);
    
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
testCustomerStructure();
