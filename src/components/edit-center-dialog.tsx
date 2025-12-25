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
import { CenterType } from "../generated/prisma/enums";

interface Center {
  id: string;
  name: string;
  type: CenterType;
  city: string;
  state: string;
  zip: string;
  directorId: string;
  coordinatorId: string;
}

interface EditCenterDialogProps {
  center: Center;
  trigger?: React.ReactNode;
}

export function EditCenterDialog({ center, trigger }: EditCenterDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(center.name);
  const [type, setType] = useState<CenterType>(center.type);
  const [city, setCity] = useState(center.city);
  const [state, setState] = useState(center.state);
  const [zip, setZip] = useState(center.zip);
  const [directorId, setDirectorId] = useState(center.directorId);
  const [coordinatorId, setCoordinatorId] = useState(center.coordinatorId);
  const [error, setError] = useState("");

  const utils = trpc.useUtils();
  const { data: users } = trpc.user.getAll.useQuery();

  // Reset form when center changes or dialog opens
  useEffect(() => {
    if (open) {
      setName(center.name);
      setType(center.type);
      setCity(center.city);
      setState(center.state);
      setZip(center.zip);
      setDirectorId(center.directorId);
      setCoordinatorId(center.coordinatorId);
      setError("");
    }
  }, [open, center]);

  const updateCenter = trpc.ecmoCenter.update.useMutation({
    onSuccess: () => {
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

    if (!directorId || !coordinatorId) {
      setError("Please select both a director and coordinator");
      return;
    }

    updateCenter.mutate({
      id: center.id,
      name,
      type,
      city,
      state,
      zip,
      directorId,
      coordinatorId,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline" size="sm">Edit</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit ECMO Center</DialogTitle>
          <DialogDescription>
            Update the center information
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Center Name</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Memorial Hospital ECMO Center"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-type">Center Type</Label>
              <select
                id="edit-type"
                value={type}
                onChange={(e) => setType(e.target.value as CenterType)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                required
              >
                <option value={CenterType.ADULT}>Adult</option>
                <option value={CenterType.PEDIATRIC}>Pediatric</option>
                <option value={CenterType.NEONATAL}>Neonatal</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-city">City</Label>
              <Input
                id="edit-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="New York"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-state">State</Label>
                <Input
                  id="edit-state"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="NY"
                  maxLength={2}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-zip">ZIP Code</Label>
                <Input
                  id="edit-zip"
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  placeholder="10001"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-director">Director</Label>
              <select
                id="edit-director"
                value={directorId}
                onChange={(e) => setDirectorId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                required
              >
                <option value="">Select a director...</option>
                {users?.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-coordinator">Coordinator</Label>
              <select
                id="edit-coordinator"
                value={coordinatorId}
                onChange={(e) => setCoordinatorId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                required
              >
                <option value="">Select a coordinator...</option>
                {users?.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
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
            <Button type="submit" disabled={updateCenter.isPending}>
              {updateCenter.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
