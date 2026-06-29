const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
// We need a token to test auth routes, but let's just check if the routes exist (should return 401, not 404)

async function testRoutes() {
  const routes = [
    '/bookings/admin/all',
    '/subscription',
    '/wishlist',
    '/admin/stats',
    '/admin/logs'
  ];

  for (const route of routes) {
    try {
      const res = await axios.get(`${API_URL}${route}`);
      console.log(`[PASS/AUTH] ${route}: ${res.status}`);
    } catch (err) {
      if (err.response) {
        console.log(`[${err.response.status === 404 ? 'FAIL' : 'OK'}] ${route}: ${err.response.status}`);
      } else {
        console.log(`[ERROR] ${route}: ${err.message}`);
      }
    }
  }
}

testRoutes();
