import dbConnect from '../../../lib/dbConnect';
import User from '../../../models/User';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  // --- CHECKPOINT 1: Log when the API route is hit ---
  console.log("\n--- /api/auth/signup endpoint hit ---");

  // --- CHECKPOINT 2: Check if environment variables are loaded ---
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error("ERROR: MONGODB_URI environment variable is NOT loaded!");
    return res.status(500).json({ message: "Server configuration error." });
  } else {
    // Log a masked version for security
    console.log("MONGODB_URI loaded successfully. Starts with:", mongoUri.substring(0, 20) + "...");
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // dbConnect will now have its own detailed logs
    await dbConnect();

    const { email, password } = req.body;
    if (!email || !password || password.length < 6) {
      return res.status(422).json({ message: 'Invalid input.' });
    }

    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      return res.status(422).json({ message: 'User already exists!' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();

    console.log("--- User successfully created! ---");
    res.status(201).json({ message: 'User created!' });

  } catch (error) {
    // --- CHECKPOINT 5: Log any other errors that occur ---
    console.error("An unexpected error occurred in signup handler:", error);
    res.status(500).json({ message: 'An internal server error occurred.' });
  }
}