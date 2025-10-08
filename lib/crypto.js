import CryptoJS from 'crypto-js';

/**
 * Encrypts a string using AES encryption with the given key.
 * @param {string} text - The plaintext to encrypt.
 * @param {string} key - The encryption key.
 * @returns {string} - The encrypted ciphertext.
 */
export const encrypt = (text, key) => {
  if (typeof text !== 'string' || !text) return text; // Return as is if empty or invalid
  try {
    return CryptoJS.AES.encrypt(text, key).toString();
  } catch (error) {
    console.error('Encryption failed:', error);
    return '';
  }
};

/**
 * Decrypts an AES-encrypted string using the given key.
 * @param {string} ciphertext - The encrypted text.
 * @param {string} key - The encryption key.
 * @returns {string} - The decrypted plaintext.
 */
export const decrypt = (ciphertext, key) => {
  if (typeof ciphertext !== 'string' || !ciphertext) return ciphertext; // Return as is if empty or invalid
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, key);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted || ''; // Return empty string if decryption fails silently
  } catch (error) {
    console.error('Decryption failed:', error);
    return '';
  }
};
