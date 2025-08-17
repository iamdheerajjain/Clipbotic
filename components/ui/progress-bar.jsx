"use client";
import React from "react";

export function ProgressBar({ progress, className = "" }) {
  return (
    <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
      <div
        className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

export function FormProgress({ formData }) {
  const fields = [
    { key: "title", label: "Title" },
    { key: "topic", label: "Topic" },
    { key: "script", label: "Script" },
    { key: "videoStyle", label: "Style" },
    { key: "voice", label: "Voice" },
    { key: "caption", label: "Captions" },
  ];

  const completedFields = fields.filter((field) => {
    if (field.key === "caption") {
      return formData?.caption?.style?.trim();
    }
    return formData?.[field.key]?.trim();
  }).length;

  const progress = Math.round((completedFields / fields.length) * 100);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Form Progress</span>
        <span className="font-medium">{progress}%</span>
      </div>
      <ProgressBar progress={progress} />
      <div className="grid grid-cols-2 gap-2 text-xs">
        {fields.map((field) => {
          const isComplete =
            field.key === "caption"
              ? !!formData?.caption?.style?.trim()
              : !!formData?.[field.key]?.trim();

          return (
            <div key={field.key} className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  isComplete ? "bg-green-500" : "bg-gray-300"
                }`}
              />
              <span className={isComplete ? "text-green-600" : "text-gray-500"}>
                {field.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
