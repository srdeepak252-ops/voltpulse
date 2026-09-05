import React, { useState } from 'react';
import { Users, X, Search, Edit3, Check, ShieldCheck, User, PlusCircle, AlertCircle, Sparkles } from 'lucide-react';
import { AppUser } from '../types';

interface UserManagementModalProps {
  users: AppUser[];
  onClose: () => void;
  onUpdateUser: (updatedUser: AppUser) => void;
  onAddUser: (newUser: AppUser) => void;
}

export function UserManagementModal({
  users,
  onClose,
  onUpdateUser,
  onAddUser,
}: UserManagementModalProps) {
  const [search, setSearch] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUsernameVal, setEditUsernameVal] = useState('');
  const [editFullNameVal, setEditFullNameVal] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // New user creation state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newRole, setNewRole] = useState<'user' | 'admin'>('user');
  const [newEmail, setNewEmail] = useState('');
  const [newMeter, setNewMeter] = useState('');

  const filteredUsers = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      (u.meterNumber && u.meterNumber.toLowerCase().includes(search.toLowerCase())) ||
      (u.badgeTitle && u.badgeTitle.toLowerCase().includes(search.toLowerCase()))
  );

  const startEdit = (user: AppUser) => {
    setEditingUserId(user.id);
    setEditUsernameVal(user.username);
    setEditFullNameVal(user.fullName);
    setErrorMsg(null);
  };

  const handleSaveEdit = (user: AppUser) => {
    const cleanUsername = editUsernameVal.trim().replace(/^@/, '').toLowerCase();
    if (!cleanUsername) {
      setErrorMsg('Username cannot be empty.');
      return;
    }
    if (!/^[a-z0-9_.-]+$/i.test(cleanUsername)) {
      setErrorMsg('Username can only contain alphanumeric characters, underscores, and dashes.');
      return;
    }

    // Check conflict
    const existing = users.find((u) => u.id !== user.id && u.username.toLowerCase() === cleanUsername);
    if (existing) {
      setErrorMsg(`Username @${cleanUsername} is already taken by ${existing.fullName}.`);
      return;
    }

    onUpdateUser({
      ...user,
      username: cleanUsername,
      fullName: editFullNameVal.trim() || user.fullName,
    });
    setEditingUserId(null);
  };

  const handleCreateNewUser = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newUsername.trim().replace(/^@/, '').toLowerCase();
    if (!clean || !newFullName.trim()) {
      setErrorMsg('Full name and username are required.');
      return;
    }
    const existing = users.find((u) => u.username.toLowerCase() === clean);
    if (existing) {
      setErrorMsg(`Username @${clean} is already in use.`);
      return;
    }

    const created: AppUser = {
      id: `usr-${Date.now()}`,
      username: clean,
      fullName: newFullName.trim(),
      role: newRole,
      email: newEmail.trim() || `${clean}@gridpulse.local`,
      meterNumber: newRole === 'user' ? newMeter.trim() || `MTR-${Math.floor(100000 + Math.random() * 900000)}` : undefined,
      badgeTitle: newRole === 'admin' ? 'Grid Operations Officer' : 'Verified Resident Citizen',
      phone: '(555) 019-9941',
      assignedIssuesCount: 0,
    };

    onAddUser(created);
    setShowAddForm(false);
    setNewUsername('');
    setNewFullName('');
    setNewEmail('');
    setNewMeter('');
    setErrorMsg(null);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#0B111E] border border-slate-800 rounded-3xl max-w-3xl w-full p-6 sm:p-7 shadow-2xl relative my-auto max-h-[90vh] flex flex-col">
        {/* CLOSE BUTTON */}
        <button
          id="close-user-mgmt-btn"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* HEADER */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0 pr-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight">
                User Directory & Reporter Accounts
              </h2>
              <p className="text-xs text-slate-400">
                Admin Directory • Assign and modify citizen & dispatcher usernames
              </p>
            </div>
          </div>
          <button
            id="btn-toggle-add-user"
            onClick={() => {
              setShowAddForm(!showAddForm);
              setErrorMsg(null);
            }}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>{showAddForm ? 'Cancel New' : 'Register User'}</span>
          </button>
        </div>

        {errorMsg && (
          <div className="mt-3 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* REGISTER NEW USER FORM ACCORDION */}
        {showAddForm && (
          <form
            onSubmit={handleCreateNewUser}
            className="mt-4 p-4 bg-slate-950 border border-cyan-500/40 rounded-2xl space-y-3 shrink-0"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Register New Account
              </span>
              <div className="flex gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setNewRole('user')}
                  className={`px-2.5 py-1 rounded-lg font-bold ${
                    newRole === 'user' ? 'bg-cyan-600 text-white' : 'text-slate-400 bg-slate-900'
                  }`}
                >
                  Citizen User
                </button>
                <button
                  type="button"
                  onClick={() => setNewRole('admin')}
                  className={`px-2.5 py-1 rounded-lg font-bold ${
                    newRole === 'admin' ? 'bg-amber-600 text-white' : 'text-slate-400 bg-slate-900'
                  }`}
                >
                  Utility Admin
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jordan Miller"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">Assigned Username</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-2.5 flex items-center text-slate-500 text-xs">@</span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. jordan_m"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value.replace(/^@/, ''))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-6 pr-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>

            {newRole === 'user' && (
              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">Meter Number (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. MTR-404812"
                  value={newMeter}
                  onChange={(e) => setNewMeter(e.target.value.toUpperCase())}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold"
              >
                Create Account
              </button>
            </div>
          </form>
        )}

        {/* SEARCH BAR */}
        <div className="mt-4 shrink-0 relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search by name, username (@...), meter number, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 transition"
          />
        </div>

        {/* USERS LIST TABLE */}
        <div className="mt-4 flex-1 overflow-y-auto space-y-2 pr-1">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              No matching users found in directory.
            </div>
          ) : (
            filteredUsers.map((u) => {
              const isEditing = editingUserId === u.id;
              const isAdmin = u.role === 'admin';

              return (
                <div
                  key={u.id}
                  id={`user-row-${u.username}`}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isEditing
                      ? 'bg-slate-900/90 border-amber-500/80 shadow-lg shadow-amber-950/30'
                      : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                          Assign Different Username to {u.fullName}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">ID: {u.id}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="text-[10px] text-slate-400 font-bold block mb-1">Full Name</label>
                          <input
                            type="text"
                            value={editFullNameVal}
                            onChange={(e) => setEditFullNameVal(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 font-bold block mb-1">New Username</label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-2.5 flex items-center text-slate-500 text-xs font-mono">
                              @
                            </span>
                            <input
                              type="text"
                              value={editUsernameVal}
                              onChange={(e) => setEditUsernameVal(e.target.value.replace(/^@/, ''))}
                              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-6 pr-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditingUserId(null)}
                          className="px-3 py-1 rounded-lg text-xs text-slate-400 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(u)}
                          className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1 shadow-sm cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" /> Save Username
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold font-mono text-white shrink-0 ${
                            isAdmin ? 'bg-amber-900/40 text-amber-300 border border-amber-800/50' : 'bg-cyan-900/40 text-cyan-300 border border-cyan-800/50'
                          }`}
                        >
                          {isAdmin ? <ShieldCheck className="w-4 h-4" /> : <User className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-white">{u.fullName}</span>
                            <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-900/50">
                              @{u.username}
                            </span>
                            <span
                              className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded ${
                                isAdmin
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'bg-slate-800 text-slate-300 border border-slate-700'
                              }`}
                            >
                              {u.role}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5 flex-wrap">
                            <span>{u.badgeTitle}</span>
                            {u.meterNumber && (
                              <>
                                <span>•</span>
                                <span className="font-mono text-slate-300">{u.meterNumber}</span>
                              </>
                            )}
                            {u.phone && (
                              <>
                                <span>•</span>
                                <span className="text-slate-500">{u.phone}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2">
                        <button
                          id={`btn-edit-username-${u.username}`}
                          onClick={() => startEdit(u)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 text-xs font-semibold transition cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3 text-amber-400" />
                          <span>Assign Username</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* FOOTER STATS */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
          <span>
            Total Registered: {users.length} ({users.filter((u) => u.role === 'admin').length} Admins,{' '}
            {users.filter((u) => u.role === 'user').length} Citizens)
          </span>
          <span className="font-mono text-cyan-500">Live Grid Identity Sync</span>
        </div>
      </div>
    </div>
  );
}
