'use client';

import { useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { EventSponsoringBanner, EventSponsoringSlot, EventSponsoringSlotSize } from '@/lib/event-sponsoring/types';

interface EventSponsoringBannerEditorProps {
  eventId: string;
  banner: EventSponsoringBanner;
  initialSlots: EventSponsoringSlot[];
  saveAction: (formData: FormData) => Promise<void>;
}

interface SlotDraft {
  id: string;
  slotCode: string;
  displayLabel: string;
  packageSize: EventSponsoringSlotSize;
  x: number;
  y: number;
  width: number;
  height: number;
  sortOrder: number;
  status: EventSponsoringSlot['status'];
  active: boolean;
  bookingId?: string;
  isPersisted: boolean;
}

const SIZE_STYLES: Record<EventSponsoringSlotSize, string> = {
  small: 'border-sky-300 bg-sky-500/20 text-sky-50',
  medium: 'border-amber-300 bg-amber-500/20 text-amber-50',
  large: 'border-rose-300 bg-rose-500/20 text-rose-50',
};

const DEFAULT_NEW_SLOT_DIMENSIONS: Record<EventSponsoringSlotSize, { width: number; height: number }> = {
  small: { width: 0.18, height: 0.12 },
  medium: { width: 0.24, height: 0.16 },
  large: { width: 0.34, height: 0.2 },
};

function roundNormalized(value: number) {
  return Math.round(Math.min(1, Math.max(0, value)) * 10_000) / 10_000;
}

function toPercent(value: number) {
  return Math.round(value * 10_000) / 100;
}

function formatPercent(value: number) {
  return String(toPercent(value)).replace('.', ',');
}

function fromPercent(value: string) {
  const numeric = Number(value.replace(',', '.'));

  if (!Number.isFinite(numeric)) {
    return null;
  }

  return roundNormalized(numeric / 100);
}

function createDraft(slot: EventSponsoringSlot): SlotDraft {
  return {
    id: slot.id,
    slotCode: slot.slotCode,
    displayLabel: slot.displayLabel,
    packageSize: slot.packageSize,
    x: slot.x,
    y: slot.y,
    width: slot.width,
    height: slot.height,
    sortOrder: slot.sortOrder,
    status: slot.status,
    active: slot.active,
    bookingId: slot.bookingId,
    isPersisted: true,
  };
}

function isProtected(slot: SlotDraft) {
  return slot.status === 'assigned' || Boolean(slot.bookingId);
}

function findFreePosition(slots: SlotDraft[], size: EventSponsoringSlotSize) {
  const dims = DEFAULT_NEW_SLOT_DIMENSIONS[size];
  const step = 0.02;

  for (let y = 0.02; y <= 1 - dims.height - 0.02; y += step) {
    for (let x = 0.02; x <= 1 - dims.width - 0.02; x += step) {
      const overlaps = slots.some((slot) => {
        if (!slot.active) {
          return false;
        }

        return x < slot.x + slot.width && slot.x < x + dims.width && y < slot.y + slot.height && slot.y < y + dims.height;
      });

      if (!overlaps) {
        return {
          x: roundNormalized(x),
          y: roundNormalized(y),
          width: roundNormalized(dims.width),
          height: roundNormalized(dims.height),
        };
      }
    }
  }

  return null;
}

function getPrefixForBanner(banner: EventSponsoringBanner) {
  return banner.sortOrder <= 10 ? 'B1' : 'B2';
}

function getNextDraftCode(slots: SlotDraft[], banner: EventSponsoringBanner, size: EventSponsoringSlotSize) {
  const prefix = getPrefixForBanner(banner);
  const sizeCode = size === 'small' ? 'S' : size === 'medium' ? 'M' : 'L';
  const usedNumbers = slots
    .map((slot) => {
      const match = slot.slotCode.match(new RegExp(`^${prefix}-${sizeCode}(\\d+)$`));
      return match ? Number.parseInt(match[1], 10) : null;
    })
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  const nextNumber = usedNumbers.length ? Math.max(...usedNumbers) + 1 : 1;
  return `${prefix}-${sizeCode}${nextNumber}`;
}

export function EventSponsoringBannerEditor({ eventId, banner, initialSlots, saveAction }: EventSponsoringBannerEditorProps) {
  const [slots, setSlots] = useState(() => initialSlots.map(createDraft));
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(initialSlots[0]?.id || null);
  const [dirty, setDirty] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const interactionRef = useRef<{
    slotId: string;
    mode: 'move' | 'resize';
    startX: number;
    startY: number;
    original: SlotDraft;
    pointerId: number;
  } | null>(null);

  const selectedSlot = slots.find((slot) => slot.id === selectedSlotId) || null;
  const serializedSlots = useMemo(
    () => JSON.stringify(slots.map((slot) => ({
      id: slot.isPersisted ? slot.id : '',
      slotCode: slot.slotCode,
      displayLabel: slot.displayLabel,
      packageSize: slot.packageSize,
      xPercent: toPercent(slot.x),
      yPercent: toPercent(slot.y),
      widthPercent: toPercent(slot.width),
      heightPercent: toPercent(slot.height),
      sortOrder: slot.sortOrder,
      status: slot.status,
      active: slot.active,
    }))),
    [slots],
  );

  function updateSlot(slotId: string, updater: (slot: SlotDraft) => SlotDraft) {
    setSlots((current) => current.map((slot) => (slot.id === slotId ? updater(slot) : slot)));
    setDirty(true);
  }

  function handlePointerStart(event: React.PointerEvent<HTMLButtonElement>, slot: SlotDraft, mode: 'move' | 'resize') {
    if (!surfaceRef.current || isProtected(slot)) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    interactionRef.current = {
      slotId: slot.id,
      mode,
      startX: event.clientX,
      startY: event.clientY,
      original: slot,
      pointerId: event.pointerId,
    };
    document.body.style.userSelect = 'none';
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!interactionRef.current || !surfaceRef.current) {
      return;
    }

    const surface = surfaceRef.current.getBoundingClientRect();
    const state = interactionRef.current;
    const deltaX = (event.clientX - state.startX) / surface.width;
    const deltaY = (event.clientY - state.startY) / surface.height;
    const original = state.original;

    updateSlot(state.slotId, (slot) => {
      if (state.mode === 'move') {
        return {
          ...slot,
          x: roundNormalized(Math.min(1 - slot.width, Math.max(0, original.x + deltaX))),
          y: roundNormalized(Math.min(1 - slot.height, Math.max(0, original.y + deltaY))),
        };
      }

      return {
        ...slot,
        width: roundNormalized(Math.min(1 - original.x, Math.max(0.04, original.width + deltaX))),
        height: roundNormalized(Math.min(1 - original.y, Math.max(0.04, original.height + deltaY))),
      };
    });
  }

  function finishPointerInteraction(pointerId: number) {
    if (!interactionRef.current || interactionRef.current.pointerId !== pointerId) {
      return;
    }

    interactionRef.current = null;
    document.body.style.userSelect = '';
  }

  function handleAddSlot(size: EventSponsoringSlotSize) {
    const position = findFreePosition(slots, size);

    if (!position) {
      setLocalError('Es konnte kein freier Bereich fuer eine neue Position dieser Groesse gefunden werden.');
      return;
    }

    const draftId = `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const slotCode = getNextDraftCode(slots, banner, size);
    const displayLabel = size === 'small' ? 'Neue kleine Position' : size === 'medium' ? 'Neue mittlere Position' : 'Neue grosse Position';

    setSlots((current) => [
      ...current,
      {
        id: draftId,
        slotCode,
        displayLabel,
        packageSize: size,
        x: position.x,
        y: position.y,
        width: position.width,
        height: position.height,
        sortOrder: current.length ? Math.max(...current.map((slot) => slot.sortOrder)) + 10 : 10,
        status: 'available',
        active: true,
        isPersisted: false,
      },
    ]);
    setSelectedSlotId(draftId);
    setDirty(true);
    setLocalError(null);
  }

  function handleRemoveSelectedSlot() {
    if (!selectedSlot) {
      return;
    }

    if (isProtected(selectedSlot)) {
      setLocalError('Zugewiesene Positionen koennen nicht entfernt werden.');
      return;
    }

    if (!window.confirm(`Soll die Position ${selectedSlot.slotCode} wirklich entfernt werden?`)) {
      return;
    }

    setSlots((current) => current.filter((slot) => slot.id !== selectedSlot.id));
    setSelectedSlotId((current) => (current === selectedSlot.id ? null : current));
    setDirty(true);
    setLocalError(null);
  }

  const counts = slots.reduce(
    (summary, slot) => {
      summary[slot.packageSize] += 1;
      summary[slot.status] += 1;
      return summary;
    },
    { small: 0, medium: 0, large: 0, available: 0, blocked: 0, assigned: 0 },
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="text-sm text-[color:var(--color-muted)]">
          Kleine Positionen: {counts.small} • Mittlere Positionen: {counts.medium} • Große Positionen: {counts.large}
          <br />
          Verfügbar: {counts.available} • Gesperrt: {counts.blocked} • Zugewiesen: {counts.assigned}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => handleAddSlot('small')} className="rounded-xl border border-sky-400/40 px-3 py-2 text-sm font-semibold text-sky-100 transition hover:border-sky-300">Position hinzufügen klein</button>
          <button type="button" onClick={() => handleAddSlot('medium')} className="rounded-xl border border-amber-400/40 px-3 py-2 text-sm font-semibold text-amber-100 transition hover:border-amber-300">Position hinzufügen mittel</button>
          <button type="button" onClick={() => handleAddSlot('large')} className="rounded-xl border border-rose-400/40 px-3 py-2 text-sm font-semibold text-rose-100 transition hover:border-rose-300">Position hinzufügen groß</button>
          <button type="button" onClick={handleRemoveSelectedSlot} disabled={!selectedSlot || isProtected(selectedSlot)} className="rounded-xl border border-red-400/40 px-3 py-2 text-sm font-semibold text-red-100 transition hover:border-red-300 disabled:cursor-not-allowed disabled:opacity-50">Ausgewählte Position entfernen</button>
        </div>
      </div>

      {localError ? <div className="rounded-xl border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm text-red-200">{localError}</div> : null}
      {dirty ? <div className="rounded-xl border border-amber-500/30 bg-amber-950/30 px-4 py-3 text-sm text-amber-100">Ungespeicherte Layoutänderungen vorhanden.</div> : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)]">
        <div>
          <div
            ref={surfaceRef}
            onPointerMove={handlePointerMove}
            onPointerUp={(event) => finishPointerInteraction(event.pointerId)}
            onPointerCancel={(event) => finishPointerInteraction(event.pointerId)}
            className="relative w-full overflow-hidden rounded-[1.4rem] border border-[color:var(--color-border)]/70 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.05),rgba(0,0,0,0.25))]"
            style={{ aspectRatio: '2 / 1' }}
          >
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:10%_10%]" />
            {slots.map((slot) => {
              const selected = slot.id === selectedSlotId;
              const protectedSlot = isProtected(slot);
              const style: CSSProperties = {
                left: `${slot.x * 100}%`,
                top: `${slot.y * 100}%`,
                width: `${slot.width * 100}%`,
                height: `${slot.height * 100}%`,
              };
              const blockedClasses = slot.status === 'blocked'
                ? 'border-slate-300 bg-[repeating-linear-gradient(135deg,rgba(148,163,184,0.45)_0px,rgba(148,163,184,0.45)_8px,rgba(71,85,105,0.45)_8px,rgba(71,85,105,0.45)_16px)] text-slate-50'
                : slot.status === 'assigned'
                  ? 'border-emerald-300 bg-emerald-500/30 text-emerald-50'
                  : SIZE_STYLES[slot.packageSize];

              return (
                <div
                  key={slot.id}
                  onClick={() => {
                    setSelectedSlotId(slot.id);
                    setLocalError(null);
                  }}
                  className={`absolute flex flex-col justify-between rounded-xl border-2 p-2 text-left shadow-[0_10px_30px_rgba(0,0,0,0.25)] ${blockedClasses} ${selected ? 'ring-2 ring-white' : ''} ${!slot.active ? 'opacity-45' : ''}`}
                  style={style}
                >
                  <div className="flex items-start justify-between gap-2 text-[10px] font-semibold uppercase tracking-[0.14em]">
                    <span>{slot.slotCode}</span>
                    <span>{slot.packageSize}</span>
                  </div>
                  <div className="text-[11px] leading-4">{slot.displayLabel}</div>
                  <div className="text-[10px] uppercase tracking-[0.12em]">{slot.status}{protectedSlot ? ' • gesperrt' : ''}</div>
                  <button
                    type="button"
                    aria-label={`Position ${slot.slotCode} verschieben`}
                    onPointerDown={(event) => handlePointerStart(event, slot, 'move')}
                    className={`absolute inset-0 rounded-xl ${protectedSlot ? 'cursor-not-allowed' : 'cursor-grab'}`}
                  />
                  {!protectedSlot ? (
                    <button
                      type="button"
                      aria-label={`Position ${slot.slotCode} skalieren`}
                      onPointerDown={(event) => handlePointerStart(event, slot, 'resize')}
                      className="absolute bottom-1 right-1 h-5 w-5 rounded-full border border-white/60 bg-black/30"
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-[1.4rem] border border-white/8 bg-black/10 p-5">
          {selectedSlot ? (
            <div className="space-y-4">
              <div>
                <h4 className="text-lg font-black text-white">Position {selectedSlot.slotCode}</h4>
                <p className="text-sm text-[color:var(--color-muted)]">Koordinaten werden als Prozent bearbeitet und normalisiert zwischen 0 und 1 gespeichert.</p>
                {isProtected(selectedSlot) ? <p className="mt-2 text-sm text-amber-200">Diese Position ist zugewiesen und serverseitig gegen Verschieben, Skalieren, Deaktivieren, Sperren und Entfernen geschützt.</p> : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-white">Positionscode</span>
                  <input value={selectedSlot.slotCode} onChange={(event) => updateSlot(selectedSlot.id, (slot) => ({ ...slot, slotCode: event.target.value }))} disabled={isProtected(selectedSlot)} className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none disabled:cursor-not-allowed disabled:opacity-60" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-white">Anzeigename</span>
                  <input value={selectedSlot.displayLabel} onChange={(event) => updateSlot(selectedSlot.id, (slot) => ({ ...slot, displayLabel: event.target.value }))} disabled={isProtected(selectedSlot)} className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none disabled:cursor-not-allowed disabled:opacity-60" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-white">Paketgröße</span>
                  <select value={selectedSlot.packageSize} onChange={(event) => updateSlot(selectedSlot.id, (slot) => ({ ...slot, packageSize: event.target.value as EventSponsoringSlotSize }))} disabled={isProtected(selectedSlot)} className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none disabled:cursor-not-allowed disabled:opacity-60">
                    <option value="small">Klein</option>
                    <option value="medium">Mittel</option>
                    <option value="large">Groß</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-white">Status</span>
                  <select value={selectedSlot.status} onChange={(event) => updateSlot(selectedSlot.id, (slot) => ({ ...slot, status: event.target.value as EventSponsoringSlot['status'] }))} disabled={isProtected(selectedSlot)} className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none disabled:cursor-not-allowed disabled:opacity-60">
                    <option value="available">Verfügbar</option>
                    <option value="blocked">Gesperrt</option>
                    {selectedSlot.status === 'assigned' ? <option value="assigned">Zugewiesen</option> : null}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-white">X-Position</span>
                  <input value={formatPercent(selectedSlot.x)} onChange={(event) => {
                    const value = fromPercent(event.target.value);
                    if (value !== null) {
                      updateSlot(selectedSlot.id, (slot) => ({ ...slot, x: value }));
                    }
                  }} disabled={isProtected(selectedSlot)} className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none disabled:cursor-not-allowed disabled:opacity-60" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-white">Y-Position</span>
                  <input value={formatPercent(selectedSlot.y)} onChange={(event) => {
                    const value = fromPercent(event.target.value);
                    if (value !== null) {
                      updateSlot(selectedSlot.id, (slot) => ({ ...slot, y: value }));
                    }
                  }} disabled={isProtected(selectedSlot)} className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none disabled:cursor-not-allowed disabled:opacity-60" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-white">Breite</span>
                  <input value={formatPercent(selectedSlot.width)} onChange={(event) => {
                    const value = fromPercent(event.target.value);
                    if (value !== null) {
                      updateSlot(selectedSlot.id, (slot) => ({ ...slot, width: value }));
                    }
                  }} disabled={isProtected(selectedSlot)} className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none disabled:cursor-not-allowed disabled:opacity-60" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-white">Höhe</span>
                  <input value={formatPercent(selectedSlot.height)} onChange={(event) => {
                    const value = fromPercent(event.target.value);
                    if (value !== null) {
                      updateSlot(selectedSlot.id, (slot) => ({ ...slot, height: value }));
                    }
                  }} disabled={isProtected(selectedSlot)} className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none disabled:cursor-not-allowed disabled:opacity-60" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-white">Sortierreihenfolge</span>
                  <input value={String(selectedSlot.sortOrder)} onChange={(event) => updateSlot(selectedSlot.id, (slot) => ({ ...slot, sortOrder: Number.parseInt(event.target.value || '0', 10) || 0 }))} disabled={isProtected(selectedSlot)} className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none disabled:cursor-not-allowed disabled:opacity-60" />
                </label>
                <label className="flex items-center gap-3 rounded-xl border border-[color:var(--color-border)]/70 bg-black/10 px-4 py-3 text-sm text-white">
                  <input type="checkbox" checked={selectedSlot.active} onChange={(event) => updateSlot(selectedSlot.id, (slot) => ({ ...slot, active: event.target.checked }))} disabled={isProtected(selectedSlot)} className="h-4 w-4 rounded border-[color:var(--color-border)] bg-black/20 disabled:cursor-not-allowed" />
                  Position aktiv
                </label>
              </div>
            </div>
          ) : (
            <p className="text-sm text-[color:var(--color-muted)]">Wähle eine Position im Banner aus, um ihre Werte exakt zu bearbeiten.</p>
          )}

          <form action={saveAction} className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-white/8 pt-5">
            <input type="hidden" name="eventId" value={eventId} />
            <input type="hidden" name="bannerId" value={banner.id} />
            <input type="hidden" name="baseLayoutVersion" value={String(banner.layoutVersion)} />
            <input type="hidden" name="slotsJson" value={serializedSlots} />
            <button type="submit" className="rounded-xl bg-[color:var(--color-accent)] px-5 py-3 text-sm font-black text-black transition hover:brightness-110">Layout speichern</button>
          </form>
        </div>
      </div>
    </div>
  );
}