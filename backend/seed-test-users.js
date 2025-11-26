const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import your User model (adjust path as needed)
// const User = require('./models/User');

// MongoDB connection - try multiple possible env variable names
const MONGODB_URI = process.env.MONGODB_URL || 
                    process.env.MONGODB_URI || 
                    process.env.DATABASE_URL || 
                    process.env.DB_URL ||
                    process.env.MONGO_URI;

if (!MONGODB_URI) {
  console.error('❌ Error: MongoDB connection string not found!');
  console.error('Please set one of these environment variables:');
  console.error('  - MONGODB_URI');
  console.error('  - DATABASE_URL');
  console.error('  - DB_URL');
  console.error('  - MONGO_URI');
  console.error('  - MONGODB_URL');
  process.exit(1);
}

async function seedTestUsers() {
  try {
    console.log('Connecting to MongoDB...');
    console.log('Using connection string:', MONGODB_URI.replace(/:[^:@]+@/, ':****@')); // Hide password
    
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB successfully\n');

    // Read CSV file
    const csvPath = path.join(__dirname, 'test-data.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n').slice(1); // Skip header

    // Define User Schema inline if model not available
    const userSchema = new mongoose.Schema({
      username: { type: String, required: true, unique: true },
      password: { type: String, required: true },
      email: String,
      createdAt: { type: Date, default: Date.now },
    });

    const User = mongoose.models.User || mongoose.model('User', userSchema);

    console.log('Seeding test users from CSV...');
    console.log('─'.repeat(50));
    
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const line of lines) {
      if (!line.trim()) continue;

      const [username, password] = line.split(',').map(s => s.trim());
      
      if (!username || !password) continue;

      try {
        // Check if user already exists
        const existingUser = await User.findOne({ username });
        
        if (existingUser) {
          console.log(`⚠️  ${username.padEnd(20)} - Already exists (skipping)`);
          skipCount++;
          continue;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        await User.create({
          username,
          password: hashedPassword,
          email: `${username}@test.com`,
        });

        console.log(`✓  ${username.padEnd(20)} - Created successfully`);
        successCount++;
      } catch (error) {
        console.error(`✗  ${username.padEnd(20)} - Failed: ${error.message}`);
        errorCount++;
      }
    }

    console.log('─'.repeat(50));
    console.log('\n📊 Seeding Summary:');
    console.log(`   ✓ Successfully created: ${successCount} users`);
    console.log(`   ⚠️  Already existed:     ${skipCount} users`);
    console.log(`   ✗ Failed:              ${errorCount} users`);
    console.log(`   📈 Total processed:     ${successCount + skipCount + errorCount} users\n`);

  } catch (error) {
    console.error('❌ Error seeding users:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the seed function
seedTestUsers();
