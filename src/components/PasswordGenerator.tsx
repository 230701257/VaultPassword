'use client'

import { useState, useEffect, useCallback } from 'react';

interface PasswordGeneratorProps {
  onPasswordGenerate: (password: string) => void;
}

export const PasswordGenerator = ({ onPasswordGenerate }: PasswordGeneratorProps) => {
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(16);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [excludeLookAlikes, setExcludeLookAlikes] = useState(true);
  const [copied, setCopied] = useState(false);

  const generatePassword = useCallback(() => {
    let charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (excludeLookAlikes) charset = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
    if (includeNumbers) charset += excludeLookAlikes ? '23456789' : '0123456789';
    if (includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    let newPassword = '';
    for (let i = 0; i < length; i++) {
      newPassword += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setPassword(newPassword);
    onPasswordGenerate(newPassword);
  }, [length, includeNumbers, includeSymbols, excludeLookAlikes, onPasswordGenerate]);

  // Run once on mount to generate initial password
  useEffect(() => {
    generatePassword();
  }, []); // empty deps = only once

  const copyToClipboard = () => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 15000); // clears after 15 seconds
  };

  return (
    <div className="w-full p-6 rounded-2xl shadow-xl 
      bg-white border border-slate-200 
      dark:bg-slate-800 dark:border-slate-700 
      text-slate-900 dark:text-slate-100"
    >
      <h2 className="text-xl font-bold mb-4">Password Generator</h2>
      <div className="relative mb-4">
        <input 
          type="text" 
          value={password} 
          readOnly 
          className="w-full p-3 pr-36 font-mono text-lg 
            bg-slate-50 dark:bg-slate-700 
            text-slate-900 dark:text-slate-100 
            border border-slate-300 dark:border-slate-600 rounded-md" 
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
          <button 
            onClick={generatePassword} 
            className="px-3 py-1 rounded-md text-sm 
              bg-slate-200 dark:bg-slate-600 
              text-slate-900 dark:text-slate-100 
              hover:bg-slate-300 dark:hover:bg-slate-500"
          >
            Generate
          </button>
          <button 
            onClick={copyToClipboard} 
            className="px-3 py-1 rounded-md text-sm 
              bg-indigo-600 text-white hover:bg-indigo-700"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label htmlFor="length" className="text-sm text-slate-600 dark:text-slate-400">
            Length: {length}
          </label>
          <input 
            id="length" 
            type="range" 
            min="8" 
            max="32" 
            value={length} 
            onChange={(e) => setLength(Number(e.target.value))} 
            className="w-1/2 accent-indigo-600" 
          />
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" id="numbers" checked={includeNumbers} onChange={(e) => setIncludeNumbers(e.target.checked)} className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500" />
          <label htmlFor="numbers" className="text-sm text-slate-600 dark:text-slate-400">Numbers</label>
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" id="symbols" checked={includeSymbols} onChange={(e) => setIncludeSymbols(e.target.checked)} className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500" />
          <label htmlFor="symbols" className="text-sm text-slate-600 dark:text-slate-400">Symbols</label>
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" id="lookalikes" checked={excludeLookAlikes} onChange={(e) => setExcludeLookAlikes(e.target.checked)} className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500" />
          <label htmlFor="lookalikes" className="text-sm text-slate-600 dark:text-slate-400">Exclude Look-Alikes</label>
        </div>
      </div>
    </div>
  );
};
