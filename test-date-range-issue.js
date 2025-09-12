const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

// Test to debug the date range issue
async function testDateRangeIssue() {
  try {
    console.log('🔍 Testing date range issue...\n');
    
    // Set up auth like our Commerce7 client
    const authString = `${process.env.C7_APP_ID}:${process.env.C7_API_KEY}`;
    const authToken = Buffer.from(authString).toString('base64');
    
    const headers = {
      'Authorization': `Basic ${authToken}`,
      'tenant': process.env.C7_TENANT_ID,
      'Content-Type': 'application/json'
    };
    
    // Test 1: Get the customer directly to see the exact creation date
    console.log('1. Getting customer creation date details:');
    try {
      const response = await axios.get('https://api.commerce7.com/v1/customer/cdac464f-d502-4b9e-ad45-29e285fcb709', {
        headers
      });
      
      const customer = response.data;
      const createdAt = new Date(customer.createdAt);
      
      console.log(`   Raw createdAt: ${customer.createdAt}`);
      console.log(`   Parsed date: ${createdAt.toISOString()}`);
      console.log(`   Date only: ${createdAt.toISOString().split('T')[0]}`);
      console.log(`   Local date: ${createdAt.toLocaleDateString()}`);
      console.log(`   Local time: ${createdAt.toLocaleTimeString()}`);
      console.log(`   Timezone offset: ${createdAt.getTimezoneOffset()}`);
      console.log('');
      
      // Test 2: Try different date ranges around the creation date
      console.log('2. Testing different date ranges:');
      const dateRanges = [
        // Just the date
        `btw:2025-09-12|2025-09-12`,
        // Include previous day
        `btw:2025-09-11|2025-09-12`,
        // Include next day
        `btw:2025-09-12|2025-09-13`,
        // Broader range
        `btw:2025-09-10|2025-09-15`,
        // Full month
        `btw:2025-09-01|2025-09-30`,
        // Last 30 days
        `btw:2025-08-13|2025-09-12`,
      ];
      
      for (const dateRange of dateRanges) {
        try {
          console.log(`   Testing: ${dateRange}`);
          const response = await axios.get('https://api.commerce7.com/v1/customer', {
            headers,
            params: {
              createdAt: dateRange,
              page: 1,
              limit: 50
            }
          });
          
          const customers = response.data.customers || [];
          console.log(`     Found ${customers.length} customers`);
          
          const ourCustomer = customers.find(c => c.id === 'cdac464f-d502-4b9e-ad45-29e285fcb709');
          if (ourCustomer) {
            console.log(`     ✅ FOUND OUR CUSTOMER!`);
            console.log(`     Customer: ${ourCustomer.firstName} ${ourCustomer.lastName}`);
            console.log(`     MetaData:`, JSON.stringify(ourCustomer.metaData, null, 2));
            break; // Found it, no need to test more ranges
          }
          
        } catch (error) {
          console.log(`     Error: ${error.response?.data?.message || error.message}`);
        }
      }
      console.log('');
      
      // Test 3: Check if there are any customers created today at all
      console.log('3. Checking for any customers created today:');
      try {
        const response = await axios.get('https://api.commerce7.com/v1/customer', {
          headers,
          params: {
            createdAt: `btw:2025-09-12|2025-09-12`,
            page: 1,
            limit: 50
          }
        });
        
        const customers = response.data.customers || [];
        console.log(`   Customers created today: ${customers.length}`);
        
        if (customers.length > 0) {
          console.log('   Sample customers created today:');
          customers.slice(0, 3).forEach(c => {
            console.log(`     - ${c.firstName} ${c.lastName} (${c.createdAt})`);
          });
        }
        
      } catch (error) {
        console.log(`   Error: ${error.response?.data?.message || error.message}`);
      }
      console.log('');
      
      // Test 4: Try without date filter but with a limit to see recent customers
      console.log('4. Checking recent customers without date filter:');
      try {
        const response = await axios.get('https://api.commerce7.com/v1/customer', {
          headers,
          params: {
            page: 1,
            limit: 100
          }
        });
        
        const customers = response.data.customers || [];
        console.log(`   Recent customers (first 100): ${customers.length}`);
        
        // Look for customers created today
        const todayCustomers = customers.filter(c => {
          const created = new Date(c.createdAt);
          return created.toISOString().split('T')[0] === '2025-09-12';
        });
        
        console.log(`   Customers created today in recent 100: ${todayCustomers.length}`);
        
        if (todayCustomers.length > 0) {
          console.log('   Today\'s customers:');
          todayCustomers.forEach(c => {
            console.log(`     - ${c.firstName} ${c.lastName} (${c.createdAt})`);
            if (c.id === 'cdac464f-d502-4b9e-ad45-29e285fcb709') {
              console.log(`       ✅ THIS IS OUR CUSTOMER!`);
            }
          });
        }
        
      } catch (error) {
        console.log(`   Error: ${error.response?.data?.message || error.message}`);
      }
      
    } catch (error) {
      console.log(`   Error getting customer: ${error.response?.data?.message || error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Run the test
testDateRangeIssue();
