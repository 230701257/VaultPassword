import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    '⚠️ Please define the MONGODB_URI environment variable inside .env.local'
  );
}

/**
 * Global cached connection to prevent multiple connections in development
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

/**
 * Connects to MongoDB using Mongoose with caching
 * @returns {Promise<mongoose.Mongoose>}
 */
async function dbConnect() {
  if (cached.conn) {
    // Use existing cached connection
    console.log('✅ Using existing cached database connection.');
    return cached.conn;
  }

  if (!cached.promise) {
    console.log('🔌 Creating new database connection...');
    console.log('URI starts with:', MONGODB_URI.substring(0, 30), '...');

    cached.promise = mongoose
      .connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        bufferCommands: false, // Disable mongoose buffering for faster errors
      })
      .then((mongooseInstance) => {
        console.log('✅ MongoDB connected successfully!');
        return mongooseInstance;
      })
      .catch((err) => {
        console.error('❌ MongoDB connection error:', err.message);
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;
