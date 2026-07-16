import { TextareaHTMLAttributes } from "react";

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function TextArea({ label, className = "", ...props }: TextAreaProps) {
  return (
    <label className="block">
      {label && <span className="block text-[13px] font-medium text-[#7A6F63] mb-1.5">{label}</span>}
      <textarea
        rows={5}
        className={`w-full rounded-card border-[1.5px] border-line px-4 py-3 text-[15px] font-body
                    resize-none focus:outline-none focus:border-clay ${className}`}
        {...props}
      />
    </label>
  );
}
