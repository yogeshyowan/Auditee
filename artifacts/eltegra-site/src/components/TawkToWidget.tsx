import { useEffect } from "react";

const TAWK_SRC = "https://embed.tawk.to/69fa40f4aaf1051c36970ddc/1jnsorfi8";

export function TawkToWidget() {
  useEffect(() => {
    if (document.getElementById("tawk-script")) return;
    const s0 = document.getElementsByTagName("script")[0];
    const s1 = document.createElement("script");
    s1.id = "tawk-script";
    s1.async = true;
    s1.src = TAWK_SRC;
    s1.charset = "UTF-8";
    s1.setAttribute("crossorigin", "*");
    s0.parentNode!.insertBefore(s1, s0);
  }, []);

  return null;
}
