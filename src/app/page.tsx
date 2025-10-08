'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';
import { PasswordGenerator } from '@/components/PasswordGenerator';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { encrypt, decrypt } from '../../lib/crypto.js';
import { useTheme } from 'next-themes';

interface VaultItemType {
  _id: string;
  title: string;
  username: string;
  password?: string;
  url: string;
  notes: string;
}

interface EncryptedItem {
  title: string;
  username: string;
  password: string;
  url: string;
  notes: string;
}

const initialFormState = { title: '', username: '', password: '', url: '', notes: '' };

export default function DashboardPage() {
  const { theme } = useTheme();
  const [encryptionKey, setEncryptionKey] = useState<string | null>(null);
  const [vaultItems, setVaultItems] = useState<VaultItemType[]>([]);
  const [filteredItems, setFilteredItems] = useState<VaultItemType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState(initialFormState);
  const [viewItem, setViewItem] = useState<VaultItemType | null>(null);
  const [editItem, setEditItem] = useState<VaultItemType | null>(null);

  const handleGeneratePassword = (pwd: string) => {
    if (showAdd) setAddForm((s) => ({ ...s, password: pwd }));
    if (editItem) setEditItem((s) => (s ? { ...s, password: pwd } : null));
  };

  const fetchVaultItems = useCallback(async () => {
    if (!encryptionKey) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/vault');
      const data = await res.json();
      const decrypted = data.items.map((item: EncryptedItem & { _id: string }) => ({
        _id: item._id,
        title: decrypt(item.title, encryptionKey),
        username: decrypt(item.username, encryptionKey),
        password: decrypt(item.password, encryptionKey),
        url: decrypt(item.url, encryptionKey),
        notes: decrypt(item.notes, encryptionKey),
      }));
      setVaultItems(decrypted);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [encryptionKey]);

  useEffect(() => {
    const key = sessionStorage.getItem('encryption_key');
    if (key) setEncryptionKey(key);
    else {
      document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      window.location.href = '/login';
    }
  }, []);

  useEffect(() => {
    if (encryptionKey) fetchVaultItems();
  }, [encryptionKey, fetchVaultItems]);

  useEffect(() => {
    if (searchTerm.trim().length === 0) {
      setFilteredItems(vaultItems);
    } else {
      const lower = searchTerm.toLowerCase();
      setFilteredItems(
        vaultItems.filter(
          (item) =>
            item.title.toLowerCase().includes(lower) || item.username.toLowerCase().includes(lower)
        )
      );
    }
  }, [searchTerm, vaultItems]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure?')) return;
    await fetch(`/api/vault/${id}`, { method: 'DELETE' });
    fetchVaultItems();
  };

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (!encryptionKey) return;
    const encrypted = {
      title: encrypt(addForm.title, encryptionKey),
      username: encrypt(addForm.username, encryptionKey),
      password: encrypt(addForm.password, encryptionKey),
      url: encrypt(addForm.url, encryptionKey),
      notes: encrypt(addForm.notes, encryptionKey),
    };
    await fetch('/api/vault', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(encrypted),
    });
    setAddForm(initialFormState);
    setShowAdd(false);
    fetchVaultItems();
  };

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!encryptionKey || !editItem) return;
    const encrypted = {
      title: encrypt(editItem.title, encryptionKey),
      username: encrypt(editItem.username, encryptionKey),
      password: encrypt(editItem.password || '', encryptionKey),
      url: encrypt(editItem.url, encryptionKey),
      notes: encrypt(editItem.notes, encryptionKey),
    };
    await fetch(`/api/vault/${editItem._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(encrypted),
    });
    setEditItem(null);
    fetchVaultItems();
  };

  const closeModals = () => {
    setShowAdd(false);
    setViewItem(null);
    setEditItem(null);
  };

  if (!encryptionKey)
    return <div className="min-h-screen flex items-center justify-center">Unlocking vault...</div>;

  return (
    <div
      className={`min-h-screen p-4 sm:p-8 transition-colors duration-300 ${
        theme === 'dark' ? 'bg-slate-900 text-slate-100' : 'bg-gray-50 text-slate-900'
      }`}
    >
      <header
        className={`max-w-7xl mx-auto flex justify-between items-center mb-8 pb-4 border-b transition-colors duration-300 ${
          theme === 'dark' ? 'border-slate-700' : 'border-slate-200'
        }`}
      >
        <div>
          <h1 className="text-3xl font-bold">Secure Vault</h1>
          <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            Your personal, encrypted password manager.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <ThemeSwitcher />
          <button
            onClick={async () => {
              sessionStorage.removeItem('encryption_key');
              await fetch('/api/auth/logout');
              window.location.href = '/login';
            }}
            className="px-4 py-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600"
          >
            Log Out
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        <aside className="lg:col-span-1 space-y-8">
          <PasswordGenerator onPasswordGenerate={handleGeneratePassword} />
          <div
            className={`p-6 rounded-2xl shadow-xl transition-colors duration-300 ${
              theme === 'dark' ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'
            }`}
          >
            <h3 className="text-xl font-bold mb-4">Quick Search</h3>
            <input
              type="text"
              placeholder="Search by title or username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-300 ${
                theme === 'dark'
                  ? 'bg-slate-700 text-slate-100 border border-slate-600'
                  : 'bg-white text-slate-900 border border-slate-300'
              }`}
            />
          </div>
        </aside>

        <section className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">My Vault</h2>
            <button
              onClick={() => {
                setShowAdd(true);
                setAddForm(initialFormState);
              }}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
            >
              + Add Item
            </button>
          </div>

          <div className="space-y-3">
            {isLoading && <p className="text-center py-4">Loading your vault...</p>}
            {!isLoading && filteredItems.length === 0 && (
              <div
                className={`text-center py-10 px-6 rounded-lg transition-colors duration-300 ${
                  theme === 'dark'
                    ? 'bg-slate-800 border border-slate-700'
                    : 'bg-white border border-slate-200'
                }`}
              >
                <h3 className="text-lg font-medium">Vault is Empty</h3>
                <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  Add a new item to get started.
                </p>
              </div>
            )}
            {!isLoading &&
              filteredItems.map((item) => (
                <div
                  key={item._id}
                  className={`p-4 rounded-lg flex justify-between items-center hover:shadow-md transition-colors duration-300 ${
                    theme === 'dark'
                      ? 'bg-slate-800 border border-slate-700 hover:border-indigo-500'
                      : 'bg-white border border-slate-200 hover:border-indigo-500'
                  }`}
                >
                  <div>
                    <h3 className="font-semibold text-lg">{item.title}</h3>
                    <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{item.username}</p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setViewItem(item)}
                      className="font-medium text-indigo-500 hover:underline text-sm"
                    >
                      View
                    </button>
                    <button
                      onClick={() => setEditItem(item)}
                      className="font-medium text-amber-500 hover:underline text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="font-medium text-red-500 hover:underline text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
          </div>

          {showAdd && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
              <form
                onSubmit={handleAdd}
                className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 max-w-xl w-full shadow-xl space-y-6 overflow-y-auto max-h-[90vh]"
              >
                <h3 className="text-2xl font-semibold text-center mb-4 text-gray-800 dark:text-gray-100">Add New Vault Item</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                    <input
                      type="text"
                      placeholder="Title"
                      value={addForm.title}
                      onChange={(e) => setAddForm((s) => ({ ...s, title: e.target.value }))}
                      required
                      className="w-full px-4 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
                    <input
                      type="text"
                      placeholder="Username"
                      value={addForm.username}
                      onChange={(e) => setAddForm((s) => ({ ...s, username: e.target.value }))}
                      required
                      className="w-full px-4 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                  <input
                    type="text"
                    placeholder="Password"
                    value={addForm.password}
                    onChange={(e) => setAddForm((s) => ({ ...s, password: e.target.value }))}
                    required
                    className="w-full px-4 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4 text-gray-900 dark:text-gray-100"
                  />
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">URL</label>
                  <input
                    type="url"
                    placeholder="URL"
                    value={addForm.url}
                    onChange={(e) => setAddForm((s) => ({ ...s, url: e.target.value }))}
                    className="w-full px-4 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4 text-gray-900 dark:text-gray-100"
                  />
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
                  <textarea
                    rows={3}
                    placeholder="Notes"
                    value={addForm.notes}
                    onChange={(e) => setAddForm((s) => ({ ...s, notes: e.target.value }))}
                    className="w-full px-4 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div className="flex gap-4 justify-center mt-6">
                  <button type="submit" className="flex-1 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold">
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAdd(false)}
                    className="flex-1 py-2 px-4 bg-gray-300 hover:bg-gray-400 dark:bg-slate-700 dark:hover:bg-slate-600 text-black dark:text-white rounded-lg font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {viewItem && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-xl space-y-4 overflow-y-auto max-h-[90vh]">
                <h3 className="text-2xl font-semibold text-center mb-4 text-gray-800 dark:text-gray-100">View Vault Item</h3>
                {Object.entries(viewItem).map(([key, value]) => (
                  <div key={key} className="mb-2">
                    <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300 capitalize">{key}</label>
                    <p className="bg-gray-100 dark:bg-gray-700 p-2 rounded text-gray-900 dark:text-gray-100">{value || '-'}</p>
                  </div>
                ))}
                <div className="flex justify-center mt-4">
                  <button onClick={() => setViewItem(null)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg">
                    Back
                  </button>
                </div>
              </div>
            </div>
          )}

          {editItem && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
              <form
                onSubmit={handleUpdate}
                className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 w-full max-w-xl shadow-xl space-y-4 max-h-[90vh] overflow-y-auto"
              >
                <h3 className="text-2xl font-semibold text-center mb-4 text-gray-800 dark:text-gray-100">Edit Vault Item</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                    <input
                      type="text"
                      value={editItem.title}
                      onChange={(e) => setEditItem({ ...editItem, title: e.target.value })}
                      required
                      className="w-full px-4 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
                    <input
                      type="text"
                      value={editItem.username}
                      onChange={(e) => setEditItem({ ...editItem, username: e.target.value })}
                      required
                      className="w-full px-4 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                  <input
                    type="text"
                    value={editItem.password}
                    onChange={(e) => setEditItem({ ...editItem, password: e.target.value })}
                    required
                    className="w-full px-4 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4 text-gray-900 dark:text-gray-100"
                  />
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">URL</label>
                  <input
                    type="url"
                    value={editItem.url}
                    onChange={(e) => setEditItem({ ...editItem, url: e.target.value })}
                    className="w-full px-4 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4 text-gray-900 dark:text-gray-100"
                  />
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
                  <textarea
                    rows={3}
                    value={editItem.notes}
                    onChange={(e) => setEditItem({ ...editItem, notes: e.target.value })}
                    className="w-full px-4 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div className="flex justify-center gap-4 mt-4">
                  <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg">
                    Update
                  </button>
                  <button type="button" onClick={closeModals} className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded-lg">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
