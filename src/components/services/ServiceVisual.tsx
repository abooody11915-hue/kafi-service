import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { resolveServiceImage } from './serviceImages';

type Props = {
  code?: string;
  family?: string;
  className?: string;
  compact?: boolean;
  /** Set for above-the-fold hero visuals to skip lazy loading. */
  priority?: boolean;
};

export default function ServiceVisual({ code, family, className, compact = false, priority = false }: Props) {
  const asset = resolveServiceImage(code, family);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [asset.src]);

  return (
    <div
      className={cn(
        'relative isolate h-full w-full overflow-hidden bg-[#eef2ee]',
        compact ? 'service-photo-compact' : 'service-photo',
        className,
      )}
      aria-hidden
    >
      {!failed ? (
        <img
          src={asset.src}
          alt=""
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          width={1024}
          height={768}
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02]"
          style={{ objectPosition: asset.position }}
        />
      ) : (
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#e9f3ee,#dbe8e0)]" />
      )}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,.01),rgba(8,45,32,.055))]" />
    </div>
  );
}
