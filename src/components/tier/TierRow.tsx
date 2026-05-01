import { useDroppable } from "@dnd-kit/core";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { TierChip } from "./TierChip";
import type { TierItem } from "@/pages/Index";

interface TierRowProps {
  id: string;
  label: string;
  colorClass: string;
  items: TierItem[];
  onRemoveItem: (id: string) => void;
  onRenameTier: (id: string, label: string) => void;
  onRelabelItem: (id: string, label: string) => void;
}

export const TierRow = ({
  id,
  label,
  colorClass,
  items,
  onRemoveItem,
  onRenameTier,
  onRelabelItem,
}: TierRowProps) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(label);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed) onRenameTier(id, trimmed.slice(0, 12));
    else setDraft(label);
    setEditing(false);
  };

  return (
    <div className="flex min-h-[120px] overflow-hidden">
      <div
        className={cn(
          "flex w-[110px] shrink-0 flex-col items-center justify-center gap-1 px-2 text-tier-ink",
          colorClass,
        )}
      >
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, 12))}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") {
                setDraft(label);
                setEditing(false);
              }
            }}
            className="w-full bg-transparent text-center font-display text-2xl font-bold outline-none border-b border-tier-ink/40"
          />
        ) : (
          <button
            onClick={() => {
              setDraft(label);
              setEditing(true);
            }}
            className="font-display text-2xl font-bold leading-tight text-center break-words"
            title="Click to rename"
          >
            {label}
          </button>
        )}
        <span className="rounded-full bg-tier-ink/15 px-2 py-0.5 text-[10px] font-semibold tabular-nums">
          {items.length} {items.length === 1 ? "item" : "items"}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex flex-1 flex-wrap content-start items-start gap-2 bg-surface p-3 transition-colors",
          isOver && "bg-surface-elevated ring-2 ring-inset ring-foreground/20",
        )}
      >
        {items.length === 0 && (
          <span className="self-center text-sm text-muted-foreground/60 italic px-2">
            Drop here
          </span>
        )}
        {items.map((item) => (
          <TierChip
            key={item.id}
            id={item.id}
            label={item.label}
            imageUrl={item.imageUrl}
            onRemove={onRemoveItem}
            onRelabel={onRelabelItem}
          />
        ))}
      </div>
    </div>
  );
};
