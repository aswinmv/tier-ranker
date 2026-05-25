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
import { Plus, Download, RotateCcw, Eraser, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TierRow } from "@/components/tier/TierRow";
import { ItemPool } from "@/components/tier/ItemPool";
import { toast } from "sonner";

export interface TierItem {
  id: string;
  label: string;
  imageUrl?: string;
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } }),
  );

  useEffect(() => {
    document.title = "Tier List Maker: Rank Anything Free Online | Rate It";
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
      for (const k of Object.keys(prev)) {
        next[k] = prev[k].filter((i) => {
          if (i.id === id && i.imageUrl) URL.revokeObjectURL(i.imageUrl);
          return i.id !== id;
        });
      }
      return next;
    });
  };

  const handleRelabelItem = (id: string, label: string) => {
    setPlacement((prev) => {
      const next: Record<string, TierItem[]> = {};
      for (const k of Object.keys(prev)) {
        next[k] = prev[k].map((i) => (i.id === id ? { ...i, label } : i));
      }
      return next;
    });
  };

  const handleUploadImages = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newItems: TierItem[] = [];
    let rejected = 0;
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/") || file.size > 8 * 1024 * 1024) {
        rejected++;
        return;
      }
      newItems.push({ id: uid(), label: "", imageUrl: URL.createObjectURL(file) });
    });
    if (newItems.length) {
      setPlacement((p) => ({ ...p, pool: [...p.pool, ...newItems] }));
    }
    if (rejected) toast.error(`${rejected} file(s) skipped (must be image under 8MB)`);
    if (fileInputRef.current) fileInputRef.current.value = "";
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
    // revoke any existing object URLs
    Object.values(placement).flat().forEach((i) => {
      if (i.imageUrl) URL.revokeObjectURL(i.imageUrl);
    });
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
            Tier List Maker: Rank Anything
          </h1>
          <p className="text-muted-foreground text-lg">
            Free drag-and-drop tier list maker and ranking website. Create a ranking list
            with text or images, rename tiers, and export your tier list as a PNG. Jump to
            the <a href="#how-to-rank" className="underline hover:text-foreground">how-to guide</a>,
            {" "}<a href="#ranking-website" className="underline hover:text-foreground">ranking website overview</a>,
            {" "}<a href="#comparison" className="underline hover:text-foreground">Rate It vs TierMaker vs Canva comparison</a>,
            or the <a href="#faq" className="underline hover:text-foreground">tier list FAQ</a>.
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
                onRelabelItem={handleRelabelItem}
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
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleUploadImages(e.target.files)}
                />
                <Button
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-11 gap-1.5"
                >
                  <ImagePlus className="h-4 w-4" /> Upload
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

            <ItemPool
              items={placement.pool ?? []}
              onRemoveItem={handleRemoveItem}
              onRelabelItem={handleRelabelItem}
            />
          </div>

          <DragOverlay>
            {activeItem && (
              <div className="inline-flex items-center gap-2 rounded-lg border border-foreground/40 bg-surface-elevated px-3 py-2 text-sm font-medium shadow-2xl">
                <span className="max-w-[160px] truncate">{activeItem.label}</span>
              </div>
            )}
          </DragOverlay>
        </DndContext>

        <section aria-labelledby="how-to-rank" className="mt-16 grid gap-8 sm:grid-cols-2">
          <article>
            <h2 id="how-to-rank" className="font-display text-2xl font-bold mb-3">
              How to make a tier list in 4 steps
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              The Rate It tier list maker is a free drag-and-drop tool for building ranking
              lists. Follow the four steps below to create a tier list, rank anything you
              like, and export the result as a PNG image you can share with friends.
            </p>

            <h3 className="font-display text-base font-semibold mt-4 mb-1">1. Add items to the pool</h3>
            <p className="text-sm text-muted-foreground">
              Type a name into the input and press <strong>Add</strong>, or click
              <strong> Upload</strong> to import multiple images at once. Every item lands in
              the pool below the board so you can sort them in any order.
            </p>

            <h3 className="font-display text-base font-semibold mt-4 mb-1">2. Drag items into tiers</h3>
            <p className="text-sm text-muted-foreground">
              Drag each card from the pool into a tier row. Move items between rows freely
              until the ranking list reflects how you actually feel about each entry.
            </p>

            <h3 className="font-display text-base font-semibold mt-4 mb-1">3. Rename your tier labels</h3>
            <p className="text-sm text-muted-foreground">
              Click any tier label to rename it. The defaults are Goated, Good, Ight, Meh,
              and Booty, but the classic S, A, B, C, D, F format works too.
            </p>

            <h3 className="font-display text-base font-semibold mt-4 mb-1">4. Export as a PNG image</h3>
            <p className="text-sm text-muted-foreground">
              Hit <strong>Export</strong> to download a high-resolution PNG of your finished
              tier list. Share it on Twitter, Reddit, Discord, or anywhere else.
            </p>
          </article>

          <article>
            <h2 className="font-display text-2xl font-bold mb-3">Rank anything you can think of</h2>
            <p className="text-sm text-muted-foreground mb-3">
              This tier list creator is built for general-purpose ranking. Use it to rate
              entertainment, food, products, people, or abstract ideas. The board, tiers,
              and labels are all editable, so the same template works for serious power
              rankings or silly inside jokes.
            </p>

            <h3 className="font-display text-base font-semibold mt-3 mb-1">Popular tier list ideas</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
              <li><strong>Movies and TV:</strong> Marvel movies, Studio Ghibli films, Breaking Bad characters, Game of Thrones seasons.</li>
              <li><strong>Video games:</strong> Smash Bros fighters, Pokémon starters, Elden Ring bosses, Mario Kart tracks.</li>
              <li><strong>Anime and manga:</strong> shonen protagonists, One Piece arcs, Studio Trigger shows.</li>
              <li><strong>Music:</strong> Taylor Swift albums, Kendrick Lamar tracks, decade-by-decade songs.</li>
              <li><strong>Sports:</strong> NBA point guards, Premier League clubs, F1 drivers, NFL quarterbacks.</li>
              <li><strong>Food and drink:</strong> pizza toppings, fast food chains, breakfast cereals, coffee orders.</li>
              <li><strong>Everyday life:</strong> productivity apps, keyboard shortcuts, weekday vibes.</li>
            </ul>

            <h3 className="font-display text-base font-semibold mt-4 mb-1">Why use a tier list maker?</h3>
            <p className="text-sm text-muted-foreground">
              A tier list turns a messy opinion into something visual and comparable. Instead
              of arguing over numerical scores, you and your friends can place items into
              clearly labeled tiers and instantly see where you agree and disagree. It is
              one of the fastest ways to rank anything on the internet.
            </p>
          </article>
        </section>

        <section aria-labelledby="faq" className="mt-12">
          <h2 id="faq" className="font-display text-2xl font-bold mb-4">
            Tier list maker FAQ
          </h2>
          <div className="space-y-6 text-sm">
            <div>
              <h3 className="font-display text-base font-semibold text-foreground mb-1">What is a tier list?</h3>
              <p className="text-muted-foreground">
                A tier list is a ranking list that groups items into labeled tiers, typically
                from best (S or Goated) to worst (F or Booty). Tier lists make it easy to
                compare a large set of options at a glance and to share your opinion in a
                visual format that other people can argue with or remix.
              </p>
            </div>
            <div>
              <h3 className="font-display text-base font-semibold text-foreground mb-1">How do I create a tier list online for free?</h3>
              <p className="text-muted-foreground">
                Open Rate It in your browser, add items as text or images, and drag them into
                tiers. There is no signup, no install, and no paywall. When you are done,
                press <strong>Export</strong> to download your ranking list as a PNG.
              </p>
            </div>
            <div>
              <h3 className="font-display text-base font-semibold text-foreground mb-1">How do I rank items with images?</h3>
              <p className="text-muted-foreground">
                Click <em>Upload</em>, pick one or more images from your device, and drag the
                resulting cards into any tier. You can also add an optional caption to each
                image so people know what they are looking at.
              </p>
            </div>
            <div>
              <h3 className="font-display text-base font-semibold text-foreground mb-1">Can I rename the tiers?</h3>
              <p className="text-muted-foreground">
                Yes. Click any tier label on the left of the board to rename it. Use the
                classic S / A / B / C / D / F format, the default Goated / Good / Ight /
                Meh / Booty labels, or invent your own scale.
              </p>
            </div>
            <div>
              <h3 className="font-display text-base font-semibold text-foreground mb-1">Does the tier list maker work on mobile?</h3>
              <p className="text-muted-foreground">
                Yes. The drag-and-drop board is touch-friendly and works in any modern mobile
                browser, so you can build and share a ranking list straight from your phone.
              </p>
            </div>
            <div>
              <h3 className="font-display text-base font-semibold text-foreground mb-1">Is this tier list maker really free?</h3>
              <p className="text-muted-foreground">
                Yes. Rate It is 100% free, runs entirely in your browser, and never asks for
                a signup or payment. Your images and items stay on your device.
              </p>
            </div>
            <div>
              <h3 className="font-display text-base font-semibold text-foreground mb-1">Can I save my tier list as an image?</h3>
              <p className="text-muted-foreground">
                Yes. The <strong>Export</strong> button renders your board to a high-resolution
                PNG that you can post on social media, drop into a Discord channel, or attach
                to a blog post.
              </p>
            </div>
            <div>
              <h3 className="font-display text-base font-semibold text-foreground mb-1">How do I make a tier list for free?</h3>
              <p className="text-muted-foreground">
                Rate It is a free tier list maker that runs entirely in your browser. Open the
                page, type or upload the items you want to rank, drag them into the tiers, and
                hit <strong>Export</strong>. There is no trial, no premium plan, and no credit
                card prompt, just a free ranking website you can use as often as you like.
              </p>
            </div>
            <div>
              <h3 className="font-display text-base font-semibold text-foreground mb-1">How do I make a tier list without signing up?</h3>
              <p className="text-muted-foreground">
                You do not need an account. Rate It never asks you to sign up, log in, or
                connect a social profile. Your tier list lives in your browser tab, so you can
                rank anything privately and only share it when you are ready by exporting the
                PNG yourself.
              </p>
            </div>
            <div>
              <h3 className="font-display text-base font-semibold text-foreground mb-1">How do I make a tier list on mobile?</h3>
              <p className="text-muted-foreground">
                Open this page in Safari, Chrome, or any modern mobile browser. The board uses
                touch-friendly drag and drop, so you can press and hold an item and slide it
                into a tier with your thumb. Image uploads pull straight from your camera roll,
                making it the easiest way to build a teir list on a phone or tablet.
              </p>
            </div>
            <div>
              <h3 className="font-display text-base font-semibold text-foreground mb-1">How do I make a custom tier list?</h3>
              <p className="text-muted-foreground">
                Every part of the board is customizable. Rename the tier labels (S, A, B, C or
                anything else you invent), add your own items as text or images, write captions,
                and reorder rows by dragging. That flexibility is what turns a basic tierlist
                into a custom ranking list that actually reflects your taste.
              </p>
            </div>
            <div>
              <h3 className="font-display text-base font-semibold text-foreground mb-1">How do I make my own tier list from scratch?</h3>
              <p className="text-muted-foreground">
                Start with an empty board, decide what you are ranking (movies, songs, players,
                snacks, anything), add the contenders one by one, then sort them. Making your
                own tier list takes about two minutes and the result is a shareable ranking
                image that is yours, not a remix of someone else's template.
              </p>
            </div>
            <div>
              <h3 className="font-display text-base font-semibold text-foreground mb-1">Can I make a private tier list?</h3>
              <p className="text-muted-foreground">
                Yes. Rate It does not upload your tier list anywhere. Everything stays in your
                browser until you choose to export the PNG, which makes it a great private tier
                list maker for personal rankings, draft boards, or work-in-progress lists you
                are not ready to publish yet.
              </p>
            </div>
            <div>
              <h3 className="font-display text-base font-semibold text-foreground mb-1">How is this ranking website different from Canva tier list maker or TierMaker?</h3>
              <p className="text-muted-foreground">
                Canva is a full design suite and TierMaker focuses on community templates. Rate
                It is a focused list maker built around one job: drag, rank, export. There is
                no signup, no template gallery to wade through, and no design learning curve,
                just a clean ranking website that loads fast and gets out of your way.
              </p>
            </div>
            <div>
              <h3 className="font-display text-base font-semibold text-foreground mb-1">What can I rank with a tear maker like this?</h3>
              <p className="text-muted-foreground">
                Anything. People use Rate It as a teirlist tool for video games, anime
                characters, NFL quarterbacks, Taylor Swift albums, fast food chains, coworkers,
                Pokemon, board games, coffee shops, and the seven Star Wars films that actually
                exist. If you can name it, you can rank it.
              </p>
            </div>
          </div>
        </section>

        <footer className="mt-12 text-center text-xs text-muted-foreground">
          Built for ranking everything from cold pizza to Monday mornings.
        </footer>
      </main>
    </div>
  );
};

export default Index;
