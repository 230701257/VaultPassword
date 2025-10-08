import jwt from 'jsonwebtoken';
import dbConnect from '../../../lib/dbConnect';
import VaultItem from '../../../models/VaultItem';

export default async function handler(req, res) {
  await dbConnect();

  const { auth_token } = req.cookies;

  if (!auth_token) {
    return res.status(401).json({ message: 'Not authenticated.' });
  }

  try {
    // Verify JWT token
    const decoded = jwt.verify(auth_token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // --- GET: Fetch all vault items ---
    if (req.method === 'GET') {
      const items = await VaultItem.find({ userId });
      return res.status(200).json({ items });
    }

    // --- POST: Add a new vault item ---
    if (req.method === 'POST') {
      const { title, username, password, url = '', notes = '' } = req.body;

      // Validate required fields
      if (!title || !username || !password) {
        return res.status(422).json({ message: 'Title, username, and password are required.' });
      }

      const newItem = new VaultItem({
        userId,
        title,
        username,
        password,
        url,
        notes,
      });

      await newItem.save();
      return res.status(201).json({ message: 'Item added successfully!', item: newItem });
    }

    // --- Method Not Allowed ---
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ message: `Method ${req.method} not allowed.` });
  } catch (error) {
    console.error('Vault API Error:', error);
    return res.status(401).json({ message: 'Invalid token or server error.' });
  }
}
