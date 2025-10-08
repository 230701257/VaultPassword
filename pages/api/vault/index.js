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
    const decoded = jwt.verify(auth_token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    if (req.method === 'GET') {
      const items = await VaultItem.find({ userId: userId });
      res.status(200).json({ items });
    } else if (req.method === 'POST') {
      const { title, username, password, url, notes } = req.body;
      const newItem = new VaultItem({
        userId,
        title,
        username,
        password,
        url,
        notes,
      });
      await newItem.save();
      res.status(201).json({ message: 'Item added!', item: newItem });
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: 'Invalid token or server error.' });
  }
}