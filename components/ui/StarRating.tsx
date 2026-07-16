interface StarRatingProps {
  value: number | null;
  onChange: (val: number) => void;
}

export function StarRating({ value, onChange }: StarRatingProps) {
  return (
    <div className="flex justify-center gap-2.5 my-2.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          onClick={() => onChange(i)}
          className={`text-[36px] cursor-pointer transition-transform active:scale-90 ${
            value !== null && i <= value ? "text-gold" : "text-line"
          }`}
        >
          ★
        </span>
      ))}
    </div>
  );
}
