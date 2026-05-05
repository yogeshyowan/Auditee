import { useEffect } from "react";

const TAWK_PROPERTY_ID = import.meta.env.VITE_TAWK_PROPERTY_ID as string | undefined;
const TAWK_WIDGET_ID = (import.meta.env.VITE_TAWK_WIDGET_ID as string | undefined) ?? "default";

export function TawkToWidget() {
  useEffect(() => {
    if (!TAWK_PROPERTY_ID) return;
    if (document.getElementById("tawk-script")) return;

    const s1 = document.createElement("script");
    s1.id = "tawk-script";
    s1.async = true;
    s1.src = `https://embed.tawk.to/${TAWK_PROPERTY_ID}/${TAWK_WIDGET_ID}`;
    s1.charset = "UTF-8";
    s1.setAttribute("crossorigin", "*");
    document.head.appendChild(s1);

    return () => {
      const el = document.getElementById("tawk-script");
      if (el) el.remove();
    };
  }, []);

  return null;
}
