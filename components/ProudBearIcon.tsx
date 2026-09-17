export default function ProudBearIcon({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {/* Ears */}
      <circle cx="16" cy="16" r="8" fill="#F8FAFC" />
      <circle cx="48" cy="16" r="8" fill="#F8FAFC" />
      <circle cx="16" cy="16" r="4" fill="#CBD5E1" />
      <circle cx="48" cy="16" r="4" fill="#CBD5E1" />

      {/* Head */}
      <circle cx="32" cy="34" r="22" fill="#F8FAFC" />

      {/* Cheeks */}
      <circle cx="20" cy="38" r="4.5" fill="#FECDD3" opacity="0.7" />
      <circle cx="44" cy="38" r="4.5" fill="#FECDD3" opacity="0.7" />

      {/* Eyes */}
      <circle cx="24" cy="31" r="2.6" fill="#0F172A" />
      <circle cx="40" cy="31" r="2.6" fill="#0F172A" />

      {/* Snout */}
      <ellipse cx="32" cy="41" rx="9" ry="7" fill="#FFFFFF" />
      <ellipse cx="32" cy="38" rx="3.4" ry="2.6" fill="#0F172A" />
      <path
        d="M32 40.5V43M28 45c1.2 1.3 2.6 2 4 2s2.8-.7 4-2"
        stroke="#0F172A"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
