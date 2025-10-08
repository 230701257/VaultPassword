import CryptoJS from 'crypto-js';

/**
 * Encrypts a piece of text with a given key.
 * @param {string} text The plaintext to encrypt.
 * @param {string} key The encryption key.
 * @returns {string} The encrypted ciphertext.
 */
export const encrypt = (text, key) => {
  if (typeof text !== 'string' || text === '') {
      return text;
  }
  return CryptoJS.AES.encrypt(text, key).toString();
};

/**
 * Decrypts a piece of ciphertext with a given key.
 * @param {string} ciphertext The encrypted text.
 * @param {string} key The encryption key.
 * @returns {string} The decrypted plaintext.
 */
export const decrypt = (ciphertext, key) => {
  if (typeof ciphertext !== 'string' || ciphertext === '') {
    return ciphertext;
  }
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, key);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    return originalText;
  } catch (e) {
    // If decryption fails (e.g., wrong key), return an empty string or the ciphertext
    console.error("Decryption failed:", e);
    return '';
  }
};