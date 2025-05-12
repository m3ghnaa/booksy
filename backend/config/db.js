const mongoose = require('mongoose');

/**
 * Connect to MongoDB database
 * @returns {Promise<void>}
 */
const connectDB = async () => {
  try {
    // Set mongoose options
    const options = {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      maxPoolSize: 10, // Maintain up to 10 socket connections
    };

    // Connect to MongoDB
    const conn = await mongoose.connect(process.env.MONGO_URI, options);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    
    // Exit with failure in production, but keep running in development
    if (process.env.NODE_ENV === 'production') {
      console.error('Exiting process due to MongoDB connection failure');
      process.exit(1);
    }
  }
};

/**
 * Disconnect from MongoDB database
 * Useful for testing and graceful shutdowns
 * @returns {Promise<void>}
 */
const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  } catch (error) {
    console.error(`MongoDB Disconnect Error: ${error.message}`);
  }
};

module.exports = { connectDB, disconnectDB };
