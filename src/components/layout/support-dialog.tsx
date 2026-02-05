import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  CircularProgress,
  IconButton,
  Link,
} from "@mui/material";
import { supabase } from "@/lib/supabase";
import type { SiteSettings } from "@/types/contribution";
import NiPhoneHandset from "@/icons/nexture/ni-phone-handset";
import NiEmail from "@/icons/nexture/ni-email";
import NiCross from "@/icons/nexture/ni-cross";

interface SupportDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function SupportDialog({ open, onClose }: SupportDialogProps) {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      fetchSettings();
    }
  }, [open]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .limit(1)
        .single();

      if (error) throw error;
      setSettings(data);
    } catch (error) {
      console.error("Error fetching site settings:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle className="flex items-center justify-between">
        <Typography variant="h6" component="span">
          Contact Support
        </Typography>
        <IconButton onClick={onClose} size="small">
          <NiCross size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {loading ? (
          <Box className="flex justify-center py-8">
            <CircularProgress />
          </Box>
        ) : (
          <Box className="space-y-6 py-4">
            <Typography variant="body1" className="text-text-secondary mb-6">
              Need help? Get in touch with our support team through the following channels:
            </Typography>

            {settings?.support_whatsapp && (
              <Box className="flex items-start gap-4 p-4 bg-grey-25 rounded-lg">
                <Box className="flex-shrink-0 w-12 h-12 rounded-full bg-success flex items-center justify-center">
                  <NiPhoneHandset size={24} className="text-white" />
                </Box>
                <Box className="flex-1">
                  <Typography variant="subtitle2" className="font-semibold mb-1">
                    WhatsApp
                  </Typography>
                  <Link
                    href={`https://wa.me/${settings.support_whatsapp.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {settings.support_whatsapp}
                  </Link>
                  <Typography variant="body2" className="text-text-secondary mt-1">
                    Click to chat with us on WhatsApp
                  </Typography>
                </Box>
              </Box>
            )}

            {settings?.support_email && (
              <Box className="flex items-start gap-4 p-4 bg-grey-25 rounded-lg">
                <Box className="flex-shrink-0 w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                  <NiEmail size={24} className="text-white" />
                </Box>
                <Box className="flex-1">
                  <Typography variant="subtitle2" className="font-semibold mb-1">
                    Email
                  </Typography>
                  <Link
                    href={`mailto:${settings.support_email}`}
                    className="text-primary hover:underline"
                  >
                    {settings.support_email}
                  </Link>
                  <Typography variant="body2" className="text-text-secondary mt-1">
                    Send us an email and we'll respond within 24 hours
                  </Typography>
                </Box>
              </Box>
            )}

            {!settings?.support_whatsapp && !settings?.support_email && (
              <Box className="text-center py-8">
                <Typography variant="body1" className="text-text-secondary">
                  Support contact information is not available at the moment.
                  Please check back later.
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
