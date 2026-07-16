"use client";

import { Button } from "@/components/ui/Button";
import type { UserProfile, MedicalClearance } from "@/types/profile";

interface Props {
  profile: UserProfile;
  onChange: (patch: Partial<UserProfile>) => void;
  onNext: () => void;
}

function YesNoQuestion({
  question,
  hasDetail,
  detailValue,
  onToggle,
  onDetailChange,
  detailPlaceholder,
}: {
  question: string;
  hasDetail: boolean;
  detailValue: string;
  onToggle: (val: boolean) => void;
  onDetailChange: (val: string) => void;
  detailPlaceholder: string;
}) {
  return (
    <div className="mb-5">
      <div className="text-[14px] font-medium mb-2">{question}</div>
      <div className="flex gap-2 mb-2">
        <button
          onClick={() => onToggle(false)}
          className={`flex-1 py-2.5 rounded-card border-[1.5px] text-[13px] font-medium ${
            !hasDetail ? "border-sage bg-[#F0F4F0]" : "border-line bg-white"
          }`}
        >
          Nee
        </button>
        <button
          onClick={() => onToggle(true)}
          className={`flex-1 py-2.5 rounded-card border-[1.5px] text-[13px] font-medium ${
            hasDetail ? "border-clay bg-[#FBF2ED]" : "border-line bg-white"
          }`}
        >
          Ja
        </button>
      </div>
      {hasDetail && (
        <input
          value={detailValue}
          onChange={(e) => onDetailChange(e.target.value)}
          placeholder={detailPlaceholder}
          className="w-full rounded-card border-[1.5px] border-line px-3.5 py-2.5 text-[14px] focus:outline-none focus:border-clay"
        />
      )}
    </div>
  );
}

const CLEARANCE_OPTIONS: { id: MedicalClearance; label: string }[] = [
  { id: "yes", label: "Ja" },
  { id: "no", label: "Nee" },
  { id: "not_sure", label: "Nog niet zeker" },
];

export function HealthStep({ profile, onChange, onNext }: Props) {
  return (
    <div className="flex flex-col h-full px-7 overflow-y-auto py-6">
      <h1 className="font-display font-bold text-[24px] text-center mb-1">Jouw gezondheid</h1>
      <p className="text-center text-sm text-[#7A6F63] mb-6">Zodat Crea rekening met je houdt.</p>

      <YesNoQuestion
        question="Heb je op dit moment blessures?"
        hasDetail={profile.injuries.length > 0}
        detailValue={profile.injuries}
        onToggle={(val) => onChange({ injuries: val ? profile.injuries || " " : "" })}
        onDetailChange={(val) => onChange({ injuries: val })}
        detailPlaceholder="Bijv. hiel, rechtervoet"
      />

      <YesNoQuestion
        question="Heb je fysieke beperkingen?"
        hasDetail={profile.limitations.length > 0}
        detailValue={profile.limitations}
        onToggle={(val) => onChange({ limitations: val ? profile.limitations || " " : "" })}
        onDetailChange={(val) => onChange({ limitations: val })}
        detailPlaceholder="Vertel kort wat"
      />

      <YesNoQuestion
        question="Herstel je op dit moment van iets?"
        hasDetail={profile.recovery_status.length > 0}
        detailValue={profile.recovery_status}
        onToggle={(val) => onChange({ recovery_status: val ? profile.recovery_status || " " : "" })}
        onDetailChange={(val) => onChange({ recovery_status: val })}
        detailPlaceholder="Waarvan herstel je?"
      />

      <div className="mb-4">
        <div className="text-[14px] font-medium mb-2">Ben je door je dokter vrijgegeven om te sporten?</div>
        <div className="flex gap-2">
          {CLEARANCE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => onChange({ medical_clearance: opt.id })}
              className={`flex-1 py-2.5 rounded-card border-[1.5px] text-[13px] font-medium ${
                profile.medical_clearance === opt.id ? "border-clay bg-[#FBF2ED]" : "border-line bg-white"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <Button onClick={onNext} className="mt-4">
        Volgende
      </Button>
    </div>
  );
}
