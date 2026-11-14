import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { pageMetadata } from "@/lib/seo";

export default function PageMetadata() {
  const { pathname } = useLocation();
  useEffect(() => {
    const page = pageMetadata(pathname);
    document.title = page.title;
    for (const [selector, content] of [
      ['meta[name="description"]', page.description],
      ['meta[name="robots"]', page.robots],
      ['meta[property="og:title"]', page.title],
      ['meta[property="og:description"]', page.description],
      ['meta[property="og:url"]', page.url],
      ['meta[name="twitter:title"]', page.title],
      ['meta[name="twitter:description"]', page.description],
    ]) document.querySelector(selector)?.setAttribute("content", content);
    document.querySelector('link[rel="canonical"]')?.setAttribute("href", page.url);
  }, [pathname]);
  return null;
}
