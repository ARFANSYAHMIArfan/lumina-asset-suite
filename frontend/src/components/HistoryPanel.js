import React from 'react';
import { ScrollArea } from './ui/scroll-area';
import { Trash2, Clock, Video, Music } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { formatRelativeTime, formatDurationShort } from '../lib/format';
import { apiClearHistory } from '../lib/api';
import { toast } from 'sonner';

export default function HistoryPanel({ history, onChanged }) {
  const handleClear = async () => {
    try {
      await apiClearHistory();
      await onChanged();
      toast.success('History cleared');
    } catch {
      toast.error('Failed to clear');
    }
  };

  return (
    <div className="flex h-full flex-col" data-testid="history-list">
      <div className="shrink-0 p-3">
        <Button
          size="sm"
          variant="outline"
          onClick={handleClear}
          disabled={history.length === 0}
          className="h-8 w-full gap-2 bg-transparent border-border/70"
          data-testid="history-clear-button"
        >
          <Trash2 className="h-3.5 w-3.5" /> Clear history
        </Button>
      </div>
      <ScrollArea className="min-h-0 flex-1 px-3 pb-3">
        {history.length === 0 ? (
          <div className="mt-8 flex flex-col items-center gap-2 text-muted-foreground">
            <Clock className="h-6 w-6 opacity-50" />
            <p className="text-xs">No playback history yet</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em]">Take an asset live to record</p>
          </div>
        ) : (
          <div className="space-y-1">
            {history.map((entry) => {
              const Icon = entry.asset_type === 'audio' ? Music : Video;
              return (
                <div
                  key={entry.id}
                  className="flex items-start gap-2 rounded-md border border-border/60 bg-card/50 px-2 py-1.5"
                  data-testid={`history-entry-${entry.id}`}
                >
                  <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs" title={entry.asset_title}>{entry.asset_title}</p>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                        {formatRelativeTime(entry.played_at)}
                      </span>
                      <Badge variant="outline" className="h-4 border-border/70 bg-white/5 px-1 font-mono text-[8px] uppercase">
                        {entry.source}
                      </Badge>
                      {entry.duration_played && (
                        <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                          {formatDurationShort(entry.duration_played)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
