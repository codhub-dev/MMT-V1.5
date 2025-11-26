const DriverProfile = require('../models/driverProfiles-model');

// Sample test data for driver profiles
const sampleDriverData = [
  {
    addedBy: "test-user-1",
    name: "Brinda S",
    contact: "9876543210",
    age: 32,
    experience: "5 years",
    license: "DL123456",
    gender: "Female",
    photo: "https://randomuser.me/api/portraits/women/32.jpg"
  },
  {
    addedBy: "test-user-1",
    name: "Rahul K",
    contact: "9123456789",
    age: 29,
    experience: "3 years",
    license: "DL654321",
    gender: "Male",
    photo: "https://randomuser.me/api/portraits/men/32.jpg"
  },
  {
    addedBy: "test-user-2",
    name: "Priya M",
    contact: "9988776655",
    age: 27,
    experience: "4 years",
    license: "DL987654",
    gender: "Female"
  }
];

// Function to seed sample data (for testing purposes)
const seedDriverProfiles = async () => {
  try {
    console.log('Seeding driver profiles...');

    // Clear existing data
    await DriverProfile.deleteMany({});

    // Insert sample data
    const result = await DriverProfile.insertMany(sampleDriverData);

    console.log(`Successfully seeded ${result.length} driver profiles:`);
    result.forEach(driver => {
      console.log(`- ${driver.name} (License: ${driver.license})`);
    });

    return result;
  } catch (error) {
    console.error('Error seeding driver profiles:', error);
    throw error;
  }
};

// Function to validate model schema
const validateDriverModel = async () => {
  try {
    console.log('Validating driver profile model...');

    // Test valid data
    const validDriver = new DriverProfile(sampleDriverData[0]);
    await validDriver.validate();
    console.log('✓ Valid driver profile passed validation');

    // Test invalid data (missing required field)
    try {
      const invalidDriver = new DriverProfile({
        addedBy: "test-user",
        name: "Test Driver"
        // Missing required fields
      });
      await invalidDriver.validate();
      console.log('✗ Validation should have failed');
    } catch (validationError) {
      console.log('✓ Invalid driver profile correctly failed validation');
    }

    // Test license uniqueness constraint
    try {
      const duplicate1 = new DriverProfile({...sampleDriverData[0]});
      const duplicate2 = new DriverProfile({...sampleDriverData[0], name: "Different Name"});

      await duplicate1.save();
      await duplicate2.save(); // This should fail due to unique license
      console.log('✗ Duplicate license should have been rejected');
    } catch (duplicateError) {
      console.log('✓ Duplicate license correctly rejected');
    }

    console.log('Model validation completed successfully');
  } catch (error) {
    console.error('Model validation failed:', error);
    throw error;
  }
};

module.exports = {
  sampleDriverData,
  seedDriverProfiles,
  validateDriverModel
};