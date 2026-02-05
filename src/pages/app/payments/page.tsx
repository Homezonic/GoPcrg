import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import type { Payment } from "@/types/contribution";
import NiEyeOpen from "@/icons/nexture/ni-eye-open";

type PaymentWithDetails = Payment & {
  enrollment?: {
    plan?: {
      name: string;
    };
  };
  payment_method?: {
    name: string;
  };
};

export default function Page() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<PaymentWithDetails[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<PaymentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchPayments();
    }
  }, [user]);

  useEffect(() => {
    if (statusFilter === "ALL") {
      setFilteredPayments(payments);
    } else {
      setFilteredPayments(payments.filter((p) => p.status === statusFilter));
    }
  }, [statusFilter, payments]);

  const fetchPayments = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from("payments")
        .select(
          `
          *,
          enrollment:enrollments(
            plan:plans(name)
          ),
          payment_method:payment_methods(name)
        `
        )
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;
      setPayments(data || []);
      setFilteredPayments(data || []);
    } catch (err: any) {
      console.error("Error fetching payments:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "VERIFIED":
        return "success";
      case "PENDING":
        return "warning";
      case "REJECTED":
        return "error";
      default:
        return "default";
    }
  };

  const calculateTotals = () => {
    const total = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const verified = payments
      .filter((p) => p.status === "VERIFIED")
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const pending = payments
      .filter((p) => p.status === "PENDING")
      .reduce((sum, p) => sum + Number(p.amount), 0);

    return { total, verified, pending };
  };

  const totals = calculateTotals();

  if (loading) {
    return (
      <Box className="flex min-h-screen items-center justify-center">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Grid container spacing={5}>
      {/* Page Header */}
      <Grid container spacing={2.5} size={12}>
        <Grid size={{ xs: 12, md: "grow" }}>
          <Typography variant="h1">Payment History</Typography>
          <Typography variant="body1" className="text-text-secondary mt-2">
            View all your submitted payments and their verification status
          </Typography>
        </Grid>
      </Grid>

      {error && (
        <Grid size={12}>
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </Grid>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} size={12}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="body2" className="text-text-secondary">
                Total Submitted
              </Typography>
              <Typography variant="h4" className="mt-1">
                ${totals.total.toLocaleString()}
              </Typography>
              <Typography variant="caption" className="text-text-secondary">
                {payments.length} payment{payments.length !== 1 ? "s" : ""}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="body2" className="text-text-secondary">
                Verified
              </Typography>
              <Typography variant="h4" className="mt-1 text-success">
                ${totals.verified.toLocaleString()}
              </Typography>
              <Typography variant="caption" className="text-text-secondary">
                {payments.filter((p) => p.status === "VERIFIED").length} verified
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="body2" className="text-text-secondary">
                Pending Review
              </Typography>
              <Typography variant="h4" className="mt-1 text-warning">
                ${totals.pending.toLocaleString()}
              </Typography>
              <Typography variant="caption" className="text-text-secondary">
                {payments.filter((p) => p.status === "PENDING").length} pending
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Payments Table */}
      <Grid size={12}>
        <Card>
          <CardContent>
            <Box className="flex items-center justify-between mb-4">
              <Typography variant="h5">Payment Records</Typography>
              <FormControl size="small" className="min-w-40">
                <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <MenuItem value="ALL">All Status</MenuItem>
                  <MenuItem value="PENDING">Pending</MenuItem>
                  <MenuItem value="VERIFIED">Verified</MenuItem>
                  <MenuItem value="REJECTED">Rejected</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {filteredPayments.length === 0 ? (
              <Box className="text-center py-12">
                <Typography variant="body1" className="text-text-secondary">
                  No payments found
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Plan</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Method</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Proof</TableCell>
                      <TableCell>Notes</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(payment.payment_date).toLocaleDateString()}
                          </Typography>
                          <Typography variant="caption" className="text-text-secondary">
                            {new Date(payment.payment_date).toLocaleTimeString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {payment.enrollment?.plan?.name || "N/A"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" className="font-semibold">
                            ${Number(payment.amount).toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{payment.payment_method?.name || "N/A"}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={payment.status} color={getStatusColor(payment.status)} size="small" />
                        </TableCell>
                        <TableCell>
                          {payment.proof_screenshot_url ? (
                            <IconButton
                              size="small"
                              onClick={() => setSelectedImage(payment.proof_screenshot_url)}
                            >
                              <NiEyeOpen size="small" />
                            </IconButton>
                          ) : (
                            <Typography variant="caption" className="text-text-secondary">
                              No proof
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {payment.notes ? (
                            <Typography variant="body2" className="max-w-xs truncate">
                              {payment.notes}
                            </Typography>
                          ) : (
                            <Typography variant="caption" className="text-text-secondary">
                              -
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Image Preview Dialog */}
      <Dialog open={!!selectedImage} onClose={() => setSelectedImage(null)} maxWidth="md" fullWidth>
        <DialogTitle>Payment Proof</DialogTitle>
        <DialogContent>
          {selectedImage && (
            <Box className="flex justify-center">
              <img src={selectedImage} alt="Payment proof" className="max-w-full h-auto" />
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Grid>
  );
}
