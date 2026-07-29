const fs = require('fs');
const path = require('path');
const files = ['admin.js', 'billing.js', 'offers.js', 'productWarranty.js'];
files.forEach(f => {
  let p = path.join('backend/routes', f);
  let c = fs.readFileSync(p, 'utf8');
  let updated = c.replace(/router\.delete\('([^']+)',\s*auth,\s*authorize\('admin'\)/g, "router.delete('', auth, authorize('admin', 'sub-admin')");
  fs.writeFileSync(p, updated);
  console.log('Updated ' + f);
});
