"use client";

import React, { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { VolumeCalculatorForm } from "./VolumeCalculatorForm";

/** z-index pour overlay et panel : au-dessus de la colonne sticky (formules, prix) */
const DRAWER_OVERLAY_Z = 100;
const DRAWER_PANEL_Z = 101;

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    setIsMobile(mq.matches);
    const handler = () => setIsMobile(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isMobile;
}

const VOLUME_MIN = 5;
const VOLUME_MAX = 200;

export interface VolumeCalculatorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onVolumeEstimated: (volume: number) => void;
  /** Volume actuel dans le formulaire principal (pour affichage / réitération) */
  currentVolume?: number | null;
}

export const VolumeCalculatorDrawer: React.FC<VolumeCalculatorDrawerProps> = ({
  isOpen,
  onClose,
  onVolumeEstimated,
  currentVolume,
}) => {
  const isMobile = useIsMobile();
  const [phase, setPhase] = useState<"form" | "success">("form");
  const [lastEstimatedVolume, setLastEstimatedVolume] = useState<number | null>(
    null,
  );

  const handleVolumeEstimated = useCallback((volume: number) => {
    if (volume < VOLUME_MIN || volume > VOLUME_MAX) return;
    setLastEstimatedVolume(volume);
    setPhase("success");
  }, []);

  const handleConfirmSuccess = useCallback(() => {
    if (lastEstimatedVolume != null) {
      onVolumeEstimated(lastEstimatedVolume);
    }
    setPhase("form");
    setLastEstimatedVolume(null);
    onClose();
  }, [lastEstimatedVolume, onVolumeEstimated, onClose]);

  const handleClose = useCallback(() => {
    setPhase("form");
    setLastEstimatedVolume(null);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, handleClose]);

  useEffect(() => {
    if (isOpen) setPhase("form");
  }, [isOpen]);

  if (!isOpen) return null;

  const drawerContent = (
    <>
      {/* Overlay */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Fermer"
        className="fixed inset-0 bg-black/40 animate-in fade-in duration-200"
        style={{ zIndex: DRAWER_OVERLAY_Z }}
        onClick={handleClose}
        onKeyDown={(e) => e.key === "Enter" && handleClose()}
      />

      {/* Panel: slide from right (desktop) / bottom sheet (mobile) */}
      <div
        className={
          isMobile
            ? "fixed inset-x-0 bottom-0 top-[15%] rounded-t-2xl bg-white shadow-xl flex flex-col animate-in slide-in-from-bottom duration-300 ease-out"
            : "fixed right-0 top-0 bottom-0 w-full max-w-[480px] sm:max-w-[520px] bg-white shadow-xl flex flex-col animate-in slide-in-from-right duration-300 ease-out"
        }
        style={{ zIndex: DRAWER_PANEL_Z }}
        aria-modal="true"
        aria-labelledby="volume-calculator-title"
        role="dialog"
      >
        {/* Header : titre et bouton sur la même ligne (mobile et desktop) */}
        <div className="flex flex-shrink-0 items-center justify-between gap-2 border-b border-gray-200 bg-white rounded-t-2xl px-4 py-3">
          <h2
            id="volume-calculator-title"
            className="text-lg font-semibold text-gray-900 flex-1 min-w-0 truncate pr-2"
          >
            Calculateur de volume
          </h2>
          <span
            className="inline-flex flex-shrink-0"
            style={{ width: 36, height: 36 }}
          >
            <button
              type="button"
              onClick={handleClose}
              className="flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 active:scale-[0.98] transition-colors w-full h-full p-0 min-w-0"
              style={{ width: 36, height: 36 }}
              aria-label="Fermer"
            >
              <svg
                className="w-4 h-4 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth={3}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </span>
        </div>

        {/* Content - scrollable */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {phase === "form" && (
            <VolumeCalculatorForm
              initialVolume={currentVolume ?? undefined}
              onSubmit={handleVolumeEstimated}
            />
          )}
          {phase === "success" && lastEstimatedVolume != null && (
            <div className="py-6 text-center">
              <p className="text-lg font-semibold text-gray-900 mb-1">
                Volume estimé : {lastEstimatedVolume} m³
              </p>
              <p className="text-sm text-gray-600 mb-6">
                Cette valeur a été ajoutée au formulaire principal.
              </p>
              <button
                type="button"
                onClick={handleConfirmSuccess}
                className="w-full py-3 rounded-xl font-semibold text-white bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 transition-colors"
              >
                Fermer
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );

  return typeof document !== "undefined"
    ? createPortal(drawerContent, document.body)
    : null;
};
