"use client";

import { FormEvent, useEffect, useState } from "react";
import { AdminFeedback, useAdminStatus } from "@/components/admin/feedback";
import { apiFetch } from "@/lib/api";
import { getErrorMessage } from "@/lib/admin-form";
import { useAuth } from "@/context/auth-context";
import type { Role, UserItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type EditDraft = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: Role;
};

function emptyDraft(item?: UserItem): EditDraft {
  return {
    email: item?.email || "",
    password: "",
    firstName: item?.firstName || "",
    lastName: item?.lastName || "",
    phone: item?.phone || "",
    role: item?.role || "STAFF",
  };
}

export default function AdminUsersPage() {
  const { user, isAdmin } = useAuth();
  const status = useAdminStatus();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [role, setRole] = useState<Role>("STAFF");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<EditDraft>(emptyDraft());
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const load = async () => {
    if (!user || !isAdmin) return;
    try {
      const data = await apiFetch<UserItem[]>("/admin/users", { token: user.token });
      setUsers(data);
    } catch (error) {
      status.error(getErrorMessage(error, "We couldn’t load the user list. Please refresh and try again."));
    }
  };

  useEffect(() => {
    load();
  }, [user, isAdmin]);

  async function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user || !isAdmin) return;
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    setSaving(true);
    try {
      await apiFetch("/admin/users", {
        method: "POST",
        token: user.token,
        body: {
          email: form.get("email"),
          password: form.get("password"),
          firstName: form.get("firstName"),
          lastName: form.get("lastName"),
          phone: form.get("phone"),
          role,
        },
      });
      formEl.reset();
      setRole("STAFF");
      status.success("User created successfully.");
      await load();
    } catch (error) {
      status.error(getErrorMessage(error, "We couldn’t create that user. Please check the form and try again."));
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(item: UserItem) {
    if (!user || !isAdmin) return;
    if (user.id === item.id && item.active) {
      status.error("You can’t disable your own account while signed in.");
      return;
    }
    setUpdatingId(item.id);
    try {
      await apiFetch(`/admin/users/${item.id}`, {
        method: "PUT",
        token: user.token,
        body: { active: !item.active },
      });
      status.success(item.active ? "User disabled." : "User enabled.");
      await load();
    } catch (error) {
      status.error(getErrorMessage(error, "We couldn’t update that user. Please try again."));
    } finally {
      setUpdatingId(null);
    }
  }

  async function saveEdit(item: UserItem) {
    if (!user || !isAdmin) return;
    const email = draft.email.trim();
    if (!email) {
      status.error("Please enter a login email (username).");
      return;
    }
    if (draft.password && draft.password.length < 8) {
      status.error("Password must be at least 8 characters.");
      return;
    }
    setUpdatingId(item.id);
    try {
      await apiFetch(`/admin/users/${item.id}`, {
        method: "PUT",
        token: user.token,
        body: {
          email,
          firstName: draft.firstName.trim() || item.firstName,
          lastName: draft.lastName.trim() || item.lastName,
          phone: draft.phone.trim(),
          role: draft.role,
          password: draft.password.trim() || undefined,
        },
      });
      status.success(`Updated ${draft.firstName || item.firstName}.`);
      setEditingId(null);
      setDraft(emptyDraft());
      await load();
    } catch (error) {
      status.error(getErrorMessage(error, "We couldn’t update that user. Please try again."));
    } finally {
      setUpdatingId(null);
    }
  }

  async function deleteUser(item: UserItem) {
    if (!user || !isAdmin) return;
    if (user.id === item.id) {
      status.error("You can’t delete your own account while signed in.");
      return;
    }
    if (!window.confirm(`Delete “${item.firstName} ${item.lastName}” (${item.email})? This cannot be undone.`)) {
      return;
    }
    setDeletingId(item.id);
    try {
      await apiFetch(`/admin/users/${item.id}`, {
        method: "DELETE",
        token: user.token,
      });
      status.success("User deleted.");
      await load();
    } catch (error) {
      status.error(getErrorMessage(error, "We couldn’t delete that user. Please try again."));
    } finally {
      setDeletingId(null);
    }
  }

  async function changeOwnPassword(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (newPassword.length < 8) {
      status.error("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      status.error("New password and confirmation do not match.");
      return;
    }
    setChangingPassword(true);
    try {
      await apiFetch("/auth/password", {
        method: "PUT",
        token: user.token,
        body: {
          currentPassword,
          newPassword,
        },
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      status.success("Your password was updated.");
    } catch (error) {
      status.error(getErrorMessage(error, "We couldn’t update your password. Please try again."));
    } finally {
      setChangingPassword(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl">{isAdmin ? "Users & roles" : "My password"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isAdmin
            ? "Only admins can create, delete, enable/disable users, and update login email or passwords for others."
            : "You can change your own password here. Ask an admin for other account changes."}
        </p>
      </div>

      <AdminFeedback feedback={status.feedback} onDismiss={status.clear} />

      <section className="space-y-4 rounded-xl border p-4 sm:p-5">
        <div>
          <h2 className="font-display text-xl text-ink">Change my password</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Signed in as {user?.email}. Enter your current password, then choose a new one.
          </p>
        </div>
        <form className="grid max-w-xl gap-3 sm:grid-cols-2" onSubmit={changeOwnPassword}>
          <div className="space-y-2 sm:col-span-2">
            <Label>Current password</Label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <div className="space-y-2">
            <Label>New password</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-2">
            <Label>Confirm new password</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <Button type="submit" className="w-fit sm:col-span-2" disabled={changingPassword}>
            {changingPassword ? "Updating…" : "Update password"}
          </Button>
        </form>
      </section>

      {isAdmin && (
        <>
          <section className="space-y-4">
            <div>
              <h2 className="font-display text-xl text-ink">Create user</h2>
              <p className="mt-1 text-sm text-muted-foreground">Admins can create ADMIN, STAFF, or CUSTOMER accounts.</p>
            </div>
            <form className="grid gap-3 rounded-xl border p-4 sm:grid-cols-2" onSubmit={onCreate}>
              <div className="space-y-2">
                <Label>First name</Label>
                <Input name="firstName" required />
              </div>
              <div className="space-y-2">
                <Label>Last name</Label>
                <Input name="lastName" required />
              </div>
              <div className="space-y-2">
                <Label>Login email (username)</Label>
                <Input name="email" type="email" required />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input name="password" type="password" required minLength={8} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input name="phone" />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">ADMIN</SelectItem>
                    <SelectItem value="STAFF">STAFF</SelectItem>
                    <SelectItem value="CUSTOMER">CUSTOMER</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-fit sm:col-span-2" disabled={saving}>
                {saving ? "Creating…" : "Create user"}
              </Button>
            </form>
          </section>

          <section className="space-y-3">
            <div>
              <h2 className="font-display text-xl text-ink">All users</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Edit login email, reset password, change role, enable/disable, or delete.
              </p>
            </div>
            {users.map((item) => {
              const editing = editingId === item.id;
              const busy = updatingId === item.id || deletingId === item.id;
              return (
                <div key={item.id} className="rounded-xl border p-4 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">
                        {item.firstName} {item.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.email} · {item.role} · {item.active ? "Active" : "Disabled"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() => {
                          if (editing) {
                            setEditingId(null);
                            setDraft(emptyDraft());
                          } else {
                            setEditingId(item.id);
                            setDraft(emptyDraft(item));
                          }
                        }}
                      >
                        {editing ? "Cancel" : "Edit"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy || user?.id === item.id}
                        onClick={() => toggleActive(item)}
                      >
                        {item.active ? "Disable" : "Enable"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy || user?.id === item.id}
                        onClick={() => deleteUser(item)}
                      >
                        {deletingId === item.id ? "Deleting…" : "Delete"}
                      </Button>
                    </div>
                  </div>

                  {editing && (
                    <div className="grid gap-3 rounded-lg bg-mist/50 p-3 sm:grid-cols-2">
                      <div className="space-y-2 sm:col-span-2">
                        <Label>Login email (username)</Label>
                        <Input
                          type="email"
                          value={draft.email}
                          onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>First name</Label>
                        <Input
                          value={draft.firstName}
                          onChange={(e) => setDraft({ ...draft, firstName: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Last name</Label>
                        <Input
                          value={draft.lastName}
                          onChange={(e) => setDraft({ ...draft, lastName: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Phone</Label>
                        <Input
                          value={draft.phone}
                          onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Role</Label>
                        <Select
                          value={draft.role}
                          onValueChange={(v) => setDraft({ ...draft, role: v as Role })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ADMIN">ADMIN</SelectItem>
                            <SelectItem value="STAFF">STAFF</SelectItem>
                            <SelectItem value="CUSTOMER">CUSTOMER</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label>New password (optional)</Label>
                        <Input
                          type="password"
                          value={draft.password}
                          onChange={(e) => setDraft({ ...draft, password: e.target.value })}
                          placeholder="Leave blank to keep the current password"
                          minLength={8}
                          autoComplete="new-password"
                        />
                      </div>
                      <Button
                        type="button"
                        className="w-fit"
                        disabled={busy}
                        onClick={() => saveEdit(item)}
                      >
                        {updatingId === item.id ? "Saving…" : "Save changes"}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
            {users.length === 0 && (
              <p className="rounded-xl border border-dashed px-4 py-8 text-sm text-muted-foreground">
                No users found.
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
