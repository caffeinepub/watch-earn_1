// Google IMA SDK Rewarded Video Ad component
// IMA SDK works in web browsers and can generate real ad revenue
// To earn real money: replace AD_TAG_URL with your Google Ad Manager rewarded ad tag
// Get it from: https://admanager.google.com -> Inventory -> Ad units -> Web rewarded

import { useEffect, useRef, useState } from "react";

// TEST ad tag - replace with your real Google Ad Manager rewarded ad tag URL for real revenue
const AD_TAG_URL =
  "https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/rewardedVideoExample&description_url=https%3A%2F%2Fdevelopers.google.com%2Finteractive-media-ads&tfcd=0&npa=0&sz=640x480&gdfp_req=1&unviewed_position_start=1&output=vast&env=vp&impl=s&correlator=";

interface IMARewardedAdProps {
  onRewarded: () => void;
  onClose: () => void;
  onError?: () => void;
}

declare global {
  interface Window {
    google?: {
      ima: any;
    };
  }
}

export function IMARewardedAd({
  onRewarded,
  onClose,
  onError,
}: IMARewardedAdProps) {
  const adContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<"loading" | "playing" | "error">(
    "loading",
  );
  const rewardedRef = useRef(false);

  useEffect(() => {
    let adsLoader: any = null;
    let adsManager: any = null;

    function loadIMAScript(): Promise<void> {
      return new Promise((resolve, reject) => {
        if (window.google?.ima) {
          resolve();
          return;
        }
        const script = document.createElement("script");
        script.src = "//imasdk.googleapis.com/js/sdkloader/ima3.js";
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("IMA SDK failed to load"));
        document.head.appendChild(script);
      });
    }

    async function initAds() {
      try {
        await loadIMAScript();
        const ima = window.google!.ima;
        ima.settings.setVpaidMode(ima.ImaSdkSettings.VpaidMode.ENABLED);

        const adContainer = adContainerRef.current!;
        const videoElement = videoRef.current!;

        const adDisplayContainer = new ima.AdDisplayContainer(
          adContainer,
          videoElement,
        );
        adDisplayContainer.initialize();

        adsLoader = new ima.AdsLoader(adDisplayContainer);

        adsLoader.addEventListener(
          ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
          (event: any) => {
            adsManager = event.getAdsManager(videoElement);

            adsManager.addEventListener(
              ima.AdEvent.Type.ALL_ADS_COMPLETED,
              () => {
                if (!rewardedRef.current) {
                  rewardedRef.current = true;
                  onRewarded();
                }
                onClose();
              },
            );

            adsManager.addEventListener(ima.AdEvent.Type.SKIPPED, () => {
              onClose();
            });

            adsManager.addEventListener(ima.AdErrorEvent.Type.AD_ERROR, () => {
              onError?.();
              onClose();
            });

            adsManager.addEventListener(ima.AdEvent.Type.COMPLETE, () => {
              if (!rewardedRef.current) {
                rewardedRef.current = true;
                onRewarded();
              }
            });

            adsManager.addEventListener(ima.AdEvent.Type.STARTED, () => {
              setStatus("playing");
            });

            try {
              adsManager.init(640, 480, ima.ViewMode.NORMAL);
              adsManager.start();
              setStatus("playing");
            } catch (_e) {
              onError?.();
              onClose();
            }
          },
        );

        adsLoader.addEventListener(ima.AdErrorEvent.Type.AD_ERROR, () => {
          setStatus("error");
          setTimeout(() => {
            onError?.();
            onClose();
          }, 2000);
        });

        const adsRequest = new ima.AdsRequest();
        adsRequest.adTagUrl = AD_TAG_URL;
        adsRequest.linearAdSlotWidth = 640;
        adsRequest.linearAdSlotHeight = 480;
        adsRequest.nonLinearAdSlotWidth = 640;
        adsRequest.nonLinearAdSlotHeight = 150;
        adsLoader.requestAds(adsRequest);
      } catch (_e) {
        setStatus("error");
        setTimeout(() => {
          onError?.();
          onClose();
        }, 2000);
      }
    }

    initAds();

    return () => {
      adsManager?.destroy();
      adsLoader?.contentComplete();
    };
  }, [onRewarded, onClose, onError]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "oklch(0.08 0.006 255 / 97%)" }}
    >
      <div className="relative w-full max-w-2xl mx-4">
        <div
          className="relative bg-black rounded-2xl overflow-hidden"
          style={{ aspectRatio: "16/9" }}
        >
          {/* biome-ignore lint/a11y/useMediaCaption: IMA SDK controls the video content */}
          <video
            ref={videoRef}
            className="w-full h-full"
            playsInline
            style={{ display: status === "playing" ? "block" : "none" }}
          />
          <div ref={adContainerRef} className="absolute inset-0" />

          {status === "loading" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <div className="w-10 h-10 rounded-full border-2 border-yellow-400 border-t-transparent animate-spin" />
              <p className="text-white text-sm">Loading ad...</p>
            </div>
          )}

          {status === "error" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <p className="text-white text-base font-semibold">
                Ad unavailable
              </p>
              <p className="text-white/60 text-sm">Closing in 2 seconds...</p>
            </div>
          )}
        </div>

        <p className="text-center text-white/40 text-xs mt-3">
          Watch the full ad to earn your coins
        </p>
      </div>
    </div>
  );
}
