interface SliderInputProps {
  value: number;
  onChange: (val: number) => void;
  minLabel: string;
  maxLabel: string;
}

export function SliderInput({ value, onChange, minLabel, maxLabel }: SliderInputProps) {
  return (
    <div className="px-1 pt-2.5 pb-1.5">
      <div className="text-center font-display text-[44px] font-bold text-clay mb-1.5">
        {value}
      </div>
      <input
        type="range"
        min={0}
        max={10}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="w-full accent-clay"
      />
      <div className="flex justify-between text-[11px] text-[#9A8E80] mt-1.5">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
}
