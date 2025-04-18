import { ImageResponse } from "next/og";

export const alt = "Express Quote - Nos Services à la Carte";
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
          background: "linear-gradient(to bottom right, #0EA5E9, #10B981)",
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
          Nos Services à la Carte
        </div>
        <div
          style={{
            fontSize: 36,
            textAlign: "center",
          }}
        >
          Prestations sur mesure pour tous vos besoins
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
} 