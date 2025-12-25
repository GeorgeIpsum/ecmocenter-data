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
import { CenterType } from "../generated/prisma/enums";

interface CreateCenterDialogProps {
  buttonText?: string;
}

export function CreateCenterDialog({ buttonText = "Add New Center" }: CreateCenterDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<CenterType>(CenterType.ADULT);
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [directorId, setDirectorId] = useState("");
  const [coordinatorId, setCoordinatorId] = useState("");
  const [error, setError] = useState("");

  const utils = trpc.useUtils();
  const { data: usersData } = trpc.user.getAll.useQuery({ limit: 100 });
  const users = usersData?.users;

  const createCenter = trpc.ecmoCenter.create.useMutation({
    onSuccess: () => {
      utils.ecmoCenter.getAll.invalidate();
      setOpen(false);
      resetForm();
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const resetForm = () => {
    setName("");
    setType(CenterType.ADULT);
    setCity("");
    setState("");
    setZip("");
    setDirectorId("");
    setCoordinatorId("");
    setError("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!directorId || !coordinatorId) {
      setError("Please select both a director and coordinator");
      return;
    }

    createCenter.mutate({
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
        <Button className="w-full">{buttonText}</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create ECMO Center</DialogTitle>
          <DialogDescription>
            Add a new ECMO center to the system
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Center Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Memorial Hospital ECMO Center"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Center Type</Label>
              <select
                id="type"
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
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="New York"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="NY"
                  maxLength={2}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zip">ZIP Code</Label>
                <Input
                  id="zip"
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  placeholder="10001"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="director">Director</Label>
              <select
                id="director"
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
              <Label htmlFor="coordinator">Coordinator</Label>
              <select
                id="coordinator"
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
            <Button type="submit" disabled={createCenter.isPending}>
              {createCenter.isPending ? "Creating..." : "Create Center"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
