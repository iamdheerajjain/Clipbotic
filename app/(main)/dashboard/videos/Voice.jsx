import React, { useState } from "react";
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
    <div className="space-y-4">
      {/* Header Section */}
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-white">Video Voice</h3>
        <p className="text-gray-400 text-sm">
          Select the voice that brings your story to life
        </p>
      </div>

      {/* Voice Options Grid */}
      <div className="grid grid-cols-1 gap-3">
        {voiceOptions.map((voice) => (
          <button
            key={voice.value}
            onClick={() => handleVoiceClick(voice)}
            className={`w-full p-4 rounded-xl border transition-all duration-300 text-left ${
              selectedVoice === voice.value
                ? "border-purple-500 bg-purple-500/10"
                : "border-gray-800 bg-black hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/20"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  selectedVoice === voice.value
                    ? "bg-purple-500"
                    : "bg-gray-700"
                }`}
              >
                <Mic className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-white">{voice.name}</p>
                <p className="text-sm text-gray-400">Voice option</p>
              </div>
              {selectedVoice === voice.value && (
                <div className="ml-auto w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default Voice;
