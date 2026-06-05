const fs = require('fs');
const files = [
  'src/utils/exportHelper.ts',
  'src/screens/technician/TasksScreen.tsx',
  'src/screens/admin/ReportsScreen.tsx',
  'src/context/CartContext.tsx',
  'src/context/AuthContext.tsx',
  'src/api/client.ts'
];
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let depth = f.split('/').length - 2;
  let prefix = depth === 0 ? './' : '../'.repeat(depth);
  content = content.replace(/import \* as SecureStore from 'expo-secure-store';/g, `import * as SecureStore from '${prefix}utils/storage';`);
  fs.writeFileSync(f, content);
});
console.log('Replaced SecureStore imports');
