import { ImageResponse } from "next/og";
export const alt = "Hunchlane";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default async function Image() {
  return new ImageResponse(
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", background: "#f5f6f4", color: "#175d50", fontFamily: "sans-serif", fontSize: 104, fontWeight: 600, letterSpacing: -4 }}>
      hunchlane
    </div>, size,
  );
}
