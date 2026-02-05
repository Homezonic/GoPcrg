import { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import { supabase } from "@/lib/supabase";
import type { SiteSettings } from "@/types/contribution";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  classNameMobile?: string;
}

export default function Logo({ className, classNameMobile }: LogoProps = {}) {
  const [siteName, setSiteName] = useState("GoPcrg");

  useEffect(() => {
    fetchSiteName();

    // Subscribe to realtime updates
    const subscription = supabase
      .channel("site_settings_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "site_settings",
        },
        (payload) => {
          if (payload.new && typeof payload.new === "object" && "site_name" in payload.new) {
            setSiteName((payload.new as SiteSettings).site_name);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchSiteName = async () => {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("site_name")
        .limit(1)
        .single();

      if (error) throw error;
      if (data) {
        setSiteName(data.site_name);
        // Also update document title
        document.title = data.site_name;
      }
    } catch (error) {
      console.error("Error fetching site name:", error);
    }
  };

  return (
    <Box className={cn("flex flex-nowrap items-center gap-2", classNameMobile, className)}>
      {/* Icon/Symbol - Always visible */}
      <svg
        className="fill-current flex-shrink-0"
        width="22"
        height="27"
        viewBox="0 0 22 27"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M19.086 7.38373C22.9713 10.5251 22.9713 16.4749 19.086 19.6163L17.9088 20.5681C14.7542 23.1186 11.225 25.161 7.44727 26.6224C3.24497 28.2481 -1.00316 24.3606 0.21055 20.0001L1.26186 16.223C1.75761 14.4419 1.75761 12.5581 1.26186 10.777L0.210551 6.99993C-1.00315 2.63941 3.24497 -1.24808 7.44727 0.377558C11.225 1.83896 14.7542 3.88142 17.9088 6.43195L19.086 7.38373Z"
          fill="url(#paint0_linear_logo)"
        />
        <defs>
          <linearGradient id="paint0_linear_logo" x1="11" y1="0" x2="11" y2="27" gradientUnits="userSpaceOnUse">
            <stop style={{ stopColor: "hsl(var(--primary-light))" }} />
            <stop offset="1" style={{ stopColor: "hsl(var(--primary-dark))" }} />
          </linearGradient>
        </defs>
      </svg>

      {/* Site Name - Hidden on mobile, visible on desktop */}
      <Typography
        variant="h6"
        component="span"
        className="hidden md:inline-block font-bold text-text-primary whitespace-nowrap"
        sx={{ fontSize: "1.25rem", letterSpacing: "-0.02em" }}
      >
        {siteName}
      </Typography>
    </Box>
  );
}
