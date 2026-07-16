interface ProgressDotsProps {
  total: number;
  current: number;
}

export function ProgressDots({ total, current }: ProgressDotsProps) {
  return (
    <div className="flex gap-1.5 justify-center px-6 pt-5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-[7px] rounded-full transition-all duration-200 ${
            i === current
              ? "w-5 bg-clay"
              : i < current
              ? "w-[7px] bg-sage"
              : "w-[7px] bg-line"
          }`}
        />
      ))}
    </div>
  );
}
