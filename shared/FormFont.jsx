import { useEffect } from "react";
import fonts from "./form-fonts.json";

export default function FormFont({ appearance }) {
  const font = fonts.includes(appearance?.font) ? appearance.font : "Inter";
  useEffect(() => {
    if (!font || document.querySelector(`link[data-form-font="${font}"]`))
      return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.dataset.formFont = font;
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font).replaceAll("%20", "+")}:wght@400;500;600;700&display=swap`;
    document.head.append(link);
  }, [font]);
  return null;
}
