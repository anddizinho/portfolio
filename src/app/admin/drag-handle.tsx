"use client";

import { GripVertical } from "lucide-react";
import { useRef, type PointerEvent } from "react";

type Drag = { pointer: number; list: HTMLElement; row: HTMLElement; target: HTMLElement; x: number; y: number; moved: boolean };
const arrowDirections: Record<string, number | undefined> = { ArrowUp: -1, ArrowLeft: -1, ArrowDown: 1, ArrowRight: 1 };

export function DragHandle({ index, length, label, locked, onMove }: {
  index: number;
  length: number;
  label: string;
  locked: boolean;
  onMove(target: number): void;
}) {
  const drag = useRef<Drag | null>(null);

  function start(event: PointerEvent<HTMLButtonElement>) {
    if (!event.isPrimary || event.button !== 0 || drag.current) return;
    const row = event.currentTarget.closest<HTMLElement>("[data-sort-index]");
    const list = row?.closest<HTMLElement>("[data-sort-list]");
    if (!row || !list) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { pointer: event.pointerId, list, row, target: row, x: event.clientX, y: event.clientY, moved: false };
  }

  function track(event: PointerEvent<HTMLButtonElement>) {
    const active = drag.current;
    if (!active || event.pointerId !== active.pointer) return;
    if (!active.moved && Math.hypot(event.clientX - active.x, event.clientY - active.y) < 4) return;
    active.moved = true;
    active.row.dataset.sorting = "true";
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-sort-index]");
    if (!target || target.closest("[data-sort-list]") !== active.list || target === active.target) return;
    delete active.target.dataset.dropTarget;
    active.target = target;
    if (target !== active.row) target.dataset.dropTarget = "true";
  }

  function finish(event: PointerEvent<HTMLButtonElement>, drop: boolean) {
    const active = drag.current;
    if (!active || event.pointerId !== active.pointer) return;
    drag.current = null;
    delete active.row.dataset.sorting;
    delete active.target.dataset.dropTarget;
    const hit = document.elementFromPoint(event.clientX, event.clientY);
    if (!drop || locked || !active.moved || hit?.closest("[data-sort-list]") !== active.list) return;
    const row = hit.closest<HTMLElement>("[data-sort-index]") ?? active.target;
    const target = Number(row.dataset.sortIndex);
    if (Number.isInteger(target) && target >= 0 && target < length && target !== index) onMove(target);
  }

  return <button type="button" className="dashboard-grip" disabled={locked || length < 2}
    aria-label={`Reordenar ${label}, posição ${index + 1} de ${length}. Use as setas do teclado ou arraste.`}
    title="Arraste para reordenar"
    onPointerDown={start} onPointerMove={track}
    onPointerUp={(event) => finish(event, true)}
    onPointerCancel={(event) => finish(event, false)}
    onLostPointerCapture={(event) => finish(event, false)}
    onKeyDown={(event) => {
      const delta = arrowDirections[event.key];
      if (delta === undefined) return;
      event.preventDefault();
      const target = index + delta;
      if (!locked && target >= 0 && target < length) onMove(target);
    }}><GripVertical aria-hidden="true" size={17} /></button>;
}

export function reorder<T>(items: T[], from: number, to: number) {
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
