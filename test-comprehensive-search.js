const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

// Comprehensive test to find the manually created customer
async function testComprehensiveSearch() {
  try {
    console.log('🔍 Comprehensive search for manually created customer...\n');
    
    // Set up auth like our Commerce7 client
    const authString = `${process.env.C7_APP_ID}:${process.env.C7_API_KEY}`;
    const authToken = Buffer.from(authString).toString('base64');
    
    const headers = {
      'Authorization': `Basic ${authToken}`,
      'tenant': process.env.C7_TENANT_ID,
      'Content-Type': 'application/json'
    };
    
    // Test 1: Direct customer lookup by ID
    console.log('1. Direct customer lookup by ID:');
    try {
      const response = await axios.get('https://api.commerce7.com/v1/customer/cdac464f-d502-4b9e-ad45-29e285fcb709', {
        headers
      });
      
      const customer = response.data;
      console.log('   ✅ Customer found by direct ID lookup');
      console.log(`   Name: ${customer.firstName} ${customer.lastName}`);
      console.log(`   Email: ${customer.emails?.[0]?.email || 'No email'}`);
      console.log(`   Created: ${customer.createdAt}`);
      console.log(`   MetaData:`, JSON.stringify(customer.metaData, null, 2));
      console.log(`   Tags:`, customer.tags?.map(t => t.title).join(', ') || 'No tags');
      
    } catch (error) {
      console.log(`   ❌ Error finding customer by ID: ${error.response?.data?.message || error.message}`);
    }
    console.log('');
    
    // Test 2: Search by email
    console.log('2. Search by email:');
    try {
      const response = await axios.get('https://api.commerce7.com/v1/customer', {
        headers,
        params: {
          q: 'gagaka@gmail.com'
        }
      });
      
      console.log(`   Search results: ${response.data.customers?.length || 0} customers`);
      if (response.data.customers && response.data.customers.length > 0) {
        const customer = response.data.customers[0];
        console.log(`   Found: ${customer.firstName} ${customer.lastName} (${customer.id})`);
        console.log(`   MetaData:`, JSON.stringify(customer.metaData, null, 2));
      }
      
    } catch (error) {
      console.log(`   Error searching by email: ${error.response?.data?.message || error.message}`);
    }
    console.log('');
    
    // Test 3: Search through multiple pages to find our customer
    console.log('3. Searching through multiple pages:');
    try {
      let found = false;
      let page = 1;
      let totalSearched = 0;
      
      while (page <= 10 && !found) { // Search first 10 pages
        console.log(`   Searching page ${page}...`);
        const response = await axios.get('https://api.commerce7.com/v1/customer', {
          headers,
          params: {
            page,
            limit: 50
          }
        });
        
        const customers = response.data.customers || [];
        totalSearched += customers.length;
        
        const ourCustomer = customers.find(c => c.id === 'cdac464f-d502-4b9e-ad45-29e285fcb709');
        if (ourCustomer) {
          console.log(`   ✅ Found our customer on page ${page}!`);
          console.log(`   Customer: ${ourCustomer.firstName} ${ourCustomer.lastName}`);
          console.log(`   MetaData:`, JSON.stringify(ourCustomer.metaData, null, 2));
          found = true;
          break;
        }
        
        // Also check for any customers with attribution metadata
        const customersWithAttribution = customers.filter(c => 
          c.metaData && c.metaData['associate-sign-up-attribution']
        );
        
        if (customersWithAttribution.length > 0) {
          console.log(`   Found ${customersWithAttribution.length} customers with attribution on page ${page}:`);
          customersWithAttribution.forEach(c => {
            console.log(`     - ${c.firstName} ${c.lastName}: ${c.metaData['associate-sign-up-attribution']}`);
          });
        }
        
        if (customers.length < 50) {
          console.log(`   Reached end of customers (page ${page})`);
          break;
        }
        
        page++;
      }
      
      console.log(`   Total customers searched: ${totalSearched}`);
      if (!found) {
        console.log('   ❌ Customer not found in first 10 pages');
      }
      
    } catch (error) {
      console.log(`   Error in pagination search: ${error.response?.data?.message || error.message}`);
    }
    console.log('');
    
    // Test 4: Check if the issue is with the date range format
    console.log('4. Testing different date range formats:');
    const dateFormats = [
      'btw:2025-08-13|2025-09-12',
      'btw:2025-08-13T00:00:00.000Z|2025-09-12T23:59:59.999Z',
      'btw:2025-09-12|2025-09-12', // Just today
    ];
    
    for (const dateFormat of dateFormats) {
      try {
        console.log(`   Testing format: ${dateFormat}`);
        const response = await axios.get('https://api.commerce7.com/v1/customer', {
          headers,
          params: {
            createdAt: dateFormat,
            page: 1,
            limit: 50
          }
        });
        
        const customers = response.data.customers || [];
        console.log(`     Found ${customers.length} customers`);
        
        const ourCustomer = customers.find(c => c.id === 'cdac464f-d502-4b9e-ad45-29e285fcb709');
        if (ourCustomer) {
          console.log(`     ✅ Found our customer with this format!`);
        }
        
      } catch (error) {
        console.log(`     Error: ${error.response?.data?.message || error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Run the test
testComprehensiveSearch();
