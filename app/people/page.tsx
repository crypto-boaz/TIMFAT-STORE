"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Badge, Button, DataTable, PageHeader, Panel, StatCard } from "@/components/ui";
import { Notice, type NoticeState } from "@/components/notice";
import { CheckCircle2, Edit3, Mail, Phone, Plus, Save, Search, ShieldCheck, Trash2, UserPlus, X } from "lucide-react";

const API_URL = process.env.NODE_ENV === "production"
  ? "/api/backend"
  : process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

type PeopleRole = "ADMIN" | "MANAGER" | "CASHIER" | "SALES_STAFF" | "INVENTORY_STAFF" | "STAFF" | "ACCOUNTANT" | "WAREHOUSE";
type PeopleStatus = "ACTIVE" | "INACTIVE";

type PeopleUser = {
  id: string;
  username: string;
  name: string;
  firstName: string;
  lastName: string;
  gender: string;
  companyName: string;
  phone: string;
  email: string;
  role: PeopleRole | "OWNER";
  status: PeopleStatus;
  active: boolean;
  createdAt: string;
};

type PeopleForm = {
  id?: string;
  firstName: string;
  lastName: string;
  gender: string;
  companyName: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: PeopleRole;
  status: PeopleStatus;
};

const roleOptions: Array<{ value: PeopleRole; label: string }> = [
  { value: "ADMIN", label: "Admin" },
  { value: "MANAGER", label: "Manager" },
  { value: "CASHIER", label: "Cashier" },
  { value: "SALES_STAFF", label: "Sales Staff" },
  { value: "INVENTORY_STAFF", label: "Inventory Staff" },
  { value: "STAFF", label: "Staff" },
  { value: "ACCOUNTANT", label: "Accountant" },
  { value: "WAREHOUSE", label: "Warehouse" }
];

const genderOptions = ["Female", "Male", "Prefer not to say"];

function emptyForm(): PeopleForm {
  return {
    firstName: "",
    lastName: "",
    gender: "",
    companyName: "King's Store",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "STAFF",
    status: "ACTIVE"
  };
}

function authHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = window.localStorage.getItem("paytrack_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function roleLabel(role: string) {
  return role.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

async function apiRequest(path: string, init?: RequestInit) {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...(init?.headers ?? {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message ?? "Request failed.");
  return data;
}

export default function PeoplePage() {
  const [users, setUsers] = useState<PeopleUser[]>([]);
  const [form, setForm] = useState<PeopleForm>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState<NoticeState>(null);

  const filteredUsers = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return users;
    return users.filter((user) =>
      [user.name, user.email, user.phone, user.role, user.companyName]
        .some((field) => String(field || "").toLowerCase().includes(value))
    );
  }, [search, users]);

  const activeUsers = users.filter((user) => user.active).length;
  const adminUsers = users.filter((user) => user.role === "OWNER" || user.role === "ADMIN").length;

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await apiRequest("/users");
      setUsers(data.users ?? []);
    } catch (error) {
      setNotice({ type: "error", message: error instanceof Error ? error.message : "Unable to load users." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const openCreateForm = () => {
    setForm(emptyForm());
    setShowForm(true);
    setNotice(null);
  };

  const openEditForm = (user: PeopleUser) => {
    const [firstFallback, ...rest] = user.name.split(" ");
    setForm({
      id: user.id,
      firstName: user.firstName || firstFallback || "",
      lastName: user.lastName || rest.join(" ") || "",
      gender: user.gender || "",
      companyName: user.companyName || "King's Store",
      phone: user.phone || "",
      email: user.email,
      password: "",
      confirmPassword: "",
      role: user.role === "OWNER" ? "ADMIN" : user.role,
      status: user.active ? "ACTIVE" : "INACTIVE"
    });
    setShowForm(true);
    setNotice(null);
  };

  const saveUser = async () => {
    setSaving(true);
    setNotice(null);
    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        gender: form.gender,
        companyName: form.companyName,
        phone: form.phone,
        email: form.email,
        password: form.password,
        confirmPassword: form.confirmPassword,
        role: form.role,
        status: form.status
      };
      const data = form.id
        ? await apiRequest(`/users/${form.id}`, { method: "PUT", body: JSON.stringify(payload) })
        : await apiRequest("/users", { method: "POST", body: JSON.stringify(payload) });
      setNotice({ type: "success", message: `${data.user.name} was ${form.id ? "updated" : "added"} successfully.` });
      setForm(emptyForm());
      setShowForm(false);
      await loadUsers();
    } catch (error) {
      setNotice({ type: "error", message: error instanceof Error ? error.message : "Unable to save user." });
    } finally {
      setSaving(false);
    }
  };

  const removeUser = async (user: PeopleUser) => {
    if (!window.confirm(`Remove ${user.name || user.email} from People?`)) return;
    setNotice(null);
    try {
      await apiRequest(`/users/${user.id}`, { method: "DELETE" });
      setNotice({ type: "success", message: `${user.name || user.email} was removed.` });
      await loadUsers();
    } catch (error) {
      setNotice({ type: "error", message: error instanceof Error ? error.message : "Unable to remove user." });
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="People"
        description="Add team members, assign roles, update account status, and manage who can access this store."
        action={<Button onClick={openCreateForm}><UserPlus size={16} /> Add User</Button>}
      />
      <Notice notice={notice} />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Users" value={String(users.length)} />
        <StatCard label="Active Users" value={String(activeUsers)} tone="success" />
        <StatCard label="Admin Access" value={String(adminUsers)} tone="warning" />
      </div>

      {showForm && (
        <Panel title={form.id ? "Edit User" : "Add User"} className="mt-6">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <label className="text-sm font-bold">First Name<input className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 dark:border-slate-700 dark:bg-slate-950" value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} /></label>
            <label className="text-sm font-bold">Last Name<input className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 dark:border-slate-700 dark:bg-slate-950" value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} /></label>
            <label className="text-sm font-bold">Gender<select className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 dark:border-slate-700 dark:bg-slate-950" value={form.gender} onChange={(event) => setForm({ ...form, gender: event.target.value })}><option value="">Select gender</option>{genderOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="text-sm font-bold">Company Name<input className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 dark:border-slate-700 dark:bg-slate-950" value={form.companyName} onChange={(event) => setForm({ ...form, companyName: event.target.value })} /></label>
            <label className="text-sm font-bold">Phone Number<input className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 dark:border-slate-700 dark:bg-slate-950" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label>
            <label className="text-sm font-bold">Email<input type="email" className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 dark:border-slate-700 dark:bg-slate-950" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
            <label className="text-sm font-bold">Role<select className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 dark:border-slate-700 dark:bg-slate-950" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as PeopleRole })}>{roleOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
            <label className="text-sm font-bold">Status<select className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 dark:border-slate-700 dark:bg-slate-950" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as PeopleStatus })}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></label>
            <label className="text-sm font-bold">Password<input type="password" className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 dark:border-slate-700 dark:bg-slate-950" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder={form.id ? "Leave blank to keep current" : ""} /></label>
            <label className="text-sm font-bold">Confirm Password<input type="password" className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 dark:border-slate-700 dark:bg-slate-950" value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} placeholder={form.id ? "Leave blank to keep current" : ""} /></label>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={saveUser} disabled={saving}><Save size={16} /> {saving ? "Saving..." : form.id ? "Update User" : "Add User"}</Button>
            <Button className="bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-700" onClick={() => setShowForm(false)}><X size={16} /> Cancel</Button>
          </div>
        </Panel>
      )}

      <Panel title="Team Members" className="mt-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              className="h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search people..."
            />
          </div>
          <span className="text-xs font-bold uppercase tracking-normal text-slate-500">{loading ? "Loading..." : `${filteredUsers.length} shown`}</span>
        </div>
        <DataTable
          headers={["User", "Contact", "Company", "Role", "Status", "Actions"]}
          rows={filteredUsers.map((user) => [
            <div key={`${user.id}-name`}>
              <p className="font-black text-slate-900 dark:text-white">{user.name || `${user.firstName} ${user.lastName}`}</p>
              <p className="text-xs font-semibold text-slate-500">@{user.username}</p>
            </div>,
            <div key={`${user.id}-contact`} className="space-y-1">
              <p className="inline-flex items-center gap-2"><Mail size={14} /> {user.email}</p>
              <p className="inline-flex items-center gap-2 text-xs text-slate-500"><Phone size={14} /> {user.phone || "No phone"}</p>
            </div>,
            user.companyName || "King's Store",
            <Badge key={`${user.id}-role`} tone={user.role === "OWNER" || user.role === "ADMIN" ? "warning" : "default"}><ShieldCheck size={12} /> {roleLabel(user.role)}</Badge>,
            <Badge key={`${user.id}-status`} tone={user.active ? "success" : "danger"}><CheckCircle2 size={12} /> {user.active ? "Active" : "Inactive"}</Badge>,
            <div key={`${user.id}-actions`} className="flex flex-wrap gap-2">
              <Button className="h-8 bg-slate-900 px-3 dark:bg-slate-700" onClick={() => openEditForm(user)}><Edit3 size={15} /> Edit</Button>
              {user.role !== "OWNER" && (
                <Button className="h-8 bg-red-600 px-3 hover:bg-red-700" onClick={() => removeUser(user)}><Trash2 size={15} /> Remove</Button>
              )}
            </div>
          ])}
        />
      </Panel>
    </AppShell>
  );
}
