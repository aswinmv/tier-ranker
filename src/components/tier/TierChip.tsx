import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { X } from "lucide-react";
import { motion } from "framer-motion";

interface TierChipProps {
  id: string;
  label: string;
  onRemove: (id: string) => void;
}

export const TierChip = ({ id, label, onRemove }: TierChipProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.35 : 1,
    scale: isDragging ? 0.95 : 1,
  };

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
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
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
