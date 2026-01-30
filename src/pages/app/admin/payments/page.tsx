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
  Tabs,
  Tab,
  Badge,
  Avatar,
} from "@mui/material";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import type { Payment, Enrollment, Plan } from "@/types/contribution";
import NiReceipt from "@/icons/nexture/ni-receipt";
import NiCheck from "@/icons/nexture/ni-check";
import NiCross from "@/icons/nexture/ni-cross";

interface PaymentWithDetails extends Payment {
  user: { full_name: string; email: string };
  enrollment: Enrollment & {
    plan: Plan;
  };
}

export default function VerifyPaymentsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<PaymentWithDetails[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentWithDetails | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [rejectionNote, setRejectionNote] = useState("");
  const [processing, setProcessing] = useState(false);
  const [tabValue, setTabValue] = useState(0); // 0 = Pending, 1 = Approved, 2 = Rejected

  useEffect(() => {
    fetchPayments();
  }, [tabValue]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);

      const status = tabValue === 0 ? "PENDING" : tabValue === 1 ? "VERIFIED" : "REJECTED";

      const { data, error } = await supabase
        .from("payments")
        .select(`
          *,
          user:users!payments_user_id_fkey(full_name, email),
          enrollment:enrollments(
            plan:plans(contribution_amount)
          )
        `)
        .eq("status", status)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (err: any) {
      console.error("Error fetching payments:", err);
      setError(err.message || "Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (payment: PaymentWithDetails) => {
    try {
      setProcessing(true);
      setError(null);

      const { error } = await supabase
        .from("payments")
        .update({
          status: "VERIFIED",
          admin_notes: "Payment approved",
          verified_at: new Date().toISOString(),
          verified_by: user?.id,
        })
        .eq("id", payment.id);

      if (error) throw error;

      await fetchPayments();
      setDialogOpen(false);
      setSelectedPayment(null);
    } catch (err: any) {
      console.error("Error approving payment:", err);
      setError(err.message || "Failed to approve payment");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedPayment) return;

    try {
      setProcessing(true);
      setError(null);

      const { error } = await supabase
        .from("payments")
        .update({
          status: "REJECTED",
          admin_notes: rejectionNote || "Payment rejected",
          verified_at: new Date().toISOString(),
          verified_by: user?.id,
        })
        .eq("id", selectedPayment.id);

      if (error) throw error;

      await fetchPayments();
      setDialogOpen(false);
      setSelectedPayment(null);
      setRejectionNote("");
    } catch (err: any) {
      console.error("Error rejecting payment:", err);
      setError(err.message || "Failed to reject payment");
    } finally {
      setProcessing(false);
    }
  };

  const handleViewDetails = (payment: PaymentWithDetails) => {
    setSelectedPayment(payment);
    setDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
        <NiReceipt size={32} className="text-primary" />
        <Box>
          <Typography variant="h1" component="h1" className="mb-0">
            Verify Payments
          </Typography>
          <Typography variant="body2" className="text-text-secondary">
            Review and approve user payment submissions
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" className="mb-4" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card className="mb-4">
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab
            label={
              <Badge badgeContent={tabValue === 0 ? payments.length : 0} color="error">
                Pending
              </Badge>
            }
          />
          <Tab label="Verified" />
          <Tab label="Rejected" />
        </Tabs>
      </Card>

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
                  <TableCell>Amount</TableCell>
                  <TableCell>Payment Method</TableCell>
                  <TableCell>Transaction ID</TableCell>
                  <TableCell>Date Submitted</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <Box className="flex items-center gap-2">
                        <Avatar sx={{ width: 32, height: 32, fontSize: "0.875rem" }}>
                          {payment.user.full_name?.charAt(0) || "U"}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" className="font-medium">
                            {payment.user.full_name}
                          </Typography>
                          <Typography variant="caption" className="text-text-secondary">
                            {payment.user.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" className="font-semibold">
                        ${payment.amount}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={payment.payment_method_name} size="small" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" className="font-mono text-sm">
                        {payment.transaction_id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" className="text-text-secondary">
                        {formatDate(payment.created_at)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={payment.status}
                        size="small"
                        color={
                          payment.status === "VERIFIED"
                            ? "success"
                            : payment.status === "REJECTED"
                            ? "error"
                            : "warning"
                        }
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleViewDetails(payment)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {payments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" className="py-8">
                      <Typography variant="body2" className="text-text-secondary">
                        No {tabValue === 0 ? "pending" : tabValue === 1 ? "verified" : "rejected"} payments
                        to display.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Payment Details Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Payment Details</DialogTitle>
        <DialogContent>
          {selectedPayment && (
            <Box className="space-y-4 mt-2">
              <Box className="grid grid-cols-2 gap-4">
                <Box>
                  <Typography variant="caption" className="text-text-secondary">
                    User
                  </Typography>
                  <Typography variant="body1">
                    {selectedPayment.user.full_name}
                  </Typography>
                  <Typography variant="caption" className="text-text-secondary">
                    {selectedPayment.user.email}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" className="text-text-secondary">
                    Amount
                  </Typography>
                  <Typography variant="h6">${selectedPayment.amount}</Typography>
                </Box>
              </Box>

              <Box className="grid grid-cols-2 gap-4">
                <Box>
                  <Typography variant="caption" className="text-text-secondary">
                    Payment Method
                  </Typography>
                  <Typography variant="body1">
                    {selectedPayment.payment_method_name}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" className="text-text-secondary">
                    Transaction ID
                  </Typography>
                  <Typography variant="body1" className="font-mono">
                    {selectedPayment.transaction_id}
                  </Typography>
                </Box>
              </Box>

              <Box>
                <Typography variant="caption" className="text-text-secondary">
                  Submitted On
                </Typography>
                <Typography variant="body1">
                  {formatDate(selectedPayment.created_at)}
                </Typography>
              </Box>

              {selectedPayment.proof_url && (
                <Box>
                  <Typography variant="caption" className="text-text-secondary mb-2">
                    Payment Proof
                  </Typography>
                  <img
                    src={selectedPayment.proof_url}
                    alt="Payment proof"
                    className="max-w-full rounded-lg border"
                  />
                </Box>
              )}

              {selectedPayment.status === "PENDING" && (
                <Box className="mt-4">
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Rejection Note (optional)"
                    value={rejectionNote}
                    onChange={(e) => setRejectionNote(e.target.value)}
                    placeholder="Provide a reason for rejection..."
                  />
                </Box>
              )}

              {selectedPayment.admin_notes && (
                <Alert severity="info">
                  <Typography variant="caption">Admin Notes:</Typography>
                  <Typography variant="body2">{selectedPayment.admin_notes}</Typography>
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
          {selectedPayment?.status === "PENDING" && (
            <>
              <Button
                onClick={handleReject}
                color="error"
                variant="outlined"
                disabled={processing}
                startIcon={<NiCross size={18} />}
              >
                Reject
              </Button>
              <Button
                onClick={() => selectedPayment && handleApprove(selectedPayment)}
                color="success"
                variant="contained"
                disabled={processing}
                startIcon={<NiCheck size={18} />}
              >
                {processing ? <CircularProgress size={20} /> : "Approve"}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
