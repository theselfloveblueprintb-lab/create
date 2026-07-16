interface ChoiceCardProps {
  emoji?: string;
  label: string;
  selected: boolean;
  onClick: () => void;
}

export function ChoiceCard({ emoji, label, selected, onClick }: ChoiceCardProps) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 rounded-card border-[1.5px] px-4 py-[15px] cursor-pointer
                  text-[15px] font-medium transition-colors
                  ${selected ? "border-clay bg-[#FBF2ED]" : "border-line bg-white"}`}
    >
      {emoji && <span className="text-[22px]">{emoji}</span>}
      <span>{label}</span>
    </div>
  );
}
