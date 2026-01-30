import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";
import type { CustomScript } from "@/types/contribution";

export function CustomScripts() {
  const [scripts, setScripts] = useState<CustomScript[]>([]);

  useEffect(() => {
    // Fetch scripts from database
    const fetchScripts = async () => {
      const { data } = await supabase.from("site_settings").select("custom_scripts").single();

      if (data && data.custom_scripts) {
        setScripts(data.custom_scripts.filter((s: CustomScript) => s.enabled));
      }
    };

    fetchScripts();

    // Subscribe to changes
    const channel = supabase
      .channel("custom_scripts_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "site_settings",
        },
        (payload) => {
          if (payload.new && (payload.new as any).custom_scripts) {
            setScripts((payload.new as any).custom_scripts.filter((s: CustomScript) => s.enabled));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    // Clean up previously injected scripts
    const injectedScripts = document.querySelectorAll("[data-custom-script]");
    injectedScripts.forEach((script) => script.remove());

    // Inject new scripts
    scripts.forEach((scriptData) => {
      // Create a temporary div to parse the HTML
      const temp = document.createElement("div");
      temp.innerHTML = scriptData.script.trim();

      // Get all script tags from the parsed content
      const scriptElements = temp.querySelectorAll("script");

      scriptElements.forEach((originalScript) => {
        // Create a new script element
        const script = document.createElement("script");
        script.setAttribute("data-custom-script", scriptData.id);

        // Copy attributes
        Array.from(originalScript.attributes).forEach((attr) => {
          script.setAttribute(attr.name, attr.value);
        });

        // Copy script content
        if (originalScript.src) {
          script.src = originalScript.src;
        } else {
          script.textContent = originalScript.textContent;
        }

        // Append to the appropriate location
        if (scriptData.position === "head") {
          document.head.appendChild(script);
        } else {
          document.body.appendChild(script);
        }
      });
    });

    return () => {
      // Cleanup on unmount
      const injectedScripts = document.querySelectorAll("[data-custom-script]");
      injectedScripts.forEach((script) => script.remove());
    };
  }, [scripts]);

  return null;
}
