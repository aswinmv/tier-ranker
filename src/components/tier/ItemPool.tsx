import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { TierChip } from "./TierChip";
import type { TierItem } from "@/pages/Index";

interface ItemPoolProps {
  items: TierItem[];
  onRemoveItem: (id: string) => void;
  onRelabelItem: (id: string, label: string) => void;
}

export const ItemPool = ({ items, onRemoveItem, onRelabelItem }: ItemPoolProps) => {
  const { setNodeRef, isOver } = useDroppable({ id: "pool" });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-[140px] rounded-2xl border border-border bg-surface p-4 transition-colors",
        isOver && "bg-surface-elevated ring-2 ring-inset ring-foreground/20",
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Item Pool
        </h2>
        <span className="text-xs text-muted-foreground tabular-nums">
          {items.length} unranked
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.length === 0 ? (
          <p className="w-full py-6 text-center text-sm text-muted-foreground/70 italic">
            All items placed. Add text or upload images above
          </p>
        ) : (
          items.map((item) => (
            <TierChip
              key={item.id}
              id={item.id}
              label={item.label}
              imageUrl={item.imageUrl}
              onRemove={onRemoveItem}
              onRelabel={onRelabelItem}
            />
          ))
        )}
      </div>
    </div>
  );
};
