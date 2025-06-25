"use client";

import React from "react";
import { IndustryPreset } from "../types";
import { getPresetStyles } from "../presets";

interface FormStylesProps {
  preset?: IndustryPreset;
  customStyles?: string;
}

export const FormStyles: React.FC<FormStylesProps> = ({ preset = "default", customStyles }) => {
  const presetStyles = getPresetStyles(preset);
  const allStyles = presetStyles + (customStyles || "");

  if (!allStyles.trim()) {
    return null;
  }

  return (
    <style jsx global>{`
      ${allStyles}
    `}</style>
  );
}; 