import { useState, useMemo } from 'react';
import { 
  getDomainFromPlatform, 
  getGoogleFaviconUrl, 
  getDuckDuckGoFaviconUrl, 
  getPlatformMonogram 
} from '../utils/favicon';
import { useRemoteFavicons } from '../utils/faviconPreference';

interface PlatformFaviconProps {
  url: string;
  platformId?: string;
  platformName: string;
  category?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  showTooltip?: boolean;
}

const SIZE_CONFIGS = {
  xs: {
    wrapper: 'w-3.5 h-3.5 min-w-[14px]',
    img: 'w-3.5 h-3.5',
    text: 'text-[8px]',
    pxSize: 16
  },
  sm: {
    wrapper: 'w-4.5 h-4.5 min-w-[18px]',
    img: 'w-4.5 h-4.5',
    text: 'text-[9px]',
    pxSize: 32
  },
  md: {
    wrapper: 'w-5.5 h-5.5 min-w-[22px]',
    img: 'w-5.5 h-5.5',
    text: 'text-[10px]',
    pxSize: 48
  },
  lg: {
    wrapper: 'w-7 h-7 min-w-[28px]',
    img: 'w-7 h-7',
    text: 'text-[11px]',
    pxSize: 64
  }
};

const CATEGORY_BORDER_COLORS: Record<string, string> = {
  default: 'border-rule bg-paper-2 text-ink-2'
};

export function PlatformFavicon({
  url,
  platformId,
  platformName,
  category = 'default',
  size = 'sm',
  className = '',
  showTooltip = true
}: PlatformFaviconProps) {
  const [remoteEnabled] = useRemoteFavicons();
  const [loadStage, setLoadStage] = useState<'primary' | 'fallback' | 'failed'>('primary');
  const [isLoaded, setIsLoaded] = useState(false);

  const domain = useMemo(() => {
    return getDomainFromPlatform(url, platformId);
  }, [url, platformId]);

  const sizeCfg = SIZE_CONFIGS[size] || SIZE_CONFIGS.sm;
  const categoryStyle = CATEGORY_BORDER_COLORS[category] || CATEGORY_BORDER_COLORS.default;
  const monogram = useMemo(() => getPlatformMonogram(platformName), [platformName]);

  const tooltipText = showTooltip 
    ? `${platformName} (${domain || 'web entity'})` 
    : undefined;

  // Handle image load error: step from Google -> DuckDuckGo -> Monogram fallback
  const handleError = () => {
    if (loadStage === 'primary') {
      setLoadStage('fallback');
      setIsLoaded(false);
    } else {
      setLoadStage('failed');
    }
  };

  const handleLoad = () => {
    setIsLoaded(true);
  };

  // Monograma local por padrão; favicon remoto só com a opção ligada (src/utils/faviconPreference.ts).
  if (!remoteEnabled || !domain || loadStage === 'failed') {
    return (
      <div
        title={tooltipText}
        aria-hidden={showTooltip ? undefined : true}
        className={`inline-flex items-center justify-center rounded-md font-mono font-bold select-none border shrink-0 ${sizeCfg.wrapper} ${sizeCfg.text} ${categoryStyle} ${className}`}
      >
        {monogram}
      </div>
    );
  }

  const src = loadStage === 'primary' 
    ? getGoogleFaviconUrl(domain, sizeCfg.pxSize)
    : getDuckDuckGoFaviconUrl(domain);

  return (
    <div
      title={tooltipText}
      className={`relative inline-flex items-center justify-center rounded-md p-0.5 border border-rule bg-paper-2 shrink-0 overflow-hidden ${sizeCfg.wrapper} ${className}`}
    >
      {/* Underlying fallback monogram while image loads */}
      {!isLoaded && (
        <span className={`font-mono text-ink-3 font-bold select-none ${sizeCfg.text}`}>
          {monogram}
        </span>
      )}
      <img
        src={src}
        alt=""
        referrerPolicy="no-referrer"
        loading="lazy"
        onLoad={handleLoad}
        onError={handleError}
        className={`object-contain transition-opacity duration-200 ${sizeCfg.img} ${
          isLoaded ? 'opacity-100' : 'opacity-0 absolute'
        }`}
      />
    </div>
  );
}
