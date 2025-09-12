const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

// Test script to debug customer lookup in analytics
async function testCustomerLookup() {
  try {
    console.log('🔍 Testing customer lookup in analytics...\n');
    
    // Set up auth like our Commerce7 client
    const authString = `${process.env.C7_APP_ID}:${process.env.C7_API_KEY}`;
    const authToken = Buffer.from(authString).toString('base64');
    
    const headers = {
      'Authorization': `Basic ${authToken}`,
      'tenant': process.env.C7_TENANT_ID,
      'Content-Type': 'application/json'
    };
    
    // Test the exact same call that our Commerce7 client makes
    console.log('1. Testing Commerce7 customer fetch with createdAt filter:');
    const startDate = new Date('2025-08-13T00:00:00.000Z');
    const endDate = new Date('2025-09-12T23:59:59.999Z');
    
    console.log(`   Start: ${startDate.toISOString().split('T')[0]}`);
    console.log(`   End: ${endDate.toISOString().split('T')[0]}`);
    console.log(`   Customer created: 2025-09-12T19:17:08.203Z`);
    console.log(`   Customer date: 2025-09-12`);
    console.log(`   In range: ${'2025-09-12' >= '2025-08-13' && '2025-09-12' <= '2025-09-12' ? '✅ YES' : '❌ NO'}`);
    console.log('');
    
    try {
      const response = await axios.get('https://api.commerce7.com/v1/customer', {
        headers,
        params: {
          createdAt: `btw:2025-08-13|2025-09-12`,
          page: 1,
          limit: 50
        }
      });
      
      console.log('   API Response structure:');
      console.log(`   - Has customers property: ${!!response.data.customers}`);
      console.log(`   - Customers is array: ${Array.isArray(response.data.customers)}`);
      console.log(`   - Number of customers: ${response.data.customers?.length || 0}`);
      
      if (response.data.customers && response.data.customers.length > 0) {
        // Look for our specific customer
        const ourCustomer = response.data.customers.find(c => c.id === 'cdac464f-d502-4b9e-ad45-29e285fcb709');
        if (ourCustomer) {
          console.log('   ✅ Found our customer in the fetch!');
          console.log(`   Customer: ${ourCustomer.firstName} ${ourCustomer.lastName}`);
          console.log(`   MetaData:`, JSON.stringify(ourCustomer.metaData, null, 2));
        } else {
          console.log('   ❌ Our customer NOT found in this page');
          console.log('   Sample customer IDs:', response.data.customers.slice(0, 5).map(c => c.id));
        }
        
        // Check for any customers with associate-sign-up-attribution metadata
        const customersWithAttribution = response.data.customers.filter(c => 
          c.metaData && c.metaData['associate-sign-up-attribution']
        );
        console.log(`   Customers with attribution metadata: ${customersWithAttribution.length}`);
        
        if (customersWithAttribution.length > 0) {
          console.log('   Attribution customers:');
          customersWithAttribution.forEach(c => {
            console.log(`     - ${c.firstName} ${c.lastName}: ${c.metaData['associate-sign-up-attribution']}`);
          });
        }
      }
      
    } catch (error) {
      console.log(`   Error: ${error.response?.data?.message || error.message}`);
      console.log(`   Status: ${error.response?.status}`);
    }
    console.log('');
    
    // Test 2: Try without the createdAt filter to see if our customer exists
    console.log('2. Testing without date filter:');
    try {
      const response = await axios.get('https://api.commerce7.com/v1/customer', {
        headers,
        params: {
          page: 1,
          limit: 50
        }
      });
      
      if (response.data.customers && response.data.customers.length > 0) {
        const ourCustomer = response.data.customers.find(c => c.id === 'cdac464f-d502-4b9e-ad45-29e285fcb709');
        if (ourCustomer) {
          console.log('   ✅ Found our customer without date filter!');
          console.log(`   Customer: ${ourCustomer.firstName} ${ourCustomer.lastName}`);
          console.log(`   Created: ${ourCustomer.createdAt}`);
          console.log(`   MetaData:`, JSON.stringify(ourCustomer.metaData, null, 2));
        } else {
          console.log('   ❌ Our customer NOT found even without date filter');
        }
      }
      
    } catch (error) {
      console.log(`   Error: ${error.response?.data?.message || error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Run the test
testCustomerLookup();
