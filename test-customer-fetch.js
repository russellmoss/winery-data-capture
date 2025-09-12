const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

// Test script to debug customer fetching
async function testCustomerFetch() {
  try {
    console.log('🔍 Testing customer fetching for manual profile...\n');
    
    // Set up auth like our Commerce7 client
    const authString = `${process.env.C7_APP_ID}:${process.env.C7_API_KEY}`;
    const authToken = Buffer.from(authString).toString('base64');
    
    const headers = {
      'Authorization': `Basic ${authToken}`,
      'tenant': process.env.C7_TENANT_ID,
      'Content-Type': 'application/json'
    };
    
    // Test 1: Check what date range the analytics is using
    console.log('1. Testing analytics API date range:');
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    console.log(`   Today: ${today.toISOString()}`);
    console.log(`   30 days ago: ${thirtyDaysAgo.toISOString()}`);
    console.log(`   Customer created: 2025-09-12T19:17:08.203Z`);
    console.log(`   In range: ${new Date('2025-09-12T19:17:08.203Z') >= thirtyDaysAgo ? '✅ YES' : '❌ NO'}`);
    console.log('');
    
    // Test 2: Try to fetch customers by date range like our analytics does
    console.log('2. Testing customer fetch by date range:');
    try {
      const customersResponse = await axios.get('https://api.commerce7.com/v1/customer', {
        headers,
        params: {
          startDate: thirtyDaysAgo.toISOString(),
          endDate: today.toISOString(),
          limit: 100
        }
      });
      
      const customers = customersResponse.data;
      console.log(`   Found ${customers.length} customers in date range`);
      
      // Look for our specific customer
      const ourCustomer = customers.find(c => c.id === 'cdac464f-d502-4b9e-ad45-29e285fcb709');
      if (ourCustomer) {
        console.log('   ✅ Found our customer in date range fetch');
        console.log(`   Customer: ${ourCustomer.firstName} ${ourCustomer.lastName}`);
        console.log(`   MetaData:`, JSON.stringify(ourCustomer.metaData, null, 2));
      } else {
        console.log('   ❌ Our customer NOT found in date range fetch');
        console.log('   Sample customer IDs:', customers.slice(0, 5).map(c => c.id));
      }
    } catch (error) {
      console.log(`   Error fetching customers: ${error.response?.data?.message || error.message}`);
    }
    console.log('');
    
    // Test 3: Try fetching customers without date range
    console.log('3. Testing customer fetch without date range:');
    try {
      const customersResponse = await axios.get('https://api.commerce7.com/v1/customer', {
        headers,
        params: {
          limit: 100
        }
      });
      
      const customers = customersResponse.data;
      console.log(`   Found ${customers.length} customers (no date filter)`);
      
      // Look for our specific customer
      const ourCustomer = customers.find(c => c.id === 'cdac464f-d502-4b9e-ad45-29e285fcb709');
      if (ourCustomer) {
        console.log('   ✅ Found our customer in general fetch');
        console.log(`   Customer: ${ourCustomer.firstName} ${ourCustomer.lastName}`);
        console.log(`   Created: ${ourCustomer.createdAt}`);
        console.log(`   MetaData:`, JSON.stringify(ourCustomer.metaData, null, 2));
      } else {
        console.log('   ❌ Our customer NOT found in general fetch');
      }
    } catch (error) {
      console.log(`   Error fetching customers: ${error.response?.data?.message || error.message}`);
    }
    console.log('');
    
    // Test 4: Check if the issue is with pagination
    console.log('4. Testing pagination:');
    try {
      let allCustomers = [];
      let page = 1;
      let hasMore = true;
      
      while (hasMore && page <= 5) { // Limit to 5 pages for testing
        console.log(`   Fetching page ${page}...`);
        const customersResponse = await axios.get('https://api.commerce7.com/v1/customer', {
          headers,
          params: {
            page,
            limit: 50
          }
        });
        
        const customers = customersResponse.data;
        allCustomers = allCustomers.concat(customers);
        
        console.log(`   Page ${page}: ${customers.length} customers`);
        
        // Check if we found our customer
        const ourCustomer = customers.find(c => c.id === 'cdac464f-d502-4b9e-ad45-29e285fcb709');
        if (ourCustomer) {
          console.log(`   ✅ Found our customer on page ${page}!`);
          console.log(`   Customer: ${ourCustomer.firstName} ${ourCustomer.lastName}`);
          console.log(`   MetaData:`, JSON.stringify(ourCustomer.metaData, null, 2));
          break;
        }
        
        hasMore = customers.length === 50; // If we got less than 50, we're done
        page++;
      }
      
      console.log(`   Total customers fetched: ${allCustomers.length}`);
      
      if (!allCustomers.find(c => c.id === 'cdac464f-d502-4b9e-ad45-29e285fcb709')) {
        console.log('   ❌ Customer not found in any of the first 5 pages');
      }
      
    } catch (error) {
      console.log(`   Error with pagination: ${error.response?.data?.message || error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Run the test
testCustomerFetch();
