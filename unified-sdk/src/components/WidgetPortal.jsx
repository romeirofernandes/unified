import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import styles from "../index.css?inline";

export default function WidgetPortal({ children }) {
  const [container, setContainer] = useState(null);
  useEffect(() => {
    const host = document.createElement("div");
    host.dataset.unifiedFeedbackHost = "";
    host.style.display = "contents";
    const shadow = host.attachShadow({ mode: "open" });
    document.body.append(host);
    setContainer(shadow);
    return () => host.remove();
  }, []);
  return container ? createPortal(<><style>{styles}</style>{children}</>, container) : null;
}
