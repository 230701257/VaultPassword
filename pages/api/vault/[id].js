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
    // Verify JWT token
    const decoded = jwt.verify(auth_token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // --- DELETE Request ---
    if (req.method === 'DELETE') {
      const result = await VaultItem.deleteOne({ _id: id, userId });

      if (result.deletedCount === 0) {
        return res
          .status(404)
          .json({ message: 'Item not found or user not authorized.' });
      }

      return res.status(200).json({ message: 'Item deleted successfully.' });
    }

    // --- PUT (Update) Request ---
    if (req.method === 'PUT') {
      const { title, username, password, url, notes } = req.body;

      // Ensure at least one field is provided
      if (!title && !username && !password && !url && !notes) {
        return res.status(400).json({ message: 'No fields to update.' });
      }

      const updatedItem = await VaultItem.findOneAndUpdate(
        { _id: id, userId },
        { title, username, password, url, notes },
        { new: true, runValidators: true } // Return updated doc & validate
      );

      if (!updatedItem) {
        return res
          .status(404)
          .json({ message: 'Item not found or user not authorized.' });
      }

      return res
        .status(200)
        .json({ message: 'Item updated successfully!', item: updatedItem });
    }

    // --- Method Not Allowed ---
    res.setHeader('Allow', ['DELETE', 'PUT']);
    return res
      .status(405)
      .json({ message: `Method ${req.method} not allowed.` });
  } catch (error) {
    console.error('Vault Item API Error:', error);
    return res.status(401).json({ message: 'Invalid token or server error.' });
  }
}
