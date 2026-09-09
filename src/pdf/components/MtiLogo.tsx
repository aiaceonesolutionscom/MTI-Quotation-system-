import fs from "node:fs";
import path from "node:path";
import { Image } from "@react-pdf/renderer";

const DEFAULT_LOGO_PATH = path.join(process.cwd(), "public", "logo.png");

function resolveLogoSrc(logoUrl: string | null): string | Buffer {
  if (!logoUrl) return fs.readFileSync(DEFAULT_LOGO_PATH);
  if (logoUrl.startsWith("http") || logoUrl.startsWith("data:")) return logoUrl;
  return fs.readFileSync(path.join(process.cwd(), "public", logoUrl.replace(/^\//, "")));
}

/**
 * Real MTI letterhead mark (gear + globe + "mTi" wordmark + tagline), bundled at
 * public/logo.png. CompanySettings.logoUrl can override it with a different
 * uploaded image (a public-relative path or an absolute/data URL). Local files are
 * read into a Buffer rather than passed as a path string — react-pdf's Image
 * resolves string sources via fetch(), which can't read a Windows filesystem path.
 */
export function CompanyLogoImage({ src, size = 44 }: { src: string | null; size?: number }) {
  // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf's Image is a PDF primitive, not an HTML <img>; it has no alt prop.
  return <Image src={resolveLogoSrc(src)} style={{ width: size, height: size }} />;
}
