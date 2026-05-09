import React, { useEffect, useRef, useState, useCallback } from 'react';
import TopBar from '../components/TopBar';
import BusPlayer from '../components/BusPlayer';
import TransitionColumn from '../components/TransitionColumn';
import TransportControls from '../components/TransportControls';
import AudioDeck from '../components/AudioDeck';
import LibraryPanel from '../components/LibraryPanel';
import QueuePanel from '../components/QueuePanel';
import HistoryPanel from '../components/HistoryPanel';
import { StagingBadge, LiveBadge } from '../components/Badges';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Library as LibIcon, ListMusic, History as HistoryIcon } from 'lucide-react';
import {
  apiListAssets, apiListQueue, apiListHistory, apiAddHistory,
  apiRemoveFromQueue,
} from '../lib/api';
import { createBus, MSG, CMD } from '../lib/bus';
import { AudioEngine, EQ_BANDS, computePeakDb } from '../lib/audioEngine';
import { loadSessionState, saveSessionState } from '../lib/sessionState';
import { toast } from 'sonner';

export default function MCRApp() {
  // ========== Data ==========
  const [assets, setAssets] = useState([]);
  const [queue, setQueue] = useState([]);
  const [history, setHistory] = useState([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  // ========== Bus state ==========
  const [stagingAsset, setStagingAsset] = useState(null);
  const [liveAsset, setLiveAsset] = useState(null);
  const [stagingQueueItemId, setStagingQueueItemId] = useState(null);
  const [liveQueueItemId, setLiveQueueItemId] = useState(null);
  const [autoplay, setAutoplay] = useState(true);

  // ========== Live playback state ==========
  const [isLive, setIsLive] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const [takePulse, setTakePulse] = useState(false);

  // ========== Transport state (for LIVE) ==========
  const liveRef = useRef(null);
  const stagingRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loop, setLoop] = useState(false);

  // ========== Audio engine state ==========
  const audioEngineRef = useRef(new AudioEngine());
  const [gainDb, setGainDb] = useState(0);
  const [eqValues, setEqValues] = useState(EQ_BANDS.map(() => 0));
  const [peakDb, setPeakDb] = useState(-Infinity);

  // ========== Output device routing ==========
  const [outputDevices, setOutputDevices] = useState([]);
  const [selectedOutputId, setSelectedOutputId] = useState('default');
  const sinkIdSupported = typeof HTMLMediaElement !== 'undefined' &&
    'setSinkId' in HTMLMediaElement.prototype;

  // ========== BroadcastChannel bus to /display ==========
  const busRef = useRef(null);
  const [hasDisplayWindow, setHasDisplayWindow] = useState(false);

  // ========== Sidebar tab ==========
  const [sidebarTab, setSidebarTab] = useState('library');

  // ========== Spectrum data for visualizer ==========
  const getSpectrumData = useCallback(() => {
    return audioEngineRef.current.getFrequencyData();
  }, []);

  // ========== Load initial data ==========
  const reloadAssets = useCallback(async () => {
    try {
      const { data } = await apiListAssets();
      setAssets(data || []);
    } catch (err) {
      toast.error('Failed to load library');
    }
  }, []);

  const reloadQueue = useCallback(async () => {
    try {
      const { data } = await apiListQueue();
      setQueue(data || []);
    } catch (err) {
      toast.error('Failed to load queue');
    }
  }, []);

  const reloadHistory = useCallback(async () => {
    try {
      const { data } = await apiListHistory();
      setHistory(data || []);
    } catch (err) {
      toast.error('Failed to load history');
    }
  }, []);

  // Load session state from localStorage on mount
  useEffect(() => {
    const session = loadSessionState();
    if (session) {
      if (typeof session.autoplay === 'boolean') setAutoplay(session.autoplay);
      if (typeof session.loop === 'boolean') setLoop(session.loop);
      if (typeof session.gainDb === 'number') setGainDb(session.gainDb);
      if (Array.isArray(session.eqValues) && session.eqValues.length === EQ_BANDS.length) {
        setEqValues(session.eqValues);
      }
      if (session.selectedOutputId) setSelectedOutputId(session.selectedOutputId);
      if (session.sidebarTab) setSidebarTab(session.sidebarTab);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    (async () => {
      await Promise.all([reloadAssets(), reloadQueue(), reloadHistory()]);
      setDataLoaded(true);
    })();
  }, [reloadAssets, reloadQueue, reloadHistory]);

  // After data loaded, restore STAGING/LIVE asset references from session
  useEffect(() => {
    if (!dataLoaded) return;
    const session = loadSessionState();
    if (!session) return;

    if (session.stagingAssetId) {
      const asset = assets.find((a) => a.id === session.stagingAssetId);
      if (asset) {
        setStagingAsset(asset);
        // Also restore the queue item id if it still exists
        if (session.stagingQueueItemId && queue.find((q) => q.id === session.stagingQueueItemId)) {
          setStagingQueueItemId(session.stagingQueueItemId);
        }
      }
    }
    if (session.liveAssetId) {
      const asset = assets.find((a) => a.id === session.liveAssetId);
      if (asset) {
        setLiveAsset(asset);
        if (session.liveQueueItemId && queue.find((q) => q.id === session.liveQueueItemId)) {
          setLiveQueueItemId(session.liveQueueItemId);
        }
        // Don't auto-resume LIVE on refresh - operator must explicitly press play
        // We just restore the source ready to play. Show a soft toast to inform.
        toast.info('Restored last LIVE source. Press PLAY to resume.', { duration: 4000 });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataLoaded]);

  // Persist session state on relevant changes
  useEffect(() => {
    if (!dataLoaded) return;
    saveSessionState({
      stagingAssetId: stagingAsset?.id || null,
      stagingQueueItemId,
      liveAssetId: liveAsset?.id || null,
      liveQueueItemId,
      autoplay,
      loop,
      gainDb,
      eqValues,
      selectedOutputId,
      sidebarTab,
    });
  }, [
    dataLoaded, stagingAsset, stagingQueueItemId, liveAsset, liveQueueItemId,
    autoplay, loop, gainDb, eqValues, selectedOutputId, sidebarTab,
  ]);

  // ========== Load output devices ==========
  const refreshOutputDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const outputs = devices.filter((d) => d.kind === 'audiooutput');
      setOutputDevices(outputs);
    } catch (err) {
      // ignore - permission may be required
    }
  }, []);

  useEffect(() => {
    refreshOutputDevices();
    if (navigator.mediaDevices?.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', refreshOutputDevices);
      return () => navigator.mediaDevices.removeEventListener('devicechange', refreshOutputDevices);
    }
  }, [refreshOutputDevices]);

  // ========== BroadcastChannel setup ==========
  useEffect(() => {
    const bus = createBus();
    busRef.current = bus;
    const off = bus.addListener((data) => {
      if (data?.type === MSG.DISPLAY_HELLO) {
        setHasDisplayWindow(true);
        broadcastState();
      }
      if (data?.type === MSG.DISPLAY_BYE) {
        setHasDisplayWindow(false);
      }
    });
    bus.postMessage({ type: MSG.CONTROL_HELLO, ts: Date.now() });
    return () => {
      off?.();
      bus.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const broadcastState = useCallback(() => {
    busRef.current?.postMessage({
      type: MSG.CONTROL_STATE,
      ts: Date.now(),
      payload: {
        liveAsset,
        isPlaying,
        currentTime,
        duration,
        gainDb,
        eqBands: eqValues,
        isLive,
      },
    });
  }, [liveAsset, isPlaying, currentTime, duration, gainDb, eqValues, isLive]);

  // Broadcast significant state changes
  useEffect(() => {
    broadcastState();
  }, [liveAsset, isLive, broadcastState]);

  // Broadcast explicit command
  const sendCmd = useCallback((action, payload = {}) => {
    busRef.current?.postMessage({
      type: MSG.CONTROL_CMD,
      ts: Date.now(),
      payload: { action, assetType: liveAsset?.type, ...payload },
    });
  }, [liveAsset]);

  // ========== Audio engine connect to LIVE element ==========
  useEffect(() => {
    const el = liveRef.current;
    if (!el) return;
    const eng = audioEngineRef.current;
    eng.connect(el);
    eng.setMasterGainDb(gainDb);
    eqValues.forEach((v, i) => eng.setEqBand(i, v));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveAsset]);

  // ========== VU meter loop ==========
  useEffect(() => {
    let raf;
    const tick = () => {
      const eng = audioEngineRef.current;
      const td = eng.getTimeDomainData();
      if (td) {
        const peak = computePeakDb(td);
        setPeakDb(isFinite(peak) ? peak + gainDb : -Infinity);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [gainDb]);

  // ========== Apply output device sink ==========
  useEffect(() => {
    const el = liveRef.current;
    if (!el || !sinkIdSupported) return;
    if (selectedOutputId && el.setSinkId) {
      el.setSinkId(selectedOutputId).catch(() => {});
    }
  }, [selectedOutputId, sinkIdSupported, liveAsset]);

  // ========== High frequency time tick to /display ==========
  useEffect(() => {
    if (!hasDisplayWindow) return;
    const id = setInterval(() => {
      busRef.current?.postMessage({
        type: MSG.CONTROL_TICK,
        ts: Date.now(),
        payload: {
          currentTime: liveRef.current?.currentTime || 0,
          isPlaying: liveRef.current ? !liveRef.current.paused : false,
          duration: liveRef.current?.duration || 0,
        },
      });
    }, 200);
    return () => clearInterval(id);
  }, [hasDisplayWindow]);

  // ========== Audio handlers ==========
  const onGainChange = (db) => {
    setGainDb(db);
    audioEngineRef.current.setMasterGainDb(db);
  };
  const onChangeBand = (i, db) => {
    setEqValues((prev) => {
      const next = [...prev];
      next[i] = db;
      return next;
    });
    audioEngineRef.current.setEqBand(i, db);
  };
  const onResetEq = () => {
    setEqValues(EQ_BANDS.map(() => 0));
    audioEngineRef.current.resetEq();
  };

  const onSelectOutput = async (deviceId) => {
    setSelectedOutputId(deviceId);
    const el = liveRef.current;
    if (el?.setSinkId) {
      try {
        await el.setSinkId(deviceId);
        toast.success('Audio output routed');
      } catch (e) {
        toast.error(`Cannot route audio: ${e.message}`);
      }
    }
  };

  // ========== Bus operations ==========
  const previewToStaging = useCallback((asset, queueItemId = null) => {
    setStagingAsset(asset);
    setStagingQueueItemId(queueItemId);
  }, []);

  const handleTake = useCallback(async () => {
    if (!stagingAsset) {
      toast.error('Nothing in STAGING to take');
      return;
    }
    audioEngineRef.current.ensureContext();

    const newLive = stagingAsset;
    setLiveAsset(newLive);
    setLiveQueueItemId(stagingQueueItemId);
    setStagingAsset(null);
    setStagingQueueItemId(null);
    setIsLive(true);
    setTakePulse(true);
    setIsPulsing(true);
    setTimeout(() => setTakePulse(false), 250);
    setTimeout(() => setIsPulsing(false), 700);

    // Notify display: load new source + autoplay
    sendCmd(CMD.LOAD, { autoplay: true, asset: newLive });

    // Record history
    try {
      await apiAddHistory({
        asset_id: newLive.id,
        asset_title: newLive.title,
        asset_type: newLive.type,
        source: 'transition',
      });
      reloadHistory();
    } catch {}

    // Auto-play LIVE
    setTimeout(async () => {
      const el = liveRef.current;
      if (el) {
        try {
          el.currentTime = 0;
          await el.play();
        } catch (e) {
          // play may fail without user gesture; the user already clicked TAKE so should be fine
        }
      }
    }, 100);
  }, [stagingAsset, stagingQueueItemId, reloadHistory, sendCmd]);

  const handleCut = useCallback(async () => {
    if (!stagingAsset) {
      toast.error('Nothing in STAGING to cut');
      return;
    }
    audioEngineRef.current.ensureContext();
    const newLive = stagingAsset;
    setLiveAsset(newLive);
    setLiveQueueItemId(stagingQueueItemId);
    setStagingAsset(null);
    setStagingQueueItemId(null);
    setIsLive(true);

    sendCmd(CMD.LOAD, { autoplay: true, asset: newLive });

    try {
      await apiAddHistory({
        asset_id: newLive.id,
        asset_title: newLive.title,
        asset_type: newLive.type,
        source: 'transition',
      });
      reloadHistory();
    } catch {}

    setTimeout(async () => {
      const el = liveRef.current;
      if (el) {
        try {
          el.currentTime = 0;
          await el.play();
        } catch {}
      }
    }, 50);
  }, [stagingAsset, stagingQueueItemId, reloadHistory, sendCmd]);

  // ========== Transport handlers ==========
  const handlePlay = async () => {
    if (!liveAsset) {
      toast.error('No LIVE source');
      return;
    }
    audioEngineRef.current.ensureContext();
    try {
      await liveRef.current?.play();
      sendCmd(CMD.PLAY);
    } catch (e) {
      toast.error(`Cannot play: ${e.message}`);
    }
  };
  const handlePause = () => {
    liveRef.current?.pause();
    sendCmd(CMD.PAUSE);
  };
  const handleStop = () => {
    if (!liveRef.current) return;
    liveRef.current.pause();
    liveRef.current.currentTime = 0;
    setIsLive(false);
    sendCmd(CMD.STOP);
  };
  const handleSeek = (t) => {
    if (!liveRef.current) return;
    const time = Math.max(0, Math.min(t, duration || 0));
    liveRef.current.currentTime = time;
    sendCmd(CMD.SEEK, { time });
  };

  // Skip controls advance the queue's playhead through staging->take cycle
  const handleNext = async () => {
    if (queue.length === 0) {
      toast.info('Queue is empty');
      return;
    }
    let nextItem = queue[0];
    if (liveQueueItemId) {
      const idx = queue.findIndex((q) => q.id === liveQueueItemId);
      if (idx >= 0 && idx < queue.length - 1) {
        nextItem = queue[idx + 1];
      } else if (idx === queue.length - 1) {
        toast.info('Reached end of queue');
        return;
      }
    }
    if (!nextItem?.asset) return;
    previewToStaging(nextItem.asset, nextItem.id);
    setTimeout(() => {
      setLiveAsset(nextItem.asset);
      setLiveQueueItemId(nextItem.id);
      setStagingAsset(null);
      setStagingQueueItemId(null);
      setIsLive(true);
      sendCmd(CMD.LOAD, { autoplay: true, asset: nextItem.asset });
      apiAddHistory({
        asset_id: nextItem.asset.id,
        asset_title: nextItem.asset.title,
        asset_type: nextItem.asset.type,
        source: 'manual',
      }).then(reloadHistory).catch(() => {});
      setTimeout(async () => {
        const el = liveRef.current;
        if (el) {
          try {
            el.currentTime = 0;
            await el.play();
          } catch {}
        }
      }, 60);
    }, 80);
  };

  const handlePrev = () => {
    if (queue.length === 0) return;
    if (!liveQueueItemId) return;
    const idx = queue.findIndex((q) => q.id === liveQueueItemId);
    if (idx > 0) {
      const prevItem = queue[idx - 1];
      previewToStaging(prevItem.asset, prevItem.id);
    }
  };

  // ========== Live element callbacks ==========
  const onLiveTimeUpdate = (e) => {
    setCurrentTime(e.target.currentTime);
  };
  const onLiveLoadedMeta = (e) => {
    setDuration(e.target.duration || 0);
  };
  const onLivePlay = () => setIsPlaying(true);
  const onLivePause = () => setIsPlaying(false);
  const onLiveEnded = useCallback(async () => {
    setIsPlaying(false);

    if (loop && liveRef.current) {
      try {
        liveRef.current.currentTime = 0;
        await liveRef.current.play();
        sendCmd(CMD.SEEK, { time: 0 });
        sendCmd(CMD.PLAY);
      } catch {}
      return;
    }

    // Record completion history
    if (liveAsset) {
      try {
        await apiAddHistory({
          asset_id: liveAsset.id,
          asset_title: liveAsset.title,
          asset_type: liveAsset.type,
          duration_played: duration,
          source: autoplay ? 'autoplay' : 'manual',
        });
        reloadHistory();
      } catch {}
    }

    // Autoplay next from queue
    if (autoplay && queue.length > 0) {
      let nextIdx = 0;
      if (liveQueueItemId) {
        const idx = queue.findIndex((q) => q.id === liveQueueItemId);
        if (idx >= 0) nextIdx = idx + 1;
      }
      if (nextIdx < queue.length) {
        const next = queue[nextIdx];
        if (next?.asset) {
          if (liveQueueItemId) {
            try { await apiRemoveFromQueue(liveQueueItemId); } catch {}
            await reloadQueue();
          }
          setLiveAsset(next.asset);
          setLiveQueueItemId(next.id);
          setStagingAsset(null);
          setStagingQueueItemId(null);
          setIsLive(true);
          sendCmd(CMD.LOAD, { autoplay: true, asset: next.asset });
          setTimeout(async () => {
            const el = liveRef.current;
            if (el) {
              try {
                el.currentTime = 0;
                await el.play();
              } catch {}
            }
          }, 60);
          toast.success(`Auto-playing: ${next.asset.title}`);
          return;
        }
      }
    }

    setIsLive(false);
  }, [loop, autoplay, queue, liveQueueItemId, liveAsset, duration, reloadHistory, reloadQueue, sendCmd]);

  // ========== Pop out display ==========
  const handlePopOut = useCallback(() => {
    const url = `${window.location.origin}/display`;
    const win = window.open(url, 'lumina-display', 'width=1280,height=720');
    if (!win) {
      toast.error('Popup blocked. Please allow popups for this site.');
      return;
    }
    toast.success('External display opened');
  }, []);

  // ========== Sidebar quick actions ==========
  const onPreviewAsset = (asset) => previewToStaging(asset, null);
  const onLoadQueueItemToStaging = (item) => previewToStaging(item.asset, item.id);

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background text-foreground">
      <TopBar isLive={isLive} onPopOut={handlePopOut} />

      <div className="flex min-h-0 flex-1">
        {/* Left Sidebar */}
        <aside className="flex w-[320px] shrink-0 flex-col border-r border-border/80 bg-card/40" data-testid="sidebar">
          <Tabs value={sidebarTab} onValueChange={setSidebarTab} className="flex h-full flex-col">
            <TabsList className="m-3 grid h-9 grid-cols-3 bg-background">
              <TabsTrigger value="library" className="gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em]" data-testid="sidebar-tab-library">
                <LibIcon className="h-3 w-3" /> Library
              </TabsTrigger>
              <TabsTrigger value="queue" className="gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em]" data-testid="sidebar-tab-queue">
                <ListMusic className="h-3 w-3" /> Queue
                {queue.length > 0 && (
                  <span className="ml-1 rounded-md bg-primary/20 px-1 font-mono text-[9px] text-primary">{queue.length}</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em]" data-testid="sidebar-tab-history">
                <HistoryIcon className="h-3 w-3" /> History
              </TabsTrigger>
            </TabsList>
            <TabsContent value="library" className="min-h-0 flex-1 overflow-hidden m-0">
              <LibraryPanel
                assets={assets}
                onAssetsChanged={reloadAssets}
                onPreview={onPreviewAsset}
                onAddedToQueue={reloadQueue}
              />
            </TabsContent>
            <TabsContent value="queue" className="min-h-0 flex-1 overflow-hidden m-0">
              <QueuePanel
                queue={queue}
                currentItemId={liveQueueItemId}
                onLoadStaging={onLoadQueueItemToStaging}
                onChanged={reloadQueue}
                autoplay={autoplay}
                onToggleAutoplay={() => setAutoplay((v) => !v)}
              />
            </TabsContent>
            <TabsContent value="history" className="min-h-0 flex-1 overflow-hidden m-0">
              <HistoryPanel history={history} onChanged={reloadHistory} />
            </TabsContent>
          </Tabs>
        </aside>

        {/* Main area: Stage (top) + Control deck (bottom) */}
        <main className="flex min-w-0 flex-1 flex-col gap-3 overflow-hidden p-3">
          {/* Bus row */}
          <div className="flex min-h-0 flex-1 items-stretch gap-3">
            <div className="flex min-w-0 flex-1 flex-col">
              <BusPlayer
                ref={stagingRef}
                variant="staging"
                asset={stagingAsset}
                badge={<StagingBadge />}
                label="PREVIEW BUS"
                accent="text-primary"
                muted
              />
            </div>

            <TransitionColumn
              canTake={!!stagingAsset}
              onTake={handleTake}
              onCut={handleCut}
              isPulsing={takePulse}
            />

            <div className="flex min-w-0 flex-1 flex-col">
              <BusPlayer
                ref={liveRef}
                variant="live"
                asset={liveAsset}
                badge={<LiveBadge blinking={isLive} />}
                label="PROGRAM BUS"
                accent="text-[hsl(var(--live-red))]"
                isPulsing={isPulsing}
                onTimeUpdate={onLiveTimeUpdate}
                onLoadedMetadata={onLiveLoadedMeta}
                onPlay={onLivePlay}
                onPause={onLivePause}
                onEnded={onLiveEnded}
              />
            </div>
          </div>

          {/* Control deck */}
          <div className="shrink-0 space-y-3" data-testid="control-deck">
            <TransportControls
              isPlaying={isPlaying}
              currentTime={currentTime}
              duration={duration}
              onPlay={handlePlay}
              onPause={handlePause}
              onStop={handleStop}
              onPrev={handlePrev}
              onNext={handleNext}
              onSeek={handleSeek}
              loop={loop}
              onToggleLoop={() => setLoop((v) => !v)}
            />
            <AudioDeck
              gainDb={gainDb}
              onGainChange={onGainChange}
              peakDb={peakDb}
              eqValues={eqValues}
              onChangeBand={onChangeBand}
              onResetEq={onResetEq}
              outputDevices={outputDevices}
              selectedOutputId={selectedOutputId}
              onSelectOutput={onSelectOutput}
              sinkIdSupported={sinkIdSupported}
              getSpectrumData={getSpectrumData}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
