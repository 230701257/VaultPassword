import jwt from 'jsonwebtoken';
import dbConnect from '../../../lib/dbConnect';
import VaultItem from '../../../models/VaultItem';

export default async function handler(req, res) {
  await dbConnect();
  const { auth_token } = req.cookies;
  const { id } = req.query;

  if (!auth_token) {
    return res.status(401).json({ message: 'Not authenticated.' });
  }

  try {
    const decoded = jwt.verify(auth_token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // --- DELETE Request ---
    if (req.method === 'DELETE') {
      const result = await VaultItem.deleteOne({ _id: id, userId: userId });
      if (result.deletedCount === 0) {
        return res.status(404).json({ message: 'Item not found or user not authorized.' });
      }
      return res.status(200).json({ message: 'Item deleted successfully.' });
    }

    // --- PUT (Update) Request ---
    if (req.method === 'PUT') {
      const { title, username, password, url, notes } = req.body;
      const updatedItem = await VaultItem.findOneAndUpdate(
        { _id: id, userId: userId },
        { title, username, password, url, notes },
        { new: true } // This option returns the updated document
      );
      if (!updatedItem) {
        return res.status(404).json({ message: 'Item not found or user not authorized.' });
      }
      return res.status(200).json({ message: 'Item updated!', item: updatedItem });
    }
    
    // If method is not DELETE or PUT
    res.setHeader('Allow', ['DELETE', 'PUT']);
    return res.status(405).json({ message: `Method ${req.method} not allowed` });

  } catch (error) {
    console.error(error);
    res.status(401).json({ message: 'Invalid token or server error.' });
  }
}