import { InputHTMLAttributes } from "react";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  required?: boolean;
}

export function TextField({ label, required, className = "", ...props }: TextFieldProps) {
  return (
    <label className="block mb-4">
      <span className="block text-[13px] font-medium text-[#7A6F63] mb-1.5">
        {label}
        {required && <span className="text-clay"> *</span>}
      </span>
      <input
        className={`w-full rounded-card border-[1.5px] border-line px-4 py-3 text-[15px] font-body
                    focus:outline-none focus:border-clay ${className}`}
        {...props}
      />
    </label>
  );
}
