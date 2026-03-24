/**
 * AdSlot — AdSense-ready ad placeholder component.
 * When Google AdSense Publisher ID is added to index.html,
 * these slots activate automatically.
 *
 * AdSense: Replace data-ad-client with your Publisher ID (ca-pub-XXXXXXXXXXXXXXXX)
 */

type AdSize = "banner" | "rectangle" | "leaderboard" | "small";

interface AdSlotProps {
  size: AdSize;
  className?: string;
}

const sizeConfig: Record<
  AdSize,
  { label: string; dims: string; minHeight: string; adFormat: string }
> = {
  banner: {
    label: "Advertisement",
    dims: "320×50",
    minHeight: "60px",
    adFormat: "auto",
  },
  rectangle: {
    label: "Advertisement",
    dims: "300×250",
    minHeight: "260px",
    adFormat: "rectangle",
  },
  leaderboard: {
    label: "Advertisement",
    dims: "728×90",
    minHeight: "100px",
    adFormat: "horizontal",
  },
  small: {
    label: "Ad",
    dims: "inline",
    minHeight: "50px",
    adFormat: "fluid",
  },
};

export function AdSlot({ size, className = "" }: AdSlotProps) {
  const cfg = sizeConfig[size];

  return (
    <div
      className={`w-full flex flex-col items-center justify-center rounded-lg overflow-hidden ${className}`}
      style={{
        minHeight: cfg.minHeight,
        background: "oklch(0.14 0.01 255)",
        border: "1px dashed oklch(0.25 0.01 255 / 0.5)",
      }}
    >
      {/* AdSense: Replace data-ad-client with your Publisher ID */}
      {/* <ins
        className="adsbygoogle"
        style={{ display: "block", width: "100%", minHeight: cfg.minHeight }}
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
        data-ad-slot="0000000000"
        data-ad-format={cfg.adFormat}
        data-full-width-responsive="true"
      /> */}

      {/* Placeholder shown until AdSense is active */}
      <div className="flex flex-col items-center gap-1 py-2 px-3 select-none">
        <span
          className="text-[9px] font-semibold uppercase tracking-widest"
          style={{ color: "oklch(0.40 0.01 255)" }}
        >
          {cfg.label}
        </span>
        {size !== "small" && (
          <span
            className="text-[10px]"
            style={{ color: "oklch(0.32 0.01 255)" }}
          >
            {cfg.dims}
          </span>
        )}
      </div>
    </div>
  );
}
