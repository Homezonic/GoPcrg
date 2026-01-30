import { useState, useEffect } from "react";
import {
  Box,
  Card,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  InputAdornment,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
} from "@mui/material";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import type { Plan, FrequencyType } from "@/types/contribution";
import NiDocumentFull from "@/icons/nexture/ni-document-full";
import NiPlus from "@/icons/nexture/ni-plus";
import NiPen from "@/icons/nexture/ni-pen";
import NiCross from "@/icons/nexture/ni-cross";

export default function ManagePlansPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Partial<Plan> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .order("contribution_amount", { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (err: any) {
      console.error("Error fetching plans:", err);
      setError(err.message || "Failed to load plans");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (plan?: Plan) => {
    if (plan) {
      setEditingPlan(plan);
    } else {
      setEditingPlan({
        contribution_amount: 0,
        frequency: "DAILY",
        total_slots: 50,
        available_slots: 50,
        is_active: true,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingPlan(null);
  };

  const handleSave = async () => {
    if (!editingPlan) return;

    try {
      setSaving(true);
      setError(null);

      if (editingPlan.id) {
        // Update existing plan
        const { error } = await supabase
          .from("plans")
          .update({
            contribution_amount: editingPlan.contribution_amount,
            frequency: editingPlan.frequency,
            total_slots: editingPlan.total_slots,
            available_slots: editingPlan.available_slots,
            is_active: editingPlan.is_active,
          })
          .eq("id", editingPlan.id);

        if (error) throw error;
      } else {
        // Create new plan
        const { error } = await supabase.from("plans").insert({
          contribution_amount: editingPlan.contribution_amount,
          frequency: editingPlan.frequency,
          total_slots: editingPlan.total_slots,
          available_slots: editingPlan.available_slots,
          is_active: editingPlan.is_active,
        });

        if (error) throw error;
      }

      await fetchPlans();
      handleCloseDialog();
    } catch (err: any) {
      console.error("Error saving plan:", err);
      setError(err.message || "Failed to save plan");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (plan: Plan) => {
    try {
      const { error } = await supabase
        .from("plans")
        .update({ is_active: !plan.is_active })
        .eq("id", plan.id);

      if (error) throw error;
      await fetchPlans();
    } catch (err: any) {
      console.error("Error toggling plan:", err);
      setError(err.message || "Failed to update plan");
    }
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
    <Box className="p-6 max-w-6xl mx-auto">
      <Box className="flex items-center justify-between mb-6">
        <Box className="flex items-center gap-3">
          <NiDocumentFull size={32} className="text-primary" />
          <Box>
            <Typography variant="h1" component="h1" className="mb-0">
              Manage Plans
            </Typography>
            <Typography variant="body2" className="text-text-secondary">
              Create and manage contribution plans
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<NiPlus size={20} />}
          onClick={() => handleOpenDialog()}
        >
          Add New Plan
        </Button>
      </Box>

      {error && (
        <Alert severity="error" className="mb-4" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Amount</TableCell>
                <TableCell>Frequency</TableCell>
                <TableCell>Total Slots</TableCell>
                <TableCell>Available</TableCell>
                <TableCell>Enrolled</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell>
                    <Typography variant="body1" className="font-semibold">
                      ${plan.contribution_amount}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={plan.frequency}
                      size="small"
                      color={plan.frequency === "DAILY" ? "primary" : "secondary"}
                    />
                  </TableCell>
                  <TableCell>{plan.total_slots}</TableCell>
                  <TableCell>{plan.available_slots}</TableCell>
                  <TableCell>{plan.total_slots - plan.available_slots}</TableCell>
                  <TableCell>
                    <Chip
                      label={plan.is_active ? "Active" : "Inactive"}
                      size="small"
                      color={plan.is_active ? "success" : "default"}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit Plan">
                      <IconButton size="small" onClick={() => handleOpenDialog(plan)}>
                        <NiPen size={18} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={plan.is_active ? "Deactivate" : "Activate"}>
                      <IconButton
                        size="small"
                        onClick={() => handleToggleActive(plan)}
                        color={plan.is_active ? "error" : "success"}
                      >
                        <NiCross size={18} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {plans.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" className="py-8">
                    <Typography variant="body2" className="text-text-secondary">
                      No plans created yet. Click "Add New Plan" to get started.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Add/Edit Plan Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingPlan?.id ? "Edit Plan" : "Add New Plan"}
        </DialogTitle>
        <DialogContent>
          <Box className="space-y-4 mt-2">
            <TextField
              fullWidth
              label="Contribution Amount"
              type="number"
              value={editingPlan?.contribution_amount || 0}
              onChange={(e) =>
                setEditingPlan((prev) => ({
                  ...prev,
                  contribution_amount: parseFloat(e.target.value),
                }))
              }
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />

            <FormControl fullWidth>
              <InputLabel>Frequency</InputLabel>
              <Select
                value={editingPlan?.frequency || "DAILY"}
                label="Frequency"
                onChange={(e) =>
                  setEditingPlan((prev) => ({
                    ...prev,
                    frequency: e.target.value as FrequencyType,
                  }))
                }
              >
                <MenuItem value="DAILY">Daily</MenuItem>
                <MenuItem value="WEEKLY">Weekly</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Total Slots"
              type="number"
              value={editingPlan?.total_slots || 50}
              onChange={(e) =>
                setEditingPlan((prev) => ({
                  ...prev,
                  total_slots: parseInt(e.target.value),
                  available_slots: prev?.id
                    ? prev.available_slots
                    : parseInt(e.target.value),
                }))
              }
              helperText="Maximum number of participants"
            />

            {editingPlan?.id && (
              <TextField
                fullWidth
                label="Available Slots"
                type="number"
                value={editingPlan?.available_slots || 0}
                onChange={(e) =>
                  setEditingPlan((prev) => ({
                    ...prev,
                    available_slots: parseInt(e.target.value),
                  }))
                }
                helperText="Number of open slots for enrollment"
              />
            )}

            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={editingPlan?.is_active ? "active" : "inactive"}
                label="Status"
                onChange={(e) =>
                  setEditingPlan((prev) => ({
                    ...prev,
                    is_active: e.target.value === "active",
                  }))
                }
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}>
            {saving ? <CircularProgress size={20} /> : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
