import { ImageResponse } from "next/og";
export const alt = "Hunchlane: Give your idea a clearer next step";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default async function Image() {
  return new ImageResponse(
    <div style={{ display: "flex", width: "100%", height: "100%", background: "#f5f6f4", padding: 48, fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", width: "100%", borderRadius: 32, background: "white", padding: 64, color: "#23332e", border: "1px solid #dce5de" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 28, color: "#175d50", marginBottom: 36 }}>
          <svg width="44" height="44" viewBox="0 0 32 32"><path d="M10 23V9m0 7c7 0 12-4 12-7m-12 7c7 0 12 4 12 7" fill="none" stroke="#175d50" strokeWidth="2.2" strokeLinecap="round"/></svg>Hunchlane
        </div>
        <div style={{ display: "flex", fontSize: 64, lineHeight: 1.12, letterSpacing: -2 }}>Give your idea</div>
        <div style={{ display: "flex", fontSize: 64, lineHeight: 1.12, letterSpacing: -2 }}>a clearer <span style={{ color: "#175d50", marginLeft: 16 }}>next step.</span></div>
        <div style={{ display: "flex", fontSize: 25, color: "#5d6c63", marginTop: 32 }}>Explore alternatives. Follow the evidence. Find your angle.</div>
      </div>
    </div>, size,
  );
}
