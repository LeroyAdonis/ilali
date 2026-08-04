"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface PassphraseInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  label?: string;
  id?: string;
  required?: boolean;
  autoComplete?: string;
}

export default function PassphraseInput({
  value,
  onChange,
  error,
  disabled,
  placeholder = "e.g. green elephant dances quietly",
  label = "Recovery Passphrase",
  id = "passphrase",
  required = true,
  autoComplete = "off",
}: PassphraseInputProps) {
  const [touched, setTouched] = useState(false);

  const words = value.trim().split(/\s+/).filter(Boolean).length;
  const length = value.trim().length;

  function getStrength(): { label: string; color: string; width: string } {
    if (words >= 5 && length >= 25) return { label: "Strong", color: "bg-teal-deep", width: "100%" };
    if (words >= 4 && length >= 16) return { label: "Good", color: "bg-teal", width: "75%" };
    if (words >= 3 && length >= 10) return { label: "Fair", color: "bg-gold", width: "50%" };
    return { label: "Weak", color: "bg-orange", width: "25%" };
  }

  const strength = getStrength();
  const showError = touched || error;
  const hasError = (words > 0 && words < 3) || error;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink-soft">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type="text"
          autoComplete={autoComplete}
          required={required}
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder={placeholder}
          className={`mt-1 block w-full rounded-lg border bg-white px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200 disabled:opacity-50 ${
            showError && hasError ? "border-red-300" : "border-ink/10"
          }`}
        />
      </div>

      {value && (
        <div className="mt-2 space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-1.5 flex-1 rounded-full bg-ink/5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                style={{ width: strength.width }}
              />
            </div>
            <span className="text-xs font-medium text-ink-faint tabular-nums">
              {strength.label}
            </span>
          </div>
          <p className="text-xs text-ink-faint">
            {words} {words === 1 ? "word" : "words"} · {length} {length === 1 ? "character" : "characters"}
            {words < 3 && " (need at least 3)"}
          </p>
        </div>
      )}

      {showError && hasError && (
        <p className="mt-1 text-xs text-orange">
          {error || "Passphrase must contain at least 3 words"}
        </p>
      )}

      {!value && !error && (
        <p className="mt-1 text-xs text-ink-faint">
          Choose 3+ memorable words. Use this to recover your account.
        </p>
      )}
    </div>
  );
}
