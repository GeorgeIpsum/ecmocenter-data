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

interface DeleteCenterDialogProps {
  centerId: string;
  centerName: string;
  trigger?: React.ReactNode;
}

export function DeleteCenterDialog({
  centerId,
  centerName,
  trigger,
}: DeleteCenterDialogProps) {
  const [open, setOpen] = useState(false);

  const utils = trpc.useUtils();

  const deleteCenter = trpc.ecmoCenter.delete.useMutation({
    onSuccess: () => {
      utils.ecmoCenter.getAll.invalidate();
      setOpen(false);
    },
  });

  const handleDelete = () => {
    deleteCenter.mutate({ id: centerId });
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
          <DialogTitle>Delete ECMO Center</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete {centerName}? This action cannot be
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
            disabled={deleteCenter.isPending}
          >
            {deleteCenter.isPending ? "Deleting..." : "Delete Center"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
