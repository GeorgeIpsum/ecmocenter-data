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

interface DeleteUserDialogProps {
  userId: string;
  userName: string;
  trigger?: React.ReactNode;
}

export function DeleteUserDialog({
  userId,
  userName,
  trigger,
}: DeleteUserDialogProps) {
  const [open, setOpen] = useState(false);

  const utils = trpc.useUtils();

  const deleteUser = trpc.user.delete.useMutation({
    onSuccess: () => {
      utils.user.getAll.invalidate();
      utils.ecmoCenter.getAll.invalidate();
      setOpen(false);
    },
  });

  const handleDelete = () => {
    deleteUser.mutate({ id: userId });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            Delete
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delete User</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete {userName}? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteUser.isPending}
          >
            {deleteUser.isPending ? "Deleting..." : "Delete User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
