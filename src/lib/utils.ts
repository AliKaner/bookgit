import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getSiteUrl() {
  let url =
    process?.env?.NEXT_PUBLIC_SITE_URL ??
    process?.env?.NEXT_PUBLIC_VERCEL_URL ??
    "https://booktions.com";
    
  url = url.startsWith("http") ? url : `https://${url}`;
  // Ensure trailing slash is removed for consistency if concatenated with /path
  url = url.endsWith("/") ? url.slice(0, -1) : url;
  return url;
}
