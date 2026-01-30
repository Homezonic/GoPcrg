import { useState, useEffect } from "react";
import {
  Box,
  Card,
  Typography,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Avatar,
  LinearProgress,
} from "@mui/material";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import type { Enrollment, Plan } from "@/types/contribution";
import NiMoney from "@/icons/nexture/ni-money";
import NiCheck from "@/icons/nexture/ni-check";

interface EnrollmentWithDetails extends Enrollment {
  user: { full_name: string; email: string };
  plan: Plan;
  payment_count: number;
}

export default function PayoutsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [enrollments, setEnrollments] = useState<EnrollmentWithDetails[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedEnrollment, setSelectedEnrollment] = useState<EnrollmentWithDetails | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [payoutNote, setPayoutNote] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchMaturedEnrollments();
  }, []);

  const fetchMaturedEnrollments = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get all active enrollments that have reached maturity date
      const { data, error } = await supabase
        .from("enrollments")
        .select(`
          *,
          user:users(full_name, email),
          plan:plans(contribution_amount)
        `)
        .eq("status", "ACTIVE")
        .lte("maturity_date", new Date().toISOString())
        .order("maturity_date", { ascending: true });

      if (error) throw error;

      // For each enrollment, count approved payments
      const enrollmentsWithCounts = await Promise.all(
        (data || []).map(async (enrollment) => {
          const { count } = await supabase
            .from("payments")
            .select("*", { count: "exact", head: true })
            .eq("enrollment_id", enrollment.id)
            .eq("status", "APPROVED");

          return {
            ...enrollment,
            payment_count: count || 0,
          };
        })
      );

      setEnrollments(enrollmentsWithCounts);
    } catch (err: any) {
      console.error("Error fetching matured enrollments:", err);
      setError(err.message || "Failed to load matured enrollments");
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayout = async () => {
    if (!selectedEnrollment) return;

    try {
      setProcessing(true);
      setError(null);

      const { error } = await supabase
        .from("enrollments")
        .update({
          status: "PAID",
          payout_date: new Date().toISOString(),
          payout_processed_by: user?.id,
          payout_notes: payoutNote || "Payout processed",
        })
        .eq("id", selectedEnrollment.id);

      if (error) throw error;

      await fetchMaturedEnrollments();
      setDialogOpen(false);
      setSelectedEnrollment(null);
      setPayoutNote("");
    } catch (err: any) {
      console.error("Error processing payout:", err);
      setError(err.message || "Failed to process payout");
    } finally {
      setProcessing(false);
    }
  };

  const handleViewDetails = (enrollment: EnrollmentWithDetails) => {
    setSelectedEnrollment(enrollment);
    setDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const calculateTotalPayout = (enrollment: EnrollmentWithDetails) => {
    return enrollment.plan.contribution_amount * 50; // Assuming 50 participants
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

  return (
    <Box className="p-6 max-w-7xl mx-auto">
      <Box className="flex items-center gap-3 mb-6">
        <NiMoney size={32} className="text-primary" />
        <Box>
          <Typography variant="h1" component="h1" className="mb-0">
            Payouts
          </Typography>
          <Typography variant="body2" className="text-text-secondary">
            Process payouts for matured enrollments
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" className="mb-4" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box className="flex justify-center items-center min-h-[400px]">
          <CircularProgress />
        </Box>
      ) : (
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Plan</TableCell>
                  <TableCell>Enrolled</TableCell>
                  <TableCell>Matured</TableCell>
                  <TableCell>Payments</TableCell>
                  <TableCell>Payout Amount</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {enrollments.map((enrollment) => {
                  const totalPayout = calculateTotalPayout(enrollment);
                  const expectedPayments = enrollment.frequency === "DAILY" ?
                    Math.ceil((new Date(enrollment.maturity_date).getTime() - new Date(enrollment.enrollment_date).getTime()) / (1000 * 60 * 60 * 24)) :
                    Math.ceil((new Date(enrollment.maturity_date).getTime() - new Date(enrollment.enrollment_date).getTime()) / (1000 * 60 * 60 * 24 * 7));
                  const paymentProgress = (enrollment.payment_count / expectedPayments) * 100;

                  return (
                    <TableRow key={enrollment.id}>
                      <TableCell>
                        <Box className="flex items-center gap-2">
                          <Avatar sx={{ width: 32, height: 32, fontSize: "0.875rem" }}>
                            {enrollment.user.full_name?.charAt(0) || "U"}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" className="font-medium">
                              {enrollment.user.full_name}
                            </Typography>
                            <Typography variant="caption" className="text-text-secondary">
                              {enrollment.user.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" className="font-semibold">
                          ${enrollment.plan.contribution_amount}
                        </Typography>
                        <Chip
                          label={enrollment.frequency}
                          size="small"
                          className="mt-1"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" className="text-text-secondary">
                          {formatDate(enrollment.enrollment_date)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" className="text-text-secondary">
                          {formatDate(enrollment.maturity_date)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" className="mb-1">
                            {enrollment.payment_count} / {expectedPayments}
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(paymentProgress, 100)}
                            color={paymentProgress >= 100 ? "success" : "warning"}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="h6" className="text-success">
                          ${totalPayout.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          onClick={() => handleViewDetails(enrollment)}
                        >
                          Process Payout
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {enrollments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" className="py-8">
                      <Typography variant="body2" className="text-text-secondary">
                        No matured enrollments requiring payout at this time.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Payout Confirmation Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Process Payout</DialogTitle>
        <DialogContent>
          {selectedEnrollment && (
            <Box className="space-y-4 mt-2">
              <Alert severity="warning">
                You are about to mark this enrollment as paid. This action cannot be undone.
              </Alert>

              <Box className="grid grid-cols-2 gap-4">
                <Box>
                  <Typography variant="caption" className="text-text-secondary">
                    User
                  </Typography>
                  <Typography variant="body1">
                    {selectedEnrollment.user.full_name}
                  </Typography>
                  <Typography variant="caption" className="text-text-secondary">
                    {selectedEnrollment.user.email}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" className="text-text-secondary">
                    Plan
                  </Typography>
                  <Typography variant="body1">
                    ${selectedEnrollment.plan.contribution_amount} {selectedEnrollment.plan.frequency}
                  </Typography>
                </Box>
              </Box>

              <Box>
                <Typography variant="caption" className="text-text-secondary">
                  Total Payout Amount
                </Typography>
                <Typography variant="h5" className="text-success">
                  ${calculateTotalPayout(selectedEnrollment).toLocaleString()}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" className="text-text-secondary">
                  Approved Payments
                </Typography>
                <Typography variant="body1">
                  {selectedEnrollment.payment_count} payments received
                </Typography>
              </Box>

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Payout Notes (optional)"
                value={payoutNote}
                onChange={(e) => setPayoutNote(e.target.value)}
                placeholder="Add any notes about this payout..."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleProcessPayout}
            color="success"
            variant="contained"
            disabled={processing}
            startIcon={<NiCheck size={18} />}
          >
            {processing ? <CircularProgress size={20} /> : "Confirm Payout"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
