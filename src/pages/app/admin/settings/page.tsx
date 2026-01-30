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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from "@mui/material";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import type { SiteSettings, CustomScript } from "@/types/contribution";
import NiSettings from "@/icons/nexture/ni-settings";
import NiMinus from "@/icons/nexture/ni-minus";
import NiPen from "@/icons/nexture/ni-pen";
import NiPlus from "@/icons/nexture/ni-plus";

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [settings, setSettings] = useState<SiteSettings>({
    id: "",
    site_name: "",
    site_icon_url: null,
    support_whatsapp: null,
    support_email: null,
    custom_scripts: null,
    created_at: "",
    updated_at: "",
  });
  const [scriptDialog, setScriptDialog] = useState<{
    open: boolean;
    script: { id: string; name: string; script: string; enabled: boolean; position: 'head' | 'body' } | null;
  }>({ open: false, script: null });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .limit(1)
        .single();

      if (error) throw error;

      if (data) {
        setSettings(data);
      }
    } catch (err: any) {
      console.error("Error fetching settings:", err);
      setError(err.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof SiteSettings) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSettings((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
    setSuccess(false);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const { error } = await supabase
        .from("site_settings")
        .update({
          site_name: settings.site_name,
          site_icon_url: settings.site_icon_url,
          support_whatsapp: settings.support_whatsapp,
          support_email: settings.support_email,
          custom_scripts: settings.custom_scripts,
        })
        .eq("id", settings.id);

      if (error) throw error;

      setSuccess(true);

      // Update document title
      document.title = settings.site_name;

      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error("Error saving settings:", err);
      setError(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleAddScript = () => {
    setScriptDialog({
      open: true,
      script: {
        id: crypto.randomUUID(),
        name: "",
        script: "",
        enabled: true,
        position: "body",
      },
    });
  };

  const handleEditScript = (script: CustomScript) => {
    setScriptDialog({ open: true, script: { ...script } });
  };

  const handleDeleteScript = (scriptId: string) => {
    setSettings((prev) => ({
      ...prev,
      custom_scripts: (prev.custom_scripts || []).filter((s) => s.id !== scriptId),
    }));
  };

  const handleSaveScript = () => {
    if (!scriptDialog.script) return;

    const scripts = settings.custom_scripts || [];
    const existingIndex = scripts.findIndex((s) => s.id === scriptDialog.script!.id);

    if (existingIndex >= 0) {
      // Update existing
      scripts[existingIndex] = scriptDialog.script;
    } else {
      // Add new
      scripts.push(scriptDialog.script);
    }

    setSettings((prev) => ({
      ...prev,
      custom_scripts: [...scripts],
    }));

    setScriptDialog({ open: false, script: null });
  };

  const handleToggleScript = (scriptId: string) => {
    setSettings((prev) => ({
      ...prev,
      custom_scripts: (prev.custom_scripts || []).map((s) =>
        s.id === scriptId ? { ...s, enabled: !s.enabled } : s
      ),
    }));
  };

  // Check if user is admin
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
      <Box className="flex justify-center items-center min-h-100">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className="p-6 max-w-4xl mx-auto">
      <Box className="flex items-center gap-3 mb-6">
        <NiSettings size={32} className="text-primary" />
        <Box>
          <Typography variant="h1" component="h1" className="mb-0">
            Site Settings
          </Typography>
          <Typography variant="body2" className="text-text-secondary">
            Manage your site branding and support contact information
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
          Settings saved successfully!
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Branding Section */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" className="mb-4 font-semibold">
                Branding
              </Typography>

              <Box className="space-y-4">
                <TextField
                  fullWidth
                  label="Site Name"
                  value={settings.site_name}
                  onChange={handleChange("site_name")}
                  helperText="This name will appear in the header and browser title"
                  required
                />

                <TextField
                  fullWidth
                  label="Site Icon URL"
                  value={settings.site_icon_url || ""}
                  onChange={handleChange("site_icon_url")}
                  helperText="URL to your site's favicon (optional)"
                  placeholder="https://example.com/icon.png"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Support Contact Section */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" className="mb-4 font-semibold">
                Support Contact Information
              </Typography>

              <Box className="space-y-4">
                <TextField
                  fullWidth
                  label="WhatsApp Number"
                  value={settings.support_whatsapp || ""}
                  onChange={handleChange("support_whatsapp")}
                  helperText="Include country code (e.g., +1234567890)"
                  placeholder="+1234567890"
                />

                <TextField
                  fullWidth
                  label="Support Email"
                  type="email"
                  value={settings.support_email || ""}
                  onChange={handleChange("support_email")}
                  helperText="Email address for support inquiries"
                  placeholder="support@example.com"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Custom Scripts Section */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Box className="flex items-center justify-between mb-4">
                <Typography variant="h6" className="font-semibold">
                  Custom Scripts
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<NiPlus />}
                  onClick={handleAddScript}
                >
                  Add Script
                </Button>
              </Box>

              <Typography variant="body2" className="text-text-secondary mb-4">
                Add custom JavaScript code for third-party integrations like chat widgets, analytics, etc.
              </Typography>

              {(!settings.custom_scripts || settings.custom_scripts.length === 0) ? (
                <Alert severity="info">
                  No custom scripts added yet. Click "Add Script" to embed third-party tools like Tawk.to, Google Analytics, etc.
                </Alert>
              ) : (
                <List>
                  {settings.custom_scripts.map((script) => (
                    <ListItem key={script.id} className="border-b">
                      <ListItemText
                        primary={
                          <Box className="flex items-center gap-2">
                            <Typography variant="body1" className="font-semibold">
                              {script.name}
                            </Typography>
                            <Chip
                              label={script.position}
                              size="small"
                              color={script.position === 'head' ? 'primary' : 'secondary'}
                            />
                            <Chip
                              label={script.enabled ? 'Enabled' : 'Disabled'}
                              size="small"
                              color={script.enabled ? 'success' : 'default'}
                            />
                          </Box>
                        }
                        secondary={
                          <Typography variant="caption" className="text-text-secondary">
                            {script.script.substring(0, 100)}{script.script.length > 100 ? '...' : ''}
                          </Typography>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Box className="flex items-center gap-1">
                          <Switch
                            checked={script.enabled}
                            onChange={() => handleToggleScript(script.id)}
                            size="small"
                          />
                          <IconButton
                            size="small"
                            onClick={() => handleEditScript(script)}
                          >
                            <NiPen size={20} />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteScript(script.id)}
                          >
                            <NiMinus size={20} />
                          </IconButton>
                        </Box>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Save Button */}
        <Grid size={{ xs: 12 }}>
          <Box className="flex justify-end gap-3">
            <Button
              variant="outlined"
              onClick={fetchSettings}
              disabled={saving}
            >
              Reset
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving || !settings.site_name}
            >
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
        </Grid>
      </Grid>

      {/* Script Dialog */}
      <Dialog
        open={scriptDialog.open}
        onClose={() => setScriptDialog({ open: false, script: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {scriptDialog.script?.name ? 'Edit Script' : 'Add Custom Script'}
        </DialogTitle>
        <DialogContent>
          <Box className="space-y-4 mt-2">
            <TextField
              fullWidth
              label="Script Name"
              value={scriptDialog.script?.name || ""}
              onChange={(e) =>
                setScriptDialog((prev) => ({
                  ...prev,
                  script: prev.script ? { ...prev.script, name: e.target.value } : null,
                }))
              }
              placeholder="e.g., Tawk.to Chat Widget"
              required
            />

            <FormControl fullWidth>
              <InputLabel>Position</InputLabel>
              <Select
                value={scriptDialog.script?.position || "body"}
                label="Position"
                onChange={(e) =>
                  setScriptDialog((prev) => ({
                    ...prev,
                    script: prev.script
                      ? { ...prev.script, position: e.target.value as 'head' | 'body' }
                      : null,
                  }))
                }
              >
                <MenuItem value="head">Head (before &lt;/head&gt;)</MenuItem>
                <MenuItem value="body">Body (before &lt;/body&gt;)</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="JavaScript Code"
              multiline
              rows={12}
              value={scriptDialog.script?.script || ""}
              onChange={(e) =>
                setScriptDialog((prev) => ({
                  ...prev,
                  script: prev.script ? { ...prev.script, script: e.target.value } : null,
                }))
              }
              placeholder="<script>&#10;  // Your JavaScript code here&#10;  console.log('Hello World');&#10;</script>"
              helperText="Paste the entire script tag including <script> tags"
              required
            />

            <FormControlLabel
              control={
                <Switch
                  checked={scriptDialog.script?.enabled || false}
                  onChange={(e) =>
                    setScriptDialog((prev) => ({
                      ...prev,
                      script: prev.script ? { ...prev.script, enabled: e.target.checked } : null,
                    }))
                  }
                />
              }
              label="Enable this script"
            />

            <Alert severity="warning">
              <Typography variant="body2">
                <strong>Warning:</strong> Only add scripts from trusted sources. Malicious scripts can compromise your site's security.
              </Typography>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScriptDialog({ open: false, script: null })}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveScript}
            disabled={!scriptDialog.script?.name || !scriptDialog.script?.script}
          >
            Save Script
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
