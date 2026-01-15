import { ImageResponse } from "next/og";

export const runtime = 'edge';

export const alt = "Express Quote - Tableau de bord des réservations";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 48,
          background: "linear-gradient(to bottom right, #10B981, #3B82F6)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          padding: "40px 80px",
        }}
      >
        <div
          style={{
            fontSize: 64,
            fontWeight: "bold",
            marginBottom: 32,
            textAlign: "center",
          }}
        >
          Tableau de bord des réservations
        </div>
        <div
          style={{
            fontSize: 36,
            textAlign: "center",
          }}
        >
          Suivez et gérez vos réservations avec Express Quote
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
} 