Add image support to tier list items. Users can upload multiple images via a new "Upload images" button next to the text input; each becomes a draggable card in the item pool with an optional inline-editable caption. Images use client-side object URLs (no backend), and existing drag/drop, tier placement, remove, clear, reset, and PNG export all keep working.

## Data model
Extend `TierItem` in `src/pages/Index.tsx`:
- `id: string`
- `label: string` (can be empty for image items)
- `imageUrl?: string` (set for image-backed items)

All placement/drag logic is keyed by `id`, so it keeps working unchanged.

## Upload flow (Index.tsx)
- Hidden `<input type="file" accept="image/*" multiple>` triggered by a new "Upload" button (lucide `ImagePlus` icon) placed next to the existing Add button.
- On change: for each file, create an object URL and push `{ id, label: "", imageUrl }` into `placement.pool`.
- Reject non-images and files >8MB with a `toast.error`.
- Revoke object URLs when items are removed and on Reset, to prevent memory leaks.

## Chip rendering (TierChip.tsx)
Add `imageUrl?` and `onRelabel(id, label)` props.
- **Image chip**: ~72×72 rounded thumbnail with the caption rendered below. Clicking the caption opens an inline input (Enter/blur commits, Escape cancels) — same pattern already used for tier rename. Empty caption shows placeholder "Add label…".
- **Text chip**: unchanged.
- Remove (×) button overlays the thumbnail's top-right corner on image chips, visible on hover/focus; stays inline for text chips.
- Whole card remains the drag handle.

## Wiring
- New `handleRelabelItem(id, label)` in `Index.tsx` updates the item in whichever container holds it.
- Pass `onRelabel` through `ItemPool` and `TierRow` down to `TierChip`.
- `handleRemoveItem` revokes `imageUrl` if present.

## Layout tweaks
- `TierRow` min-height bumped from 110 to 120 so thumbnail + caption fits.
- `ItemPool` empty-state text updated to mention image upload.

## Export
`html2canvas` already handles `<img>` from object URLs — no changes needed.

## Files
- `src/pages/Index.tsx` — model, upload + relabel handlers, hidden file input, Upload button
- `src/components/tier/TierChip.tsx` — image rendering, inline caption edit
- `src/components/tier/ItemPool.tsx` — prop pass-through, copy tweak
- `src/components/tier/TierRow.tsx` — prop pass-through, min-height bump

No new dependencies, no backend.