import { useEffect, useRef, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Plus, Download, RotateCcw, Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TierRow } from "@/components/tier/TierRow";
import { ItemPool } from "@/components/tier/ItemPool";
import { toast } from "sonner";

export interface TierItem {
  id: string;
  label: string;
}

interface TierDef {
  id: string;
  label: string;
  colorClass: string;
}

const INITIAL_TIERS: TierDef[] = [
  { id: "goated", label: "Goated", colorClass: "bg-tier-goated" },
  { id: "good", label: "Good", colorClass: "bg-tier-good" },
  { id: "ight", label: "Ight", colorClass: "bg-tier-ight" },
  { id: "meh", label: "Meh", colorClass: "bg-tier-meh" },
  { id: "booty", label: "Booty", colorClass: "bg-tier-booty" },
];

const SAMPLE_ITEMS = [
  "Monday mornings",
  "Free Wi-Fi",
  "Traffic jams",
  "Homemade food",
  "Surprise meetings",
  "Cold pizza 🍕",
  "Fresh sheets",
  "Slow walkers",
];

const uid = () => Math.random().toString(36).slice(2, 10);

const Index = () => {
  const [tiers, setTiers] = useState<TierDef[]>(INITIAL_TIERS);
  const [placement, setPlacement] = useState<Record<string, TierItem[]>>(() => {
    const init: Record<string, TierItem[]> = { pool: [] };
    INITIAL_TIERS.forEach((t) => (init[t.id] = []));
    init.pool = SAMPLE_ITEMS.map((label) => ({ id: uid(), label }));
    return init;
  });
  const [input, setInput] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } }),
  );

  useEffect(() => {
    document.title = "Rate It — Tier List Maker";
  }, []);

  const findContainer = (itemId: string): string | null => {
    for (const key of Object.keys(placement)) {
      if (placement[key].some((i) => i.id === itemId)) return key;
    }
    return null;
  };

  const activeItem = activeId
    ? Object.values(placement)
        .flat()
        .find((i) => i.id === activeId) ?? null
    : null;

  const handleDragStart = (e: DragStartEvent) => {
    setActiveId(String(e.active.id));
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const fromKey = findContainer(String(active.id));
    const toKey = String(over.id);
    if (!fromKey || fromKey === toKey) return;

    setPlacement((prev) => {
      const item = prev[fromKey].find((i) => i.id === active.id);
      if (!item) return prev;
      return {
        ...prev,
        [fromKey]: prev[fromKey].filter((i) => i.id !== active.id),
        [toKey]: [...prev[toKey], item],
      };
    });
  };

  const handleAdd = () => {
    const label = input.trim().slice(0, 40);
    if (!label) return;
    setPlacement((p) => ({
      ...p,
      pool: [...p.pool, { id: uid(), label }],
    }));
    setInput("");
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const handleRemoveItem = (id: string) => {
    setPlacement((prev) => {
      const next: Record<string, TierItem[]> = {};
      for (const k of Object.keys(prev)) next[k] = prev[k].filter((i) => i.id !== id);
      return next;
    });
  };

  const handleClearTiers = () => {
    setPlacement((prev) => {
      const allTierItems: TierItem[] = [];
      const next: Record<string, TierItem[]> = { pool: [...prev.pool] };
      for (const t of tiers) {
        allTierItems.push(...prev[t.id]);
        next[t.id] = [];
      }
      next.pool = [...allTierItems, ...next.pool];
      return next;
    });
  };

  const handleReset = () => {
    const next: Record<string, TierItem[]> = { pool: [] };
    tiers.forEach((t) => (next[t.id] = []));
    next.pool = SAMPLE_ITEMS.map((label) => ({ id: uid(), label }));
    setPlacement(next);
    setTiers(INITIAL_TIERS);
  };

  const handleRenameTier = (id: string, label: string) => {
    setTiers((prev) => prev.map((t) => (t.id === id ? { ...t, label } : t)));
  };

  const handleExport = async () => {
    if (!boardRef.current) return;
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(boardRef.current, {
        backgroundColor: "#1E2025",
        scale: 2,
      });
      const link = document.createElement("a");
      link.download = "tier-list.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Exported as PNG");
    } catch {
      toast.error("Export failed");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-5xl px-4 py-10 sm:py-16">
        <header className="mb-10 flex flex-col gap-2">
          <h1 className="font-display text-5xl sm:text-7xl font-bold tracking-tight">
            Rate It
          </h1>
          <p className="text-muted-foreground">
            Drag items into your tier. Click a tier name to rename it.
          </p>
        </header>

        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div
            ref={boardRef}
            className="overflow-hidden rounded-2xl border border-border bg-tier-ink/50 divide-y divide-border"
          >
            {tiers.map((t) => (
              <TierRow
                key={t.id}
                id={t.id}
                label={t.label}
                colorClass={t.colorClass}
                items={placement[t.id] ?? []}
                onRemoveItem={handleRemoveItem}
                onRenameTier={handleRenameTier}
              />
            ))}
          </div>

          <div className="mt-8 space-y-4">
            <div className="flex flex-wrap gap-2">
              <div className="flex flex-1 min-w-[260px] gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  maxLength={40}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAdd();
                    }
                  }}
                  placeholder="Add an item… (emoji welcome 🔥)"
                  className="bg-surface border-border h-11"
                />
                <Button onClick={handleAdd} className="h-11 gap-1.5">
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={handleClearTiers}
                  className="h-11 gap-1.5"
                >
                  <Eraser className="h-4 w-4" /> Clear tiers
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleReset}
                  className="h-11 gap-1.5"
                >
                  <RotateCcw className="h-4 w-4" /> Reset
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleExport}
                  className="h-11 gap-1.5"
                >
                  <Download className="h-4 w-4" /> Export
                </Button>
              </div>
            </div>

            <ItemPool items={placement.pool ?? []} onRemoveItem={handleRemoveItem} />
          </div>

          <DragOverlay>
            {activeItem && (
              <div className="inline-flex items-center gap-2 rounded-lg border border-foreground/40 bg-surface-elevated px-3 py-2 text-sm font-medium shadow-2xl">
                <span className="max-w-[160px] truncate">{activeItem.label}</span>
              </div>
            )}
          </DragOverlay>
        </DndContext>

        <footer className="mt-12 text-center text-xs text-muted-foreground">
          Built for ranking everything from cold pizza to Monday mornings.
        </footer>
      </main>
    </div>
  );
};

export default Index;
