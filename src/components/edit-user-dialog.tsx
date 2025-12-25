"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  centerId: string | null;
  image?: string | null;
  description?: string | null;
}

interface EditUserDialogProps {
  user: User;
  trigger?: React.ReactNode;
}

export function EditUserDialog({ user, trigger }: EditUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState(user.role);
  const [centerId, setCenterId] = useState(user.centerId || "");
  const [description, setDescription] = useState(user.description || "");
  const [error, setError] = useState("");

  const utils = trpc.useUtils();
  const { data: centers } = trpc.ecmoCenter.getAll.useQuery();

  // Reset form when user changes or dialog opens
  useEffect(() => {
    if (open) {
      setName(user.name);
      setEmail(user.email);
      setRole(user.role);
      setCenterId(user.centerId || "");
      setDescription(user.description || "");
      setError("");
    }
  }, [open, user]);

  const updateUser = trpc.user.update.useMutation({
    onSuccess: () => {
      utils.user.getAll.invalidate();
      utils.ecmoCenter.getAll.invalidate();
      setOpen(false);
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    updateUser.mutate({
      id: user.id,
      name,
      email,
      role,
      centerId: centerId || undefined,
      description: description || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline" size="sm">Edit</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user information
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-user-name">Name</Label>
              <Input
                id="edit-user-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-user-email">Email</Label>
              <Input
                id="edit-user-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-user-role">Role</Label>
              <select
                id="edit-user-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                required
              >
                <option value="staff">Staff</option>
                <option value="director">Director</option>
                <option value="coordinator">Coordinator</option>
                <option value="physician">Physician</option>
                <option value="surgeon">Surgeon</option>
                <option value="admin">Admin</option>
                <option value="user">User</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-user-description">Description</Label>
              <Input
                id="edit-user-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Job title or description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-user-center">Center</Label>
              <select
                id="edit-user-center"
                value={centerId}
                onChange={(e) => setCenterId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">No center assigned</option>
                {centers?.map((center) => (
                  <option key={center.id} value={center.id}>
                    {center.name}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
                {error}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateUser.isPending}>
              {updateUser.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
