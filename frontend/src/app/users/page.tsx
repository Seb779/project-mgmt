"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Plus, Pencil, Trash2, X, Check, Shield, Eye } from "lucide-react";
import { usersApi, User, UserCreate, UserRole } from "@/lib/api";

const ROLE_CONFIG: Record<UserRole, { label: string; color: string; icon: React.ReactNode }> = {
  admin: { label: "Admin", color: "bg-red-100 text-red-700", icon: <Shield size={11} /> },
  director: { label: "Directeur", color: "bg-purple-100 text-purple-700", icon: <Shield size={11} /> },
  project_manager: { label: "Chef de projet", color: "bg-blue-100 text-blue-700", icon: <Users size={11} /> },
  viewer: { label: "Observateur", color: "bg-gray-100 text-gray-600", icon: <Eye size={11} /> },
};

const EMPTY_FORM: UserCreate = {
  email: "",
  full_name: "",
  role: "project_manager",
  is_active: true,
  password: "",
};

function RoleBadge({ role }: { role: UserRole }) {
  const cfg = ROLE_CONFIG[role];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${cfg.color}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function UserModal({
  user,
  onClose,
}: {
  user: User | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState<UserCreate>(
    user
      ? { email: user.email, full_name: user.full_name, role: user.role, is_active: user.is_active, password: "" }
      : EMPTY_FORM
  );
  const [error, setError] = useState("");

  const createMutation = useMutation({
    mutationFn: (data: UserCreate) => usersApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); onClose(); },
    onError: (e: Error) => setError(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<UserCreate>) => usersApi.update(user!.id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); onClose(); },
    onError: (e: Error) => setError(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (user) {
      const updates: Partial<UserCreate> = {};
      if (form.full_name !== user.full_name) updates.full_name = form.full_name;
      if (form.role !== user.role) updates.role = form.role;
      if (form.is_active !== user.is_active) updates.is_active = form.is_active;
      if (form.password) updates.password = form.password;
      updateMutation.mutate(updates);
    } else {
      if (!form.email || !form.full_name || !form.password) {
        setError("Email, nom et mot de passe sont requis");
        return;
      }
      createMutation.mutate(form);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-bold text-gray-900">
            {user ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Email *</label>
            <input
              type="email"
              disabled={!!user}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Nom complet *</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Rôle</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
            >
              {Object.entries(ROLE_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">
              {user ? "Nouveau mot de passe (laisser vide = inchangé)" : "Mot de passe *"}
            </label>
            <input
              type="password"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="is_active"
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="rounded border-gray-300"
            />
            <label htmlFor="is_active" className="text-sm text-gray-700">Compte actif</label>
          </div>

          {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg p-2">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
              Annuler
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {isPending ? "Enregistrement…" : user ? "Enregistrer" : "Créer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => usersApi.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => usersApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      setDeleteConfirm(null);
    },
  });

  const openCreate = () => { setEditUser(null); setShowModal(true); };
  const openEdit = (u: User) => { setEditUser(u); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditUser(null); };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-white flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Users size={18} className="text-blue-600" />
            <h1 className="text-lg font-bold text-gray-900">Utilisateurs</h1>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Gestion des accès et des rôles HERMES Portal
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={15} />
          Nouvel utilisateur
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto p-6">
        {isLoading && (
          <div className="text-center text-sm text-gray-400 py-12">Chargement…</div>
        )}

        {!isLoading && users.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Users size={40} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">Aucun utilisateur</p>
            <p className="text-xs mt-1">Créez le premier compte pour commencer</p>
          </div>
        )}

        {users.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nom</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Rôle</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Statut</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Créé le</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                          {u.full_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900">{u.full_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{u.email}</td>
                    <td className="px-4 py-3">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-4 py-3">
                      {u.is_active ? (
                        <span className="inline-flex items-center gap-1 text-green-700 text-xs">
                          <Check size={11} /> Actif
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">Inactif</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {new Date(u.created_at).toLocaleDateString("fr-CH")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => openEdit(u)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Pencil size={13} />
                        </button>
                        {deleteConfirm === u.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => deleteMutation.mutate(u.id)}
                              disabled={deleteMutation.isPending}
                              className="text-[11px] bg-red-600 text-white px-2 py-1 rounded font-medium"
                            >
                              Confirmer
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="text-[11px] text-gray-500 px-1 py-1"
                            >
                              Annuler
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(u.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Stats rôles */}
        {users.length > 0 && (
          <div className="flex gap-3 mt-4">
            {(Object.keys(ROLE_CONFIG) as UserRole[]).map((role) => {
              const count = users.filter((u) => u.role === role).length;
              if (count === 0) return null;
              return (
                <div key={role} className="text-xs text-gray-500 bg-white border border-gray-200 rounded-lg px-3 py-1.5 flex items-center gap-1.5">
                  <RoleBadge role={role} />
                  <span className="font-semibold text-gray-700">{count}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <UserModal user={editUser} onClose={closeModal} />
      )}
    </div>
  );
}
