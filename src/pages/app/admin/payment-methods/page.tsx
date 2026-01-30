import { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Grid,
  InputAdornment,
  IconButton,
  Tooltip,
} from "@mui/material";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import type { PaymentMethod } from "@/types/contribution";
import NiDollar from "@/icons/nexture/ni-dollar";
import NiCopy from "@/icons/nexture/ni-duplicate";

export default function PaymentMethodsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("payment_methods")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      setMethods(data || []);
    } catch (err: any) {
      console.error("Error fetching payment methods:", err);
      setError(err.message || "Failed to load payment methods");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (id: string, field: keyof PaymentMethod, value: string | boolean) => {
    setMethods((prev) =>
      prev.map((method) =>
        method.id === id ? { ...method, [field]: value } : method
      )
    );
    setSuccess(false);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      // Update all payment methods
      for (const method of methods) {
        const { error } = await supabase
          .from("payment_methods")
          .update({
            account_identifier: method.account_identifier,
            instructions: method.instructions,
            is_active: method.is_active,
          })
          .eq("id", method.id);

        if (error) throw error;
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error("Error saving payment methods:", err);
      setError(err.message || "Failed to save payment methods");
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = (text: string, methodName: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(methodName);
    setTimeout(() => setCopySuccess(null), 2000);
  };

  if (user?.role !== "admin") {
    return (
      <Box className="p-6">
        <Alert severity="error">
          You do not have permission to access this page. Admin access required.
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box className="flex justify-center items-center min-h-[400px]">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className="p-6 max-w-5xl mx-auto">
      <Box className="flex items-center gap-3 mb-6">
        <NiDollar size={32} className="text-primary" />
        <Box>
          <Typography variant="h1" component="h1" className="mb-0">
            Payment Methods
          </Typography>
          <Typography variant="body2" className="text-text-secondary">
            Configure payment addresses where users will send their contributions
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" className="mb-4" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" className="mb-4">
          Payment methods saved successfully!
        </Alert>
      )}

      <Grid container spacing={3}>
        {methods.map((method) => (
          <Grid size={{ xs: 12, md: 6 }} key={method.id}>
            <Card>
              <CardContent>
                <Box className="flex items-center justify-between mb-4">
                  <Typography variant="h6" className="font-semibold">
                    {method.name}
                  </Typography>
                  <Button
                    size="small"
                    variant={method.is_active ? "contained" : "outlined"}
                    color={method.is_active ? "success" : "inherit"}
                    onClick={() => handleChange(method.id, "is_active", !method.is_active)}
                  >
                    {method.is_active ? "Active" : "Inactive"}
                  </Button>
                </Box>

                <Box className="space-y-3">
                  <TextField
                    fullWidth
                    label={`${method.name} Address/Account`}
                    value={method.account_identifier || ""}
                    onChange={(e) => handleChange(method.id, "account_identifier", e.target.value)}
                    placeholder={
                      method.name === "CashApp"
                        ? "$YourCashTag"
                        : method.name === "Zelle"
                        ? "email@example.com or phone"
                        : "Bitcoin wallet address"
                    }
                    InputProps={{
                      endAdornment: method.account_identifier && (
                        <InputAdornment position="end">
                          <Tooltip title={copySuccess === method.name ? "Copied!" : "Copy"}>
                            <IconButton
                              size="small"
                              onClick={() => handleCopy(method.account_identifier || "", method.name)}
                            >
                              <NiCopy size={20} />
                            </IconButton>
                          </Tooltip>
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Instructions for Users"
                    value={method.instructions || ""}
                    onChange={(e) => handleChange(method.id, "instructions", e.target.value)}
                    placeholder="Enter any special instructions for users when sending payments..."
                  />
                </Box>

                {!method.is_active && (
                  <Alert severity="info" className="mt-3">
                    This payment method is inactive and won't be shown to users.
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box className="flex justify-end gap-3 mt-6">
        <Button variant="outlined" onClick={fetchPaymentMethods} disabled={saving}>
          Reset
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <CircularProgress size={20} className="mr-2" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </Box>
    </Box>
  );
}
