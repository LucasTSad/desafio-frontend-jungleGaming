import type { SVGProps } from 'react'

/** Envelope aberto com o cartão "Thank you", redesenhado a partir da ilustração do Figma. */
export function ThankYouIllustration(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 68 82"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d="M2 38 34 14l32 24v40a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2Z" />
      <path d="M8 6a2 2 0 0 1 2-2h48a2 2 0 0 1 2 2v39L34 62 8 45Z" fill="var(--surface)" />
      <path d="M30 4 34 1l4 3" />
      <path d="m2 38 32 22 32-22M2 78l24-22m40 22L42 56" />
      <text
        x="34"
        y="22"
        fill="currentColor"
        stroke="none"
        fontSize="10"
        fontWeight="700"
        textAnchor="middle"
      >
        THANK
      </text>
      <text
        x="34"
        y="34"
        fill="currentColor"
        stroke="none"
        fontSize="10"
        fontWeight="700"
        textAnchor="middle"
      >
        YOU
      </text>
    </svg>
  )
}
