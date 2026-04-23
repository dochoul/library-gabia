import { config } from "@/config";
import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

const PRETENDARD_CSS_URL =
  "https://static.hiworks.com/asp/common/font/pretendard/variable/typography.css";

type FontDefinition = {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 600;
  style: "normal";
};

let pretendardFontsPromise: Promise<FontDefinition[]> | null = null;

const fetchArrayBuffer = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return response.arrayBuffer();
};

const loadPretendardFonts = async () => {
  if (!pretendardFontsPromise) {
    pretendardFontsPromise = (async () => {
      const cssResponse = await fetch(PRETENDARD_CSS_URL);
      if (!cssResponse.ok) {
        throw new Error(
          `Failed to fetch Pretendard CSS: ${cssResponse.status}`
        );
      }

      const css = await cssResponse.text();
      const fontUrl = css.match(/url\((['"]?)([^'")]+)\1\)/)?.[2];
      if (!fontUrl) {
        throw new Error("Unable to find Pretendard font URL in CSS");
      }

      const data = await fetchArrayBuffer(
        new URL(fontUrl, PRETENDARD_CSS_URL).toString()
      );

      return [
        {
          name: "Pretendard",
          data,
          weight: 400 as const,
          style: "normal" as const,
        },
        {
          name: "Pretendard",
          data,
          weight: 600 as const,
          style: "normal" as const,
        },
      ];
    })();
  }

  return pretendardFontsPromise;
};

const loadFallbackFonts = async (): Promise<FontDefinition[]> => {
  const [regular, semibold] = await Promise.all([
    fetchArrayBuffer(
      new URL("fonts/IBMPlexSans-Regular.ttf", config.baseUrl).toString()
    ),
    fetchArrayBuffer(
      new URL("fonts/IBMPlexSans-SemiBold.ttf", config.baseUrl).toString()
    ),
  ]);

  return [
    {
      name: "IBMPlexSans",
      data: regular,
      weight: 400 as const,
      style: "normal" as const,
    },
    {
      name: "IBMPlexSans",
      data: semibold,
      weight: 600 as const,
      style: "normal" as const,
    },
  ];
};

const generateOpenGraphImage = async ({
  title,
  brandText,
}: {
  title: string;
  brandText?: string;
}) => {
  const fonts = await loadPretendardFonts().catch(async () =>
    loadFallbackFonts()
  );
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#ffffff",
          justifyContent: "space-between",
          fontWeight: "400",
          fontFamily: "Pretendard",
          color: "#212121",
          padding: "40px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              marginTop: "40px",
              fontSize: "96px",
              fontWeight: "600",
              lineHeight: "6rem",
              padding: "0 0 100px 0",
              letterSpacing: "-0.025em",
              color: "#212121",
              fontFamily: "Pretendard",
              lineClamp: 4,
            }}
          >
            {title}
          </div>
        </div>
        {brandText && (
          <div
            style={{
              fontSize: "32px",
              fontWeight: "900",
              color: "#212121",
              display: "flex",
              textAlign: "right",
              width: "100%",
              justifyContent: "flex-end",
            }}
          >
            {brandText}
          </div>
        )}
      </div>
    ),
    {
      width: 1200,
      height: 600,
      fonts,
    }
  );
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const title = searchParams.get("title");
  if (!title) {
    return new Response("Missing title", { status: 400 });
  }
  const brandText = searchParams.get("brand") || undefined;

  return generateOpenGraphImage({
    title,
    brandText,
  });
}
