import { ImageResponse } from "next/og";
import { profile } from "@/content/site";

export const alt = `${profile.name}, ${profile.office}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#15532E",
          color: "#F6FAF4",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: "80px 96px",
        }}
      >
        <div
          style={{
            fontSize: 140,
            fontWeight: 700,
            letterSpacing: -3,
            lineHeight: 1,
            textTransform: "uppercase",
          }}
        >
          {profile.name}
        </div>
        <div
          style={{
            marginTop: 40,
            fontSize: 44,
            fontWeight: 500,
            opacity: 0.9,
          }}
        >
          {profile.office}
        </div>
      </div>
    ),
    { ...size },
  );
}
