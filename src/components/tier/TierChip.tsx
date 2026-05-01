import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { X } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface TierChipProps {
  id: string;
  label: string;
  imageUrl?: string;
  onRemove: (id: string) => void;
  onRelabel: (id: string, label: string) => void;
}

export const TierChip = ({ id, label, imageUrl, onRemove, onRelabel }: TierChipProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id });

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(label);

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.35 : 1,
    scale: isDragging ? 0.95 : 1,
  };

  const commit = () => {
    onRelabel(id, draft.trim().slice(0, 40));
    setEditing(false);
  };

  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  if (imageUrl) {
    return (
      <motion.div
        layout
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        className="group relative flex w-[88px] flex-col items-stretch gap-1 rounded-lg border border-border bg-surface-elevated p-1.5 shadow-sm cursor-grab active:cursor-grabbing select-none touch-none hover:border-foreground/40 transition-colors"
      >
        <div
          className="relative h-[72px] w-full overflow-hidden rounded-md bg-background"
          style={{
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <button
            onPointerDown={stop}
            onClick={(e) => {
              stop(e);
              onRemove(id);
            }}
            className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-background/80 text-foreground opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-destructive hover:text-destructive-foreground transition-opacity"
            aria-label="Remove image"
          >
            <X className="h-3 w-3" strokeWidth={3} />
          </button>
        </div>
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, 40))}
            onPointerDown={stop}
            onClick={stop}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") {
                setDraft(label);
                setEditing(false);
              }
            }}
            className="w-full bg-transparent text-center text-[11px] font-medium outline-none border-b border-foreground/30"
          />
        ) : (
          <button
            onPointerDown={stop}
            onClick={(e) => {
              stop(e);
              setDraft(label);
              setEditing(true);
            }}
            className={cn(
              "w-full truncate text-center text-[11px] font-medium leading-tight",
              !label && "text-muted-foreground/60 italic",
            )}
            title="Click to edit label"
          >
            {label || "Add label…"}
          </button>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="group inline-flex items-center gap-2 rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm text-foreground shadow-sm cursor-grab active:cursor-grabbing select-none touch-none hover:border-foreground/40 transition-colors"
    >
      <span className="max-w-[160px] truncate font-medium">{label}</span>
      <button
        onPointerDown={stop}
        onClick={(e) => {
          stop(e);
          onRemove(id);
        }}
        className="flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors"
        aria-label={`Remove ${label}`}
      >
        <X className="h-3 w-3" strokeWidth={3} />
      </button>
    </motion.div>
  );
};
