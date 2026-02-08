"use client";

import React, { useState } from "react";
import { UseFormRegister } from "react-hook-form";
import { FormField as FormFieldType } from "../types";
import { VolumeCalculatorDrawer } from "./VolumeCalculatorDrawer";

interface VolumeWithCalculatorFieldProps {
  field: FormFieldType;
  value?: unknown;
  onChange?: (value: unknown) => void;
  error?: string;
  register: UseFormRegister<Record<string, unknown>>;
}

export const VolumeWithCalculatorField: React.FC<
  VolumeWithCalculatorFieldProps
> = ({ field, value, onChange, error, register }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const numericValue =
    value !== undefined && value !== null && value !== ""
      ? Number(value)
      : null;
  const registerProps = register(field.name, {
    min: field.validation?.min ?? 5,
    max: field.validation?.max ?? 200,
  });

  const handleVolumeFromCalculator = (volume: number) => {
    onChange?.(volume);
    setDrawerOpen(false);
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <input
          type="number"
          id={field.name}
          {...registerProps}
          onChange={(e) => {
            registerProps.onChange(e);
            const v =
              e.target.value === "" ? undefined : parseFloat(e.target.value);
            onChange?.(v);
          }}
          value={value !== undefined && value !== null ? String(value) : ""}
          min={field.validation?.min ?? 5}
          max={field.validation?.max ?? 200}
          step={0.5}
          placeholder="Ex: 42.5"
          className="block w-full rounded-lg border border-gray-500 bg-white px-3 py-3 text-gray-900 text-sm placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none disabled:bg-gray-50 disabled:text-gray-500"
          aria-invalid={!!error}
          aria-describedby={error ? `${field.name}-error` : undefined}
        />
      </div>

      <button
        type="button"
        onClick={() => setDrawerOpen(true)}
        className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
      >
        <span aria-hidden>📦</span>
        Vous ne connaissez pas votre volume ? Ouvrir le calculateur
      </button>

      <VolumeCalculatorDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onVolumeEstimated={handleVolumeFromCalculator}
        currentVolume={numericValue ?? undefined}
      />
    </div>
  );
};
