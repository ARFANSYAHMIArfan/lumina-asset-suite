import React, { useRef, useState } from 'react';
import { Plus, Search, Trash2, Upload, Video, Music, Eye, ListPlus, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent,
  AlertDialogHeader, AlertDialogTitle, AlertDialogDescription,
  AlertDialogFooter, AlertDialogAction, AlertDialogCancel,
} from './ui/alert-dialog';
import { formatDurationShort, formatFileSize } from '../lib/format';
import {
  apiRequestUploadUrl, uploadFileToR2, apiCreateAsset,
  apiDeleteAsset, apiAddToQueue,
} from '../lib/api';
import { toast } from 'sonner';

function probeMediaMetadata(file) {
  return new Promise((resolve) => {
    const isVideo = file.type.startsWith('video/');
    const isAudio = file.type.startsWith('audio/');
    if (!isVideo && !isAudio) {
      resolve({ duration: null, type: 'video' });
      return;
    }
    const url = URL.createObjectURL(file);
    const el = isVideo ? document.createElement('video') : document.createElement('audio');
    el.preload = 'metadata';
    el.src = url;
    el.onloadedmetadata = () => {
      const dur = isFinite(el.duration) ? el.duration : null;
      URL.revokeObjectURL(url);
      resolve({ duration: dur, type: isVideo ? 'video' : 'audio' });
    };
    el.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ duration: null, type: isVideo ? 'video' : 'audio' });
    };
  });
}

export default function LibraryPanel({ assets, onAssetsChanged, onPreview, onAddedToQueue }) {
  const fileRef = useRef(null);
  const [uploads, setUploads] = useState({}); // {tempId: {name, progress, error}}
  const [search, setSearch] = useState('');

  const filtered = assets.filter((a) =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    (a.tags || []).some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  const handleUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    event.target.value = '';

    for (const file of files) {
      const tempId = `${Date.now()}-${Math.random()}`;
      const isVideo = file.type.startsWith('video/');
      const isAudio = file.type.startsWith('audio/');
      if (!isVideo && !isAudio) {
        toast.error(`${file.name}: Format tidak disokong (video/audio sahaja)`);
        continue;
      }
      setUploads((prev) => ({ ...prev, [tempId]: { name: file.name, progress: 0, status: 'preparing' } }));
      try {
        const meta = await probeMediaMetadata(file);
        const assetType = meta.type;
        const { data: urlData } = await apiRequestUploadUrl(file.name, file.type, assetType);
        setUploads((prev) => ({ ...prev, [tempId]: { ...prev[tempId], status: 'uploading' } }));
        await uploadFileToR2(urlData.upload_url, file, (pct) => {
          setUploads((prev) => ({ ...prev, [tempId]: { ...prev[tempId], progress: pct } }));
        });
        setUploads((prev) => ({ ...prev, [tempId]: { ...prev[tempId], status: 'finalizing' } }));
        await apiCreateAsset({
          title: file.name,
          type: assetType,
          r2_key: urlData.r2_key,
          public_url: urlData.public_url,
          duration: meta.duration,
          file_size: file.size,
          mime_type: file.type,
        });
        toast.success(`Uploaded: ${file.name}`);
        await onAssetsChanged();
      } catch (err) {
        const detail = err?.response?.data?.detail || err?.message || 'Upload failed';
        toast.error(`${file.name}: ${detail}`);
      } finally {
        setUploads((prev) => {
          const copy = { ...prev };
          delete copy[tempId];
          return copy;
        });
      }
    }
  };

  const handleDelete = async (asset) => {
    try {
      await apiDeleteAsset(asset.id);
      toast.success('Asset removed');
      await onAssetsChanged();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const handleAddToQueue = async (asset) => {
    try {
      await apiAddToQueue(asset.id);
      toast.success(`Added to queue: ${asset.title}`);
      onAddedToQueue?.();
    } catch (err) {
      toast.error('Failed to add to queue');
    }
  };

  const uploadList = Object.entries(uploads);

  return (
    <div className="flex h-full flex-col" data-testid="library-panel">
      <div className="shrink-0 space-y-2 p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search assets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 bg-background pl-9 font-mono text-xs"
            data-testid="library-search-input"
          />
        </div>
        <Button
          onClick={() => fileRef.current?.click()}
          className="h-10 w-full gap-2 bg-primary text-primary-foreground hover:bg-[hsl(var(--lumina-orange-hover))]"
          data-testid="asset-upload-button"
        >
          <Upload className="h-4 w-4" /> Upload media
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="video/*,audio/*"
          multiple
          onChange={handleUpload}
          className="hidden"
          data-testid="asset-file-input"
        />
      </div>

      {uploadList.length > 0 && (
        <div className="shrink-0 space-y-1 px-3 pb-2">
          {uploadList.map(([id, info]) => (
            <div key={id} className="rounded-md border border-border/70 bg-background p-2">
              <div className="flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin text-primary" />
                <span className="flex-1 truncate text-xs">{info.name}</span>
                <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                  {info.status}
                </span>
              </div>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
                <div className="h-full bg-primary transition-all" style={{ width: `${info.progress || 0}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      <ScrollArea className="min-h-0 flex-1 px-3 pb-3">
        {filtered.length === 0 ? (
          <div className="mt-8 flex flex-col items-center gap-2 text-muted-foreground">
            <Upload className="h-6 w-6 opacity-50" />
            <p className="text-xs">No assets in library</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em]">Upload to get started</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((asset) => (
              <AssetRow
                key={asset.id}
                asset={asset}
                onPreview={() => onPreview(asset)}
                onAddToQueue={() => handleAddToQueue(asset)}
                onDelete={() => handleDelete(asset)}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

function AssetRow({ asset, onPreview, onAddToQueue, onDelete }) {
  const Icon = asset.type === 'video' ? Video : Music;
  return (
    <div
      className="group rounded-lg border border-border/70 bg-card p-2.5 transition-colors hover:bg-white/[0.03]"
      data-testid={`asset-card-${asset.id}`}
    >
      <div className="flex items-start gap-2.5">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${asset.type === 'video' ? 'bg-primary/10 text-primary' : 'bg-[#4CC9F0]/10 text-[#4CC9F0]'}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium" title={asset.title}>{asset.title}</p>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant="outline" className="h-5 border-border/70 bg-white/5 px-1.5 font-mono text-[9px] uppercase tracking-wide">
              {asset.type}
            </Badge>
            <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
              {formatDurationShort(asset.duration)} · {formatFileSize(asset.file_size)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-2.5 flex gap-1.5 opacity-60 transition-opacity group-hover:opacity-100">
        <Button
          size="sm"
          variant="outline"
          className="h-7 flex-1 gap-1 bg-transparent border-border/70 px-2 text-xs hover:bg-white/5"
          onClick={onPreview}
          data-testid={`asset-preview-${asset.id}`}
        >
          <Eye className="h-3 w-3" /> Preview
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 flex-1 gap-1 bg-transparent border-border/70 px-2 text-xs hover:bg-white/5"
          onClick={onAddToQueue}
          data-testid={`asset-queue-${asset.id}`}
        >
          <ListPlus className="h-3 w-3" /> Queue
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="h-7 w-7 shrink-0 bg-transparent border-border/70 px-0 text-destructive hover:bg-destructive/10"
              data-testid={`asset-delete-${asset.id}`}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-card border-border/80">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete asset</AlertDialogTitle>
              <AlertDialogDescription>
                {asset.title} will be removed from your library and storage. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-transparent">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
