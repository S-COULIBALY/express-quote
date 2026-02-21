"use client";

/**
 * Page Mes Missions — Chef d'équipe
 * Permet de confirmer l'encaissement du solde (70%) après la prestation
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";

interface Mission {
  id: string;
  attributionId: string;
  reference: string;
  service_type: string;
  amount: number;
  balanceAmount: number;
  location: string;
  scheduledDate: string;
  customerName: string;
  customerPhone: string;
  status: string;
  acceptedAt: string;
  balance_paid: boolean;
  balance_paid_at: string | null;
  balance_payment_method: string | null;
}

interface ConfirmModalProps {
  mission: Mission;
  onConfirm: (paymentMethod: "CHEQUE" | "TPE") => Promise<void>;
  onClose: () => void;
  loading: boolean;
}

function ConfirmBalanceModal({
  mission,
  onConfirm,
  onClose,
  loading,
}: ConfirmModalProps) {
  const [method, setMethod] = useState<"CHEQUE" | "TPE" | null>(null);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Confirmer l&apos;encaissement
        </h2>
        <p className="text-gray-600 mb-4">
          Réservation{" "}
          <span className="font-mono font-semibold">{mission.reference}</span>
        </p>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Montant du solde (70%)</span>
            <span className="text-2xl font-bold text-green-700">
              {mission.balanceAmount}€
            </span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-sm text-gray-500">
              Total de la prestation
            </span>
            <span className="text-sm text-gray-600">{mission.amount}€</span>
          </div>
        </div>

        <p className="text-sm font-medium text-gray-700 mb-3">
          Moyen de paiement reçu :
        </p>
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => setMethod("CHEQUE")}
            className={`border-2 rounded-lg p-4 text-center font-medium transition-all ${
              method === "CHEQUE"
                ? "border-blue-600 bg-blue-50 text-blue-700"
                : "border-gray-200 hover:border-gray-300 text-gray-700"
            }`}
          >
            Chèque
          </button>
          <button
            onClick={() => setMethod("TPE")}
            className={`border-2 rounded-lg p-4 text-center font-medium transition-all ${
              method === "TPE"
                ? "border-blue-600 bg-blue-50 text-blue-700"
                : "border-gray-200 hover:border-gray-300 text-gray-700"
            }`}
          >
            TPE (carte)
          </button>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            onClick={() => method && onConfirm(method)}
            className="flex-1 bg-green-600 hover:bg-green-700"
            disabled={!method || loading}
          >
            {loading ? "Confirmation..." : "Confirmer"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function MissionsPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingMission, setConfirmingMission] = useState<Mission | null>(
    null,
  );
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "done">("pending");
  const router = useRouter();

  const getToken = () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("professionalToken");
  };

  const loadMissions = useCallback(async () => {
    const token = getToken();
    if (!token) {
      router.push("/professional/login");
      return;
    }

    try {
      const res = await fetch("/api/professional/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();

      if (res.status === 401 || !result.success) {
        router.push("/professional/login");
        return;
      }

      setMissions(result.data.myMissions ?? []);
    } catch {
      toast.error("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadMissions();
  }, [loadMissions]);

  const handleConfirmBalance = async (paymentMethod: "CHEQUE" | "TPE") => {
    if (!confirmingMission) return;
    const token = getToken();
    if (!token) return;

    setConfirmLoading(true);
    try {
      const res = await fetch(
        `/api/professional/booking/${confirmingMission.id}/confirm-balance`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ paymentMethod }),
        },
      );

      const result = await res.json();

      if (result.success) {
        toast.success(
          `Solde de ${result.data.balanceAmount}€ confirmé (${paymentMethod === "CHEQUE" ? "Chèque" : "TPE"})`,
        );
        setConfirmingMission(null);
        await loadMissions();
      } else {
        toast.error(result.error ?? "Erreur lors de la confirmation");
      }
    } catch {
      toast.error("Erreur de connexion");
    } finally {
      setConfirmLoading(false);
    }
  };

  const filteredMissions = missions.filter((m) => {
    if (filter === "pending") return !m.balance_paid;
    if (filter === "done") return m.balance_paid;
    return true;
  });

  const pendingCount = missions.filter((m) => !m.balance_paid).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-2 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mes Missions</h1>
              {pendingCount > 0 && (
                <p className="text-sm text-orange-600 font-medium">
                  {pendingCount} solde{pendingCount > 1 ? "s" : ""} à confirmer
                </p>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/professional/dashboard")}
            >
              Retour au dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filtres */}
        <div className="flex gap-2 mb-6">
          {(["all", "pending", "done"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                filter === f
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              {f === "all"
                ? "Toutes"
                : f === "pending"
                  ? "Solde à confirmer"
                  : "Solde confirmé"}
            </button>
          ))}
        </div>

        {/* Liste des missions */}
        {filteredMissions.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-500">
              {filter === "pending"
                ? "Aucun solde en attente de confirmation"
                : filter === "done"
                  ? "Aucun solde confirmé pour le moment"
                  : "Aucune mission"}
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredMissions.map((mission) => (
              <Card key={mission.id} className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-semibold text-gray-500">
                        {mission.reference}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                        {mission.service_type}
                      </span>
                    </div>

                    <p className="font-medium text-gray-900 mb-1">
                      {mission.customerName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {mission.location} — {mission.scheduledDate}
                    </p>

                    <div className="flex gap-4 mt-2">
                      <div>
                        <span className="text-xs text-gray-400">Total</span>
                        <p className="font-semibold text-gray-700">
                          {mission.amount}€
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-400">Solde 70%</span>
                        <p className="font-bold text-lg text-gray-900">
                          {mission.balanceAmount}€
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    {mission.balance_paid ? (
                      <div className="inline-flex flex-col items-end">
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-sm font-medium">
                          Solde confirmé
                        </span>
                        <span className="text-xs text-gray-400 mt-1">
                          {mission.balance_payment_method === "CHEQUE"
                            ? "Chèque"
                            : "TPE"}{" "}
                          •{" "}
                          {mission.balance_paid_at
                            ? new Date(
                                mission.balance_paid_at,
                              ).toLocaleDateString("fr-FR")
                            : ""}
                        </span>
                      </div>
                    ) : (
                      <Button
                        onClick={() => setConfirmingMission(mission)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        size="sm"
                      >
                        Solde encaissé
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Modal de confirmation */}
      {confirmingMission && (
        <ConfirmBalanceModal
          mission={confirmingMission}
          onConfirm={handleConfirmBalance}
          onClose={() => setConfirmingMission(null)}
          loading={confirmLoading}
        />
      )}
    </div>
  );
}
