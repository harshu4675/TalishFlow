import { cn } from '@/utils/cn'

/**
 * TalishFlow brand mark.
 *
 * A rounded-square gradient tile containing three "flow" waves that form
 * a play/forward motion — long-form content flowing into short clips.
 * Rendered as inline SVG so it scales crisply and inherits no font cost.
 */
export function Logo({ className, ...props }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      role="img"
      aria-label="TalishFlow"
      className={cn('h-9 w-9', className)}
      {...props}
    >
      <defs>
        <linearGradient
          id="tf-logo-gradient"
          x1="4"
          y1="4"
          x2="44"
          y2="44"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="var(--tf-primary, #4f46e5)" />
          <stop offset="1" stopColor="var(--tf-primary-deep, #312e81)" />
        </linearGradient>
      </defs>

      <rect x="2" y="2" width="44" height="44" rx="13" fill="url(#tf-logo-gradient)" />
      <rect
        x="2"
        y="2"
        width="44"
        height="44"
        rx="13"
        fill="white"
        fillOpacity="0.06"
      />

      {/* Flow waves — three bars accelerating to a play point */}
      <path
        d="M13 29.5c2.7 0 2.7-11 5.5-11s2.7 11 5.5 11"
        stroke="white"
        strokeOpacity="0.92"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M26 29.5c2.5 0 2.5-11 5-11"
        stroke="white"
        strokeOpacity="0.55"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M33.5 20.4v13.2c0 1.4 1.5 2.3 2.7 1.5l4-2.9c1.1-.8 1.1-2.5 0-3.3l-4-2.9c-1.2-.8-2.7.1-2.7 1.5Z"
        fill="white"
      />
    </svg>
  )
}

/**
 * Logo with wordmark — used in navigation, auth screens, splash.
 */
export function LogoFull({ className, markClassName, tagline, ...props }) {
  return (
    <span className={cn('flex items-center gap-2.5', className)} {...props}>
      <Logo className={cn('h-9 w-9', markClassName)} />
      <span className="min-w-0 leading-none">
        <span className="text-foreground block truncate text-[15px] font-extrabold tracking-tight">
          TalishFlow
        </span>
        {tagline ? (
          <span className="text-foreground-faint mt-1 block text-[10px] font-semibold">
            {tagline}
          </span>
        ) : null}
      </span>
    </span>
  )
}

export default Logo
