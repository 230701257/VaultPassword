import { serialize } from 'cookie';

export default function handler(req, res) {
  // We are creating a new cookie with the same name, but with an
  // expiration date in the past. This tells the browser to delete it.
  const cookie = serialize('auth_token', '', {
    maxAge: -1, // Expire the cookie immediately
    path: '/',
  });

  res.setHeader('Set-Cookie', cookie);
  res.status(200).json({ message: 'Successfully logged out.' });
}