import React, { useMemo } from 'react';
import { Trash2, Play, GripVertical, ListX } from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { formatDurationShort } from '../lib/format';
import { apiRemoveFromQueue, apiClearQueue, apiReorderQueue } from '../lib/api';
import { toast } from 'sonner';
import {
  DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors,
  closestCenter, DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableQueueRow({ item, idx, isCurrent, onLoadStaging, onRemove }) {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  const a = item.asset;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 transition-colors ${
        isCurrent
          ? 'border-[rgba(255,107,26,0.45)] bg-[rgba(255,107,26,0.08)]'
          : 'border-border/70 bg-card hover:bg-white/[0.03]'
      } ${isDragging ? 'shadow-[0_8px_24px_rgba(0,0,0,0.4)] ring-1 ring-primary/40' : ''}`}
      data-testid={isCurrent ? 'queue-current-item' : `queue-item-${item.id}`}
    >
      <button
        type="button"
        className="cursor-grab touch-none p-0.5 text-muted-foreground hover:text-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
        data-testid={`queue-drag-handle-${item.id}`}
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="font-mono text-[10px] tabular-nums text-muted-foreground w-5">
        {String(idx + 1).padStart(2, '0')}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium" title={a?.title}>
          {a?.title || 'Missing asset'}
        </p>
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="h-4 border-border/70 bg-white/5 px-1 font-mono text-[8px] uppercase">
            {a?.type || '--'}
          </Badge>
          <span className="font-mono text-[9px] tabular-nums text-muted-foreground">
            {formatDurationShort(a?.duration)}
          </span>
        </div>
      </div>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => onLoadStaging(item)}
        disabled={!a}
        className="h-7 w-7 shrink-0 p-0 text-primary hover:bg-primary/10"
        title="Load to STAGING"
        data-testid={`queue-load-${item.id}`}
      >
        <Play className="h-3.5 w-3.5" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => onRemove(item)}
        className="h-7 w-7 shrink-0 p-0 text-muted-foreground hover:text-destructive"
        data-testid={`queue-remove-${item.id}`}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

export default function QueuePanel({
  queue, currentItemId, onLoadStaging, onChanged, autoplay, onToggleAutoplay,
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const itemIds = useMemo(() => queue.map((q) => q.id), [queue]);

  const handleRemove = async (item) => {
    try {
      await apiRemoveFromQueue(item.id);
      await onChanged();
      toast.success('Removed from queue');
    } catch {
      toast.error('Failed to remove');
    }
  };

  const handleClear = async () => {
    try {
      await apiClearQueue();
      await onChanged();
      toast.success('Queue cleared');
    } catch {
      toast.error('Failed to clear');
    }
  };

  const onDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = queue.findIndex((q) => q.id === active.id);
    const newIndex = queue.findIndex((q) => q.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const reordered = arrayMove(queue, oldIndex, newIndex);
    try {
      await apiReorderQueue(reordered.map((i) => i.id));
      await onChanged();
    } catch {
      toast.error('Failed to reorder');
    }
  };

  return (
    <div className="flex h-full flex-col" data-testid="queue-list">
      <div className="shrink-0 space-y-2 p-3">
        <div className="flex items-center justify-between gap-2 rounded-md border border-border/70 bg-background px-2.5 py-2">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">AUTOPLAY</p>
            <p className="font-mono text-xs font-semibold tracking-tight">
              {autoplay ? 'ENABLED' : 'DISABLED'}
            </p>
          </div>
          <Button
            size="sm"
            variant={autoplay ? 'default' : 'outline'}
            onClick={onToggleAutoplay}
            className={autoplay
              ? 'h-8 bg-[hsl(var(--armed-green))] text-background hover:bg-[hsl(var(--armed-green))]/90'
              : 'h-8 bg-transparent border-border/70'
            }
            data-testid="queue-autoplay-toggle"
          >
            {autoplay ? 'ON' : 'OFF'}
          </Button>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleClear}
          disabled={queue.length === 0}
          className="h-8 w-full gap-2 bg-transparent border-border/70"
          data-testid="queue-clear-button"
        >
          <ListX className="h-3.5 w-3.5" /> Clear queue
        </Button>
      </div>

      <ScrollArea className="min-h-0 flex-1 px-3 pb-3">
        {queue.length === 0 ? (
          <div className="mt-8 flex flex-col items-center gap-2 text-muted-foreground">
            <p className="text-xs">Queue is empty</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em]">Add assets from Library</p>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
              <div className="space-y-1.5">
                {queue.map((item, idx) => (
                  <SortableQueueRow
                    key={item.id}
                    item={item}
                    idx={idx}
                    isCurrent={currentItemId === item.id}
                    onLoadStaging={onLoadStaging}
                    onRemove={handleRemove}
                  />
                ))}
              </div>
            </SortableContext>
            <DragOverlay />
          </DndContext>
        )}
      </ScrollArea>
    </div>
  );
}
