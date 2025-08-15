import React, { useState, useEffect } from "react";
import { Mic } from "lucide-react";

const voiceOptions = [
  { value: "hf_alpha", name: "Alpha (Female)" },
  { value: "af_sarah", name: "Sarah (Female)" },
  { value: "hm_omega", name: "Omega (Male)" },
  { value: "am_eric", name: "Eric (Male)" },
];

function Voice({ onHandleInputChange }) {
  const [selectedVoice, setSelectedVoice] = useState("");

  const handleVoiceClick = (voice) => {
    setSelectedVoice(voice.value);
    onHandleInputChange("voice", voice.value);
  };

  return (
    <div>
      <h2 className="mt-5">Video Voice</h2>
      <p className="text-sm text-muted-foreground mb-2">
        Select Voice for your Video
      </p>
      <div className="grid grid-cols-2 gap-3">
        {voiceOptions.map((voice, index) => (
          <button
            key={index}
            type="button"
            className={`relative cursor-pointer p-4 rounded-lg border transition-all duration-600 ease-[cubic-bezier(0.22,1,0.36,1)] outline-none focus-visible:ring-2 focus-visible:ring-[--brand-from] hover:-translate-y-2 hover:shadow-[0_16px_48px_rgba(0,0,0,0.28)] hover:bg-[color-mix(in_oklab,var(--primary)_10%,transparent)] hover:border-[color-mix(in_oklab,var(--primary)_25%,transparent)] ${
              selectedVoice === voice.value
                ? "border-[--brand-from] border-2"
                : "border-border"
            }`}
            onClick={() => handleVoiceClick(voice)}
          >
            {/* Voice Icon */}
            <div className="flex items-center justify-center mb-2">
              <Mic
                className={`w-5 h-5 ${
                  selectedVoice === voice.value
                    ? "text-[--brand-from]"
                    : "text-muted-foreground"
                }`}
              />
            </div>

            <span
              className={`text-sm font-medium transition-colors duration-300 ${
                selectedVoice === voice.value
                  ? "text-[--brand-from]"
                  : "text-foreground"
              }`}
            >
              {voice.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default Voice;
