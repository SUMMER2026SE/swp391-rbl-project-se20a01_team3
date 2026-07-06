import { useEffect, useMemo, useRef } from 'react';

interface EmbeddedVideoPlayerProps {
  url: string;
  title: string;
  initialPositionSec: number;
  onProgress: (positionSec: number, durationSec: number) => void;
  onPause: () => void;
  onEnded: () => void;
}

interface YouTubePlayerInstance {
  getCurrentTime(): number;
  getDuration(): number;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  destroy(): void;
}

interface YouTubeNamespace {
  Player: new (
    element: HTMLElement,
    options: {
      videoId: string;
      playerVars: Record<string, number | string>;
      events: {
        onReady: (event: { target: YouTubePlayerInstance }) => void;
        onStateChange: (event: { data: number }) => void;
      };
    },
  ) => YouTubePlayerInstance;
}

declare global {
  interface Window {
    YT?: YouTubeNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let youTubeApiPromise: Promise<YouTubeNamespace> | null = null;

function loadYouTubeApi(): Promise<YouTubeNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (youTubeApiPromise) return youTubeApiPromise;

  youTubeApiPromise = new Promise((resolve) => {
    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousCallback?.();
      if (window.YT) resolve(window.YT);
    };
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      document.head.appendChild(script);
    }
  });
  return youTubeApiPromise;
}

function youtubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) return parsed.pathname.split('/').filter(Boolean)[0] ?? null;
    const embedMatch = parsed.pathname.match(/\/embed\/([^/]+)/);
    return embedMatch?.[1] ?? parsed.searchParams.get('v');
  } catch {
    return null;
  }
}

function isVimeoUrl(url: string): boolean {
  try {
    return new URL(url).hostname.includes('vimeo.com');
  } catch {
    return false;
  }
}

function VimeoPlayer(props: EmbeddedVideoPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerId = useMemo(() => `bee-vimeo-${crypto.randomUUID()}`, []);
  const callbackRef = useRef(props);
  const allowedPositionRef = useRef(Math.max(0, props.initialPositionSec));
  const lastProgressAtRef = useRef(Date.now());
  const isPlayingRef = useRef(false);
  callbackRef.current = props;

  const source = useMemo(() => {
    const parsed = new URL(props.url);
    parsed.searchParams.set('api', '1');
    parsed.searchParams.set('player_id', playerId);
    return parsed.toString();
  }, [playerId, props.url]);

  useEffect(() => {
    function send(method: string, value?: unknown) {
      iframeRef.current?.contentWindow?.postMessage({ method, value }, 'https://player.vimeo.com');
    }
    function handleMessage(event: MessageEvent) {
      if (event.origin !== 'https://player.vimeo.com' || event.source !== iframeRef.current?.contentWindow) return;
      let message = event.data;
      if (typeof message === 'string') {
        try { message = JSON.parse(message); } catch { return; }
      }
      if (message?.event === 'ready') {
        send('addEventListener', 'timeupdate');
        send('addEventListener', 'play');
        send('addEventListener', 'pause');
        send('addEventListener', 'ended');
        if (props.initialPositionSec > 0) send('setCurrentTime', props.initialPositionSec);
      } else if (message?.event === 'timeupdate') {
        const position = Number(message.data?.seconds ?? 0);
        const duration = Number(message.data?.duration ?? 0);
        const now = Date.now();
        const elapsedSec = isPlayingRef.current
          ? Math.max(0, (now - lastProgressAtRef.current) / 1000)
          : 0;
        const allowedPosition = allowedPositionRef.current;
        const wasSeeked = position < allowedPosition - 0.75
          || position > allowedPosition + elapsedSec + 1.25;
        lastProgressAtRef.current = now;
        if (wasSeeked) {
          send('setCurrentTime', allowedPosition);
          return;
        }
        allowedPositionRef.current = position;
        callbackRef.current.onProgress(position, duration);
      } else if (message?.event === 'play') {
        isPlayingRef.current = true;
        lastProgressAtRef.current = Date.now();
      } else if (message?.event === 'pause') {
        isPlayingRef.current = false;
        lastProgressAtRef.current = Date.now();
        callbackRef.current.onPause();
      } else if (message?.event === 'ended') {
        isPlayingRef.current = false;
        callbackRef.current.onEnded();
      }
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [props.initialPositionSec]);

  return (
    <iframe
      ref={iframeRef}
      src={source}
      className="absolute inset-0 h-full w-full"
      allow="autoplay; fullscreen; picture-in-picture"
      allowFullScreen
      title={props.title}
    />
  );
}

function YouTubePlayer(props: EmbeddedVideoPlayerProps & { videoId: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YouTubePlayerInstance | null>(null);
  const callbackRef = useRef(props);
  const allowedPositionRef = useRef(Math.max(0, props.initialPositionSec));
  const lastProgressAtRef = useRef(Date.now());
  const isPlayingRef = useRef(false);
  callbackRef.current = props;

  useEffect(() => {
    let cancelled = false;
    let player: YouTubePlayerInstance | null = null;
    let progressTimer: number | null = null;

    loadYouTubeApi().then((YT) => {
      if (cancelled || !containerRef.current) return;
      const playerHost = document.createElement('div');
      containerRef.current.replaceChildren(playerHost);
      player = new YT.Player(playerHost, {
        videoId: props.videoId,
        playerVars: {
          playsinline: 1,
          rel: 0,
          disablekb: 1,
          start: Math.max(0, Math.floor(props.initialPositionSec)),
        },
        events: {
          onReady: ({ target }) => {
            playerRef.current = target;
            const resumeAt = callbackRef.current.initialPositionSec;
            if (resumeAt > 0) target.seekTo(resumeAt, true);
            progressTimer = window.setInterval(() => {
              const position = target.getCurrentTime();
              const duration = target.getDuration();
              if (Number.isFinite(position) && Number.isFinite(duration)) {
                const now = Date.now();
                const elapsedSec = isPlayingRef.current
                  ? Math.max(0, (now - lastProgressAtRef.current) / 1000)
                  : 0;
                const allowedPosition = allowedPositionRef.current;
                const wasSeeked = position < allowedPosition - 0.75
                  || position > allowedPosition + elapsedSec + 1.25;
                lastProgressAtRef.current = now;
                if (wasSeeked) {
                  target.seekTo(allowedPosition, false);
                  return;
                }
                allowedPositionRef.current = position;
                callbackRef.current.onProgress(position, duration);
              }
            }, 500);
          },
          onStateChange: ({ data }) => {
            if (data === 1) {
              isPlayingRef.current = true;
              lastProgressAtRef.current = Date.now();
            }
            if (data === 0) {
              isPlayingRef.current = false;
              if (progressTimer !== null) {
                window.clearInterval(progressTimer);
                progressTimer = null;
              }
              callbackRef.current.onEnded();
            }
            if (data === 2) {
              isPlayingRef.current = false;
              lastProgressAtRef.current = Date.now();
              callbackRef.current.onPause();
            }
          },
        },
      });
    });

    return () => {
      cancelled = true;
      if (progressTimer !== null) window.clearInterval(progressTimer);
      playerRef.current = null;
      player?.destroy();
      containerRef.current?.replaceChildren();
    };
  }, [props.videoId]);

  useEffect(() => {
    if (props.initialPositionSec > 0) {
      allowedPositionRef.current = props.initialPositionSec;
      playerRef.current?.seekTo(props.initialPositionSec, true);
    }
  }, [props.initialPositionSec]);

  return <div ref={containerRef} className="absolute inset-0 h-full w-full" title={props.title} />;
}

export default function EmbeddedVideoPlayer(props: EmbeddedVideoPlayerProps) {
  const videoId = youtubeVideoId(props.url);
  if (videoId) return <YouTubePlayer {...props} videoId={videoId} />;
  if (isVimeoUrl(props.url)) return <VimeoPlayer {...props} />;
  return (
    <iframe
      src={props.url}
      className="absolute inset-0 h-full w-full"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      title={props.title}
    />
  );
}
