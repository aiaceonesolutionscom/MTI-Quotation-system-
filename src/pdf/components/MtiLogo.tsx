import path from "node:path";
import fs from "node:fs";
import { Image } from "@react-pdf/renderer";
import { DEFAULT_LOGO_DATA_URL } from "./logo-base64";

/**
 * Real MTI letterhead mark (gear + globe + "mTi" wordmark + tagline).
 *
 * Default logo is inlined as a base64 data URL so PDF generation works on
 * serverless platforms (Vercel) where `process.cwd()/public` files are not part
 * of the function bundle. CompanySettings.logoUrl can override it:
 *   - http(s)/data: URLs are used as-is.
 *   - A public-relative path is read locally when the file exists (dev/cPanel);
 *     on Vercel the default logo is used instead.
 */
function resolveLogoSrc(logoUrl: string | null): string {
  if (!logoUrl) return DEFAULT_LOGO_DATA_URL;
  if (logoUrl.startsWith("http") || logoUrl.startsWith("data:")) return logoUrl;
  if (process.env.VERCEL === "1") return DEFAULT_LOGO_DATA_URL;
  const filePath = path.join(process.cwd(), "public", logoUrl.replace(/^\//, ""));
  try {
    if (fs.existsSync(filePath)) return `data:image/png;base64,${fs.readFileSync(filePath, "base64")}`;
  } catch {
    // fall through to the default logo
  }
  return DEFAULT_LOGO_DATA_URL;
}

export function CompanyLogoImage({ src, size = 44 }: { src: string | null; size?: number }) {
  // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf's Image is a PDF primitive, not an HTML <img>; it has no alt prop.
  return <Image src={resolveLogoSrc(src)} style={{ width: size, height: size }} />;
}