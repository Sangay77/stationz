"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import type { Role, UserItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminUsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [role, setRole] = useState<Role>("CUSTOMER");

  const load = () => {
    if (!user) return;
    apiFetch<UserItem[]>("/admin/users", { token: user.token }).then(setUsers);
  };

  useEffect(load, [user]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
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
    setRole("CUSTOMER");
    load();
  }

  async function toggleActive(item: UserItem) {
    if (!user) return;
    await apiFetch(`/admin/users/${item.id}`, {
      method: "PUT",
      token: user.token,
      body: { active: !item.active },
    });
    load();
  }

  async function changeRole(item: UserItem, nextRole: Role) {
    if (!user) return;
    await apiFetch(`/admin/users/${item.id}`, {
      method: "PUT",
      token: user.token,
      body: { role: nextRole },
    });
    load();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl">Users & roles</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage ADMIN, STAFF, and CUSTOMER accounts.</p>
      </div>

      <form className="grid gap-3 rounded-xl border p-4 sm:grid-cols-2" onSubmit={onSubmit}>
        <div className="space-y-2">
          <Label>First name</Label>
          <Input name="firstName" required />
        </div>
        <div className="space-y-2">
          <Label>Last name</Label>
          <Input name="lastName" required />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input name="email" type="email" required />
        </div>
        <div className="space-y-2">
          <Label>Password</Label>
          <Input name="password" type="password" required minLength={6} />
        </div>
        <div className="space-y-2">
          <Label>Phone</Label>
          <Input name="phone" />
        </div>
        <div className="space-y-2">
          <Label>Role</Label>
          <Select value={role} onValueChange={(v) => setRole(v as Role)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ADMIN">ADMIN</SelectItem>
              <SelectItem value="STAFF">STAFF</SelectItem>
              <SelectItem value="CUSTOMER">CUSTOMER</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" className="sm:col-span-2 w-fit">Create user</Button>
      </form>

      <div className="space-y-3">
        {users.map((item) => (
          <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
            <div>
              <p className="font-medium">{item.firstName} {item.lastName}</p>
              <p className="text-xs text-muted-foreground">{item.email} · {item.role} · {item.active ? "Active" : "Disabled"}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={item.role} onValueChange={(v) => changeRole(item, v as Role)}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">ADMIN</SelectItem>
                  <SelectItem value="STAFF">STAFF</SelectItem>
                  <SelectItem value="CUSTOMER">CUSTOMER</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" onClick={() => toggleActive(item)}>
                {item.active ? "Disable" : "Enable"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
