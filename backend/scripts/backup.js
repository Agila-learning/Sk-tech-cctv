require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const backupData = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected!');

    const backupDir = path.join(__dirname, '../backup-' + Date.now());
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }

    const collections = await mongoose.connection.db.listCollections().toArray();
    for (let collection of collections) {
      const name = collection.name;
      console.log(`Backing up ${name}...`);
      const data = await mongoose.connection.db.collection(name).find({}).toArray();
      fs.writeFileSync(path.join(backupDir, `${name}.json`), JSON.stringify(data, null, 2));
      console.log(`Saved ${data.length} records from ${name}`);
    }

    console.log(`Backup completed successfully in ${backupDir}`);
  } catch (err) {
    console.error('Backup failed:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

backupData();
