"use client";

import { useState } from "react";
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

interface CreateUserDialogProps {
  buttonText?: string;
}

export function CreateUserDialog({ buttonText = "Add New User" }: CreateUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("staff");
  const [centerId, setCenterId] = useState("");
  const [error, setError] = useState("");

  const utils = trpc.useUtils();
  const { data: centers } = trpc.ecmoCenter.getAll.useQuery({});

  const createUser = trpc.user.create.useMutation({
    onSuccess: () => {
      utils.user.getAll.invalidate();
      setOpen(false);
      resetForm();
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const resetForm = () => {
    setName("");
    setEmail("");
    setRole("staff");
    setCenterId("");
    setError("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    createUser.mutate({
      name,
      email,
      role,
      centerId: centerId || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">{buttonText}</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create User</DialogTitle>
          <DialogDescription>
            Add a new user to the system
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="user-name">Name</Label>
              <Input
                id="user-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-email">Email</Label>
              <Input
                id="user-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-role">Role</Label>
              <select
                id="user-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                required
              >
                <option value="staff">Staff</option>
                <option value="director">Director</option>
                <option value="coordinator">Coordinator</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-center">Center (Optional)</Label>
              <select
                id="user-center"
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
              <p className="text-xs text-muted-foreground">
                Users can be assigned to a center later
              </p>
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
            <Button type="submit" disabled={createUser.isPending}>
              {createUser.isPending ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
