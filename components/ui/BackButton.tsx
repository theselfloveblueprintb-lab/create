interface BackButtonProps {
  onClick: () => void;
  visible: boolean;
}

export function BackButton({ onClick, visible }: BackButtonProps) {
  if (!visible) return null;
  return (
    <button
      onClick={onClick}
      aria-label="Terug"
      className="absolute top-5 left-5 z-10 h-9 w-9 rounded-full bg-white border border-line
                 flex items-center justify-center text-ink"
    >
      ←
    </button>
  );
}
