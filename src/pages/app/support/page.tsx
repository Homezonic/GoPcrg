import { useState, useEffect } from "react";
import { Box, Typography, Card, CardContent, Grid, Button, Alert } from "@mui/material";
import { supabase } from "@/lib/supabase";
import type { SiteSettings } from "@/types/contribution";
import NiQuestionHexagon from "@/icons/nexture/ni-question-hexagon";
import NiMail from "@/icons/nexture/ni-email";
import NiPhone from "@/icons/nexture/ni-phone";

export default function SupportPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .limit(1)
        .single();

      if (error) throw error;
      setSettings(data);
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsApp = () => {
    if (settings?.support_whatsapp) {
      const phoneNumber = settings.support_whatsapp.replace(/\D/g, "");
      window.open(`https://wa.me/${phoneNumber}`, "_blank");
    }
  };

  const handleEmail = () => {
    if (settings?.support_email) {
      window.location.href = `mailto:${settings.support_email}`;
    }
  };

  if (loading) {
    return (
      <Box className="flex items-center justify-center min-h-screen">
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={5}>
      <Grid container spacing={2.5} size={12}>
        <Grid size={{ xs: 12, md: "grow" }}>
          <Box className="flex items-center gap-3">
            <NiQuestionHexagon size={32} className="text-primary" />
            <Box>
              <Typography variant="h1" component="h1" className="mb-0">
                Support
              </Typography>
              <Typography variant="body2" className="text-text-secondary">
                Need help? Contact us through any of the channels below
              </Typography>
            </Box>
          </Box>
        </Grid>
      </Grid>

      <Grid size={12}>
        <Alert severity="info">
          Our support team is here to help you with any questions or concerns about your contributions and payouts.
        </Alert>
      </Grid>

      <Grid container spacing={3} size={12}>
        {settings?.support_whatsapp && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent className="flex flex-col items-center gap-4 py-8">
                <Box className="bg-success-light/10 flex h-20 w-20 items-center justify-center rounded-full">
                  <NiPhone className="text-success" size="large" />
                </Box>
                <Typography variant="h6" className="font-semibold">
                  WhatsApp Support
                </Typography>
                <Typography variant="body2" className="text-text-secondary text-center">
                  Chat with us directly on WhatsApp for quick assistance
                </Typography>
                <Typography variant="body1" className="font-mono">
                  {settings.support_whatsapp}
                </Typography>
                <Button variant="contained" color="success" onClick={handleWhatsApp} fullWidth>
                  Open WhatsApp
                </Button>
              </CardContent>
            </Card>
          </Grid>
        )}

        {settings?.support_email && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent className="flex flex-col items-center gap-4 py-8">
                <Box className="bg-primary-light/10 flex h-20 w-20 items-center justify-center rounded-full">
                  <NiMail className="text-primary" size="large" />
                </Box>
                <Typography variant="h6" className="font-semibold">
                  Email Support
                </Typography>
                <Typography variant="body2" className="text-text-secondary text-center">
                  Send us an email and we'll get back to you within 24 hours
                </Typography>
                <Typography variant="body1" className="font-mono">
                  {settings.support_email}
                </Typography>
                <Button variant="contained" onClick={handleEmail} fullWidth>
                  Send Email
                </Button>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      <Grid size={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" className="mb-4">
              Frequently Asked Questions
            </Typography>
            <Box className="space-y-4">
              <Box>
                <Typography variant="subtitle2" className="font-semibold mb-1">
                  How do I make a payment?
                </Typography>
                <Typography variant="body2" className="text-text-secondary">
                  After enrolling in a plan, go to your Dashboard and click on your enrollment card. You'll see the
                  payment methods and can upload your payment proof after making the contribution.
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" className="font-semibold mb-1">
                  When will I receive my payout?
                </Typography>
                <Typography variant="body2" className="text-text-secondary">
                  Your payout will be available on the maturity date shown in your enrollment details. The admin will
                  process the payout once all payments are verified.
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" className="font-semibold mb-1">
                  What if I miss a payment?
                </Typography>
                <Typography variant="body2" className="text-text-secondary">
                  Please contact support immediately if you're unable to make a payment. Consistency is important for
                  the contribution system to work for all members.
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
