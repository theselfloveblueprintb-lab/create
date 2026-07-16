import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";
import type { UserProfile, Gender } from "@/types/profile";

interface Props {
  profile: UserProfile;
  onChange: (patch: Partial<UserProfile>) => void;
  onNext: () => void;
}

const GENDER_OPTIONS: { id: Gender; label: string }[] = [
  { id: "vrouw", label: "Vrouw" },
  { id: "man", label: "Man" },
  { id: "anders", label: "Anders" },
  { id: "zeg_ik_liever_niet", label: "Zeg ik liever niet" },
];

export function PersonalInfoStep({ profile, onChange, onNext }: Props) {
  const canContinue =
    profile.first_name.trim().length > 0 &&
    profile.date_of_birth.length > 0 &&
    !!profile.height_cm &&
    !!profile.weight_kg;

  return (
    <div className="flex flex-col h-full px-7 overflow-y-auto py-6">
      <h1 className="font-display font-bold text-[24px] text-center mb-1">Over jou</h1>
      <p className="text-center text-sm text-[#7A6F63] mb-6">Zodat Crea weet met wie ze werkt.</p>

      <TextField
        label="Voornaam"
        required
        value={profile.first_name}
        onChange={(e) => onChange({ first_name: e.target.value })}
        placeholder="Evelien"
      />
      <TextField
        label="Geboortedatum"
        required
        type="date"
        value={profile.date_of_birth}
        onChange={(e) => onChange({ date_of_birth: e.target.value })}
      />
      <TextField
        label="Lengte (cm)"
        required
        type="number"
        value={profile.height_cm ?? ""}
        onChange={(e) => onChange({ height_cm: e.target.value ? parseFloat(e.target.value) : null })}
        placeholder="176"
      />
      <TextField
        label="Huidig gewicht (kg)"
        required
        type="number"
        step="0.1"
        value={profile.weight_kg ?? ""}
        onChange={(e) => onChange({ weight_kg: e.target.value ? parseFloat(e.target.value) : null })}
        placeholder="104"
      />

      <div className="mb-4">
        <span className="block text-[13px] font-medium text-[#7A6F63] mb-1.5">Geslacht (optioneel)</span>
        <div className="flex flex-wrap gap-2">
          {GENDER_OPTIONS.map((g) => (
            <button
              key={g.id}
              onClick={() => onChange({ gender: profile.gender === g.id ? null : g.id })}
              className={`px-3.5 py-2 rounded-pill text-[13px] font-medium border-[1.5px] ${
                profile.gender === g.id ? "border-clay bg-[#FBF2ED]" : "border-line bg-white"
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      <TextField
        label="Tijdzone"
        value={profile.timezone}
        onChange={(e) => onChange({ timezone: e.target.value })}
      />

      <Button onClick={onNext} disabled={!canContinue} className="mt-4 disabled:opacity-40">
        Volgende
      </Button>
    </div>
  );
}
