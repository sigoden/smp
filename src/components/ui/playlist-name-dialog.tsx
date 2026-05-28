import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./dialog";
import { Button } from "./button";

interface PlaylistNameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  initialName?: string;
  confirmLabel: string;
  onSubmit: (name: string) => Promise<void>;
  validate?: (name: string) => string;
}

export function PlaylistNameDialog({
  open,
  onOpenChange,
  title,
  description,
  initialName = "",
  confirmLabel,
  onSubmit,
  validate,
}: PlaylistNameDialogProps) {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Ref to track the previous 'open' state
  const prevOpenRef = useRef(open);

  useEffect(() => {
    // Only reset state when the dialog transitions from closed to open.
    // This prevents the input from being cleared if `initialName` changes 
    // while the dialog is already open and the user is typing.
    if (open && !prevOpenRef.current) {
      setName(initialName);
      setError("");
      setSubmitting(false);
    }
    // Update the ref after checking
    prevOpenRef.current = open;
  }, [open, initialName]);

  const handleChange = (value: string) => {
    setName(value);
    setError(validate ? validate(value.trim()) : "");
  };

  const handleSubmit = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    if (validate) {
      const err = validate(trimmed);
      if (err) {
        setError(err);
        return;
      }
    }

    setSubmitting(true);
    try {
      await onSubmit(trimmed);
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="py-4">
          <input
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Playlist name"
            value={name}
            onChange={(e) => handleChange(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && name.trim() && !error && !submitting) {
                handleSubmit();
              }
            }}
          />
          {error && <p className="text-xs text-destructive mt-2">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!name.trim() || !!error || submitting}
            onClick={handleSubmit}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
