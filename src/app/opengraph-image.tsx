import { ImageResponse } from "next/og";

export const alt = "Express Quote - Déménagement et nettoyage professionnel";
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
          backgroundImage: "linear-gradient(to bottom right, #10B981, #3B82F6)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          padding: "40px 80px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 70,
            fontWeight: "bold",
            marginBottom: 30,
            lineHeight: 1.2,
          }}
        >
          Express Quote
        </div>
        <div
          style={{
            fontSize: 36,
            marginBottom: 30,
            lineHeight: 1.3,
          }}
        >
          Déménagement & Nettoyage Professionnel
        </div>
        <div
          style={{
            fontSize: 24,
            opacity: 0.9,
          }}
        >
          Obtenez un devis instantané pour vos projets
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
} 