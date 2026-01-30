import { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import { supabase } from "@/lib/supabase";

export default function Footer() {
  const [siteName, setSiteName] = useState("GoPcrg");
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const fetchSiteName = async () => {
      try {
        const { data } = await supabase
          .from("site_settings")
          .select("site_name")
          .limit(1)
          .single();

        if (data) setSiteName(data.site_name);
      } catch (error) {
        console.error("Error fetching site name:", error);
      }
    };

    fetchSiteName();
  }, []);

  return (
    <Box component="footer" className="flex h-10 items-center justify-center">
      <Typography variant="body2" className="text-text-secondary">
        All rights reserved © {siteName} {currentYear}
      </Typography>
    </Box>
  );
}
