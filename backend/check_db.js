const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config();

async function check() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cctv_sk_tech');
  const products = await Product.find().limit(2);
  console.log(JSON.stringify(products, null, 2));
  process.exit(0);
}

check();
