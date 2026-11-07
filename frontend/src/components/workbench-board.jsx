import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DndContext, DragOverlay, MouseSensor, TouchSensor, useSensor, useSensors, useDraggable, useDroppable, pointerWithin, rectIntersection } from "@dnd-kit/core";
import { motion as Motion, useReducedMotion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";

const columns = [
  { id: "todo", label: "To do", color: "bg-blue-500" },
  { id: "in_progress", label: "In progress", color: "bg-amber-500" },
  { id: "done", label: "Done", color: "bg-emerald-500" },
];
export function StatusSelect({ value, onChange, disabled, label, id, compact = false }) {
  return <Select value={value} onValueChange={onChange} disabled={disabled} size={compact ? "compact" : "default"}>
    <SelectTrigger id={id} aria-label={label} className={compact ? "w-36" : "w-full rounded-md"} />
    <SelectContent>{columns.map((column) => <SelectItem key={column.id} value={column.id}>{column.label}</SelectItem>)}</SelectContent>
  </Select>;
}
function CardView({ issue, pending, onEdit, onDelete, onMove, handle, overlay = false }) {
  return <article className="rounded-lg border border-border bg-background shadow-sm">
    <button type="button" {...handle} disabled={pending} onClick={onEdit} className="block w-full cursor-grab touch-manipulation space-y-2 rounded-t-lg p-4 text-left outline-none active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-ring">
      <h3 className="break-words text-sm font-medium leading-6">{issue.title}</h3>
      {issue.description && <p className="line-clamp-2 break-words text-xs leading-5 text-muted-foreground">{issue.description}</p>}
      <span className="block text-xs text-muted-foreground">{issue.sourceKey ? "From feedback summary" : "Created in Workbench"}</span>
    </button>
    <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-2">
      {overlay ? <span className="h-7 text-xs text-muted-foreground">{columns.find(column => column.id === issue.status)?.label}</span> : <StatusSelect compact label={`Status for ${issue.title}`} value={issue.status} disabled={pending} onChange={onMove} />}
      <Button variant="destructive" size="icon-compact" title="Delete issue" aria-label={`Delete ${issue.title}`} disabled={pending || overlay} onClick={onDelete}><HugeiconsIcon icon={Delete01Icon} size={15} aria-hidden="true" /></Button>
    </div>
  </article>;
}
function DraggableCard({ issue, pending, onEdit, onDelete, onMove, canOpen, reduced }) {
  const { attributes, listeners, setNodeRef } = useDraggable({ id: issue._id, disabled: pending });
  return <Motion.div ref={setNodeRef} layout="position" data-issue-id={issue._id} transition={{ layout: reduced ? { duration: 0 } : { type: "spring", duration: 0.3, bounce: 0 } }}>
    <CardView issue={issue} pending={pending} onEdit={() => { if (canOpen()) onEdit(issue); }} onDelete={() => onDelete(issue)} onMove={(status) => onMove(issue, status)} handle={{ ...attributes, ...listeners, "aria-label": `Open ${issue.title}` }} />
  </Motion.div>;
}
function Stage({ column, children, count }) {
  const { setNodeRef } = useDroppable({ id: column.id });
  return <section ref={setNodeRef} data-stage={column.id} aria-label={column.label} className="flex h-full min-h-0 w-[82vw] shrink-0 flex-col rounded-xl border border-border bg-muted/30 sm:w-80 lg:w-auto lg:min-w-0 lg:flex-1">
    <header className="flex shrink-0 items-center gap-2 p-4"><span aria-hidden="true" className={`size-2 rounded-full ${column.color}`} /><h2 className="text-sm font-medium">{column.label}</h2><span className="text-xs tabular-nums text-muted-foreground">{count}</span></header>
    <Motion.div layoutScroll className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-3 pb-3">{children}</Motion.div>
  </section>;
}
export default function WorkbenchBoard({ issues, pending, onEdit, onDelete, onMove }) {
  const [activeId, setActiveId] = useState(null);
  const [placement, setPlacement] = useState(null);
  const target = useRef(null);
  const endedAt = useRef(0);
  const reduced = useReducedMotion();
  const sensors = useSensors(useSensor(MouseSensor, { activationConstraint: { distance: 6 } }), useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } }));
  const ordered = issues.map((issue, index) => ({ ...issue, status: issue.status === "backlog" ? "todo" : issue.status, position: issue.position ?? new Date(issue.createdAt || 0).getTime() + index })).sort((a, b) => a.position - b.position);
  const active = ordered.find(issue => issue._id === activeId);
  function finish() { endedAt.current = Date.now(); setActiveId(null); setPlacement(null); target.current = null; }
  function locate(event) {
    const origin = event.activatorEvent.touches?.[0] || event.activatorEvent;
    const x = origin.clientX + event.delta.x, y = origin.clientY + event.delta.y;
    const stage = document.elementFromPoint(x, y)?.closest("[data-stage]");
    if (!stage) { target.current = null; setPlacement(null); return; }
    const cards = [...stage.querySelectorAll("[data-issue-id]")];
    const before = cards.find(card => { const rect = card.getBoundingClientRect(); return y < rect.top + rect.height / 2; });
    const next = { status: stage.dataset.stage, beforeId: before?.dataset.issueId || null };
    if (target.current?.status !== next.status || target.current?.beforeId !== next.beforeId) { target.current = next; setPlacement(next); }
  }
  return <DndContext sensors={sensors} collisionDetection={(args) => { const hits = pointerWithin(args); return hits.length ? hits : rectIntersection(args); }} onDragStart={({ active }) => { setActiveId(active.id); target.current = null; }} onDragMove={locate} onDragCancel={finish} onDragEnd={() => {
    const destination = target.current;
    if (active && destination) {
      const cards = ordered.filter(issue => issue.status === destination.status && issue._id !== active._id);
      const index = destination.beforeId ? cards.findIndex(issue => issue._id === destination.beforeId) : cards.length;
      const previous = cards[index - 1]?.position, next = cards[index]?.position;
      const position = previous !== undefined && next !== undefined ? (previous + next) / 2 : next !== undefined ? next - 1024 : (previous ?? Date.now()) + 1024;
      onMove(active, destination.status, position);
    }
    finish();
  }} accessibility={{ screenReaderInstructions: { draggable: "Drag an issue to move it. Use its status dropdown to move it with a keyboard." } }}>
    <div className="flex min-h-0 flex-1 gap-4 overflow-x-auto overflow-y-hidden pb-1" aria-label="Issue board">
      {columns.map(column => {
        const all = ordered.filter(issue => issue.status === column.id);
        const cards = all.filter(issue => issue._id !== activeId);
        const slot = active && (placement ? placement.status === column.id : active.status === column.id);
        const beforeId = placement ? placement.beforeId : all[all.findIndex(issue => issue._id === activeId) + 1]?._id;
        let slotIndex = beforeId ? cards.findIndex(issue => issue._id === beforeId) : cards.length;
        if (slotIndex < 0) slotIndex = cards.length;
        const nodes = cards.map(issue => <DraggableCard key={issue._id} issue={issue} pending={pending} onEdit={onEdit} onDelete={onDelete} onMove={onMove} canOpen={() => Date.now() - endedAt.current > 250} reduced={reduced} />);
        if (slot) nodes.splice(slotIndex, 0, <Motion.div key="insertion-slot" layout="position" aria-hidden="true" transition={{ layout: reduced ? { duration: 0 } : { type: "spring", duration: 0.3, bounce: 0 } }} className="rounded-lg border border-dashed border-border bg-muted"><div className="invisible"><CardView issue={active} overlay /></div></Motion.div>);
        return <Stage key={column.id} column={column} count={all.length}>{nodes}{!nodes.length && <p className="rounded-lg border border-dashed border-border p-8 text-center text-xs text-muted-foreground">No issues yet</p>}</Stage>;
      })}
    </div>
    {typeof document !== "undefined" && createPortal(<DragOverlay dropAnimation={null} zIndex={80} className="pointer-events-none">{active && <Motion.div initial={{ rotate: 0, boxShadow: "0 2px 4px rgb(0 0 0 / 0.04)" }} animate={{ rotate: reduced ? 0 : -4, boxShadow: "0 0 0 1px rgb(37 117 255 / 0.24), 0 0 0 4px rgb(37 117 255 / 0.16), 0 6px 16px rgb(0 0 0 / 0.12)" }} transition={{ duration: reduced ? 0 : 0.2, ease: [0.215, 0.61, 0.355, 1] }} className="rounded-lg"><CardView issue={active} overlay /></Motion.div>}</DragOverlay>, document.body)}
  </DndContext>;
}
