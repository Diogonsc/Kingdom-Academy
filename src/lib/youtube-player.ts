import { extractYoutubeVideoId } from "@/lib/youtube";

declare global {
  interface Window {
    YT?: {
      Player: new (
        element: HTMLElement | string,
        options: YoutubePlayerOptions,
      ) => YoutubePlayer;
      PlayerState: {
        ENDED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

type YoutubePlayer = {
  destroy: () => void;
  playVideo: () => void;
};

type YoutubePlayerOptions = {
  videoId: string;
  width?: string | number;
  height?: string | number;
  playerVars?: Record<string, string | number>;
  events?: {
    onReady?: (event: { target: YoutubePlayer }) => void;
    onStateChange?: (event: { data: number }) => void;
  };
};

type CreateYoutubePlayerOptions = {
  autoplay?: boolean;
  onEnded: () => void;
};

let youtubeApiPromise: Promise<void> | null = null;

export function loadYoutubeIframeApi(): Promise<void> {
  if (window.YT?.Player) {
    return Promise.resolve();
  }

  if (youtubeApiPromise) {
    return youtubeApiPromise;
  }

  youtubeApiPromise = new Promise((resolve) => {
    const previousReady = window.onYouTubeIframeAPIReady;

    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      resolve();
    };

    const existingScript = document.querySelector(
      'script[src="https://www.youtube.com/iframe_api"]',
    );

    if (!existingScript) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.head.appendChild(script);
    }
  });

  return youtubeApiPromise;
}

export function createYoutubePlayer(
  container: HTMLElement,
  videoInput: string | null | undefined,
  options: CreateYoutubePlayerOptions,
): YoutubePlayer | null {
  const videoId = extractYoutubeVideoId(videoInput);
  if (!videoId || !window.YT?.Player) return null;

  const { autoplay = false, onEnded } = options;

  return new window.YT.Player(container, {
    videoId,
    width: "100%",
    height: "100%",
    playerVars: {
      autoplay: autoplay ? 1 : 0,
      rel: 0,
      modestbranding: 1,
      enablejsapi: 1,
      origin: window.location.origin,
    },
    events: {
      onReady: (event) => {
        if (autoplay) {
          event.target.playVideo();
        }
      },
      onStateChange: (event) => {
        if (event.data === window.YT?.PlayerState.ENDED) {
          onEnded();
        }
      },
    },
  });
}
