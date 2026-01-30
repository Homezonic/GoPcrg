import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  TimelineOppositeContent,
  TimelineSeparator,
} from "@mui/lab";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import type { Enrollment, Payment, PaymentMethod } from "@/types/contribution";

interface PaymentWithMethod extends Payment {
  payment_method?: PaymentMethod;
}

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [payments, setPayments] = useState<PaymentWithMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && id) {
      fetchEnrollmentDetails();
    }
  }, [user, id]);

  const fetchEnrollmentDetails = async () => {
    try {
      // Fetch enrollment with plan details
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from("enrollments")
        .select("*, plan:plans(*)")
        .eq("id", id)
        .eq("user_id", user!.id)
        .single();

      if (enrollmentError) throw enrollmentError;
      setEnrollment(enrollmentData);

      // Fetch payments with payment method details
      const { data: paymentsData, error: paymentsError } = await supabase
        .from("payments")
        .select("*, payment_method:payment_methods(*)")
        .eq("enrollment_id", id)
        .order("payment_date", { ascending: false });

      if (paymentsError) throw paymentsError;
      setPayments(paymentsData || []);
    } catch (err: any) {
      console.error("Error fetching enrollment details:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadReceipt = (payment: PaymentWithMethod) => {
    const receiptContent = `
===========================================
       GOPCRG CONTRIBUTION RECEIPT
===========================================

Receipt ID: ${payment.id}
Date: ${new Date(payment.payment_date).toLocaleDateString()}

CONTRIBUTOR INFORMATION
-----------------------------------------
Name: ${user?.full_name || user?.email}
User ID: ${user?.id}

CONTRIBUTION DETAILS
-----------------------------------------
Plan: ${enrollment?.plan?.name}
Contribution Amount: $${payment.amount.toLocaleString()}
Payment Method: ${payment.payment_method?.name || "N/A"}
Account: ${payment.payment_method?.account_identifier || "N/A"}

STATUS
-----------------------------------------
Payment Status: ${payment.status}
${payment.verified_by ? `Verified By Admin: ${payment.verified_by}` : ""}
${payment.notes ? `Notes: ${payment.notes}` : ""}

ENROLLMENT SUMMARY
-----------------------------------------
Frequency: ${enrollment?.frequency}
Expected Payout: $${enrollment?.payout_amount.toLocaleString()}
Maturity Date: ${enrollment?.maturity_date ? new Date(enrollment.maturity_date).toLocaleDateString() : ""}

===========================================
        Thank you for your contribution!
           Visit: https://gopcrg.com
===========================================
    `;

    const blob = new Blob([receiptContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `GoPcrg-Receipt-${payment.id.substring(0, 8)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadCertificate = () => {
    if (!enrollment) return;

    const totalContributed = payments
      .filter((p) => p.status === "VERIFIED")
      .reduce((sum, p) => sum + p.amount, 0);

    const certificateContent = `
═══════════════════════════════════════════════════════════════
                    CERTIFICATE OF CONTRIBUTION
═══════════════════════════════════════════════════════════════

                           GOPCRG PLATFORM
                    Rotating Savings & Credit Association

This is to certify that

                        ${user?.full_name || user?.email}

has successfully participated in the ${enrollment.plan?.name} contribution plan.

CONTRIBUTION SUMMARY
───────────────────────────────────────────────────────────────
Enrollment Date:        ${new Date(enrollment.enrollment_date).toLocaleDateString()}
Contribution Frequency: ${enrollment.frequency}
Amount Per Payment:     $${enrollment.contribution_amount.toLocaleString()}
Total Contributed:      $${totalContributed.toLocaleString()}
Multiplier:            × ${enrollment.multiplier}
Expected Payout:        $${enrollment.payout_amount.toLocaleString()}
Maturity Date:          ${new Date(enrollment.maturity_date).toLocaleDateString()}
Current Status:         ${enrollment.status}

VERIFICATION
───────────────────────────────────────────────────────────────
Verified Payments: ${payments.filter((p) => p.status === "VERIFIED").length}
Total Payments:    ${payments.length}
Enrollment ID:     ${enrollment.id}

═══════════════════════════════════════════════════════════════
              Generated on ${new Date().toLocaleDateString()}
                    https://gopcrg.com
═══════════════════════════════════════════════════════════════
    `;

    const blob = new Blob([certificateContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `GoPcrg-Certificate-${enrollment.id.substring(0, 8)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Box className="flex min-h-screen items-center justify-center">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !enrollment) {
    return (
      <Grid container spacing={5}>
        <Grid size={12}>
          <Alert severity="error" onClose={() => navigate("/dashboard")}>
            {error || "Enrollment not found"}
          </Alert>
        </Grid>
      </Grid>
    );
  }

  const now = new Date();
  const maturityDate = new Date(enrollment.maturity_date);
  const enrollmentDate = new Date(enrollment.enrollment_date);
  const totalDays = Math.ceil((maturityDate.getTime() - enrollmentDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysElapsed = Math.ceil((now.getTime() - enrollmentDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(0, totalDays - daysElapsed);
  const progress = Math.min(100, (daysElapsed / totalDays) * 100);
  const isMatured = enrollment.status === "MATURED" || now >= maturityDate;

  const totalContributed = payments
    .filter((p) => p.status === "VERIFIED")
    .reduce((sum, p) => sum + p.amount, 0);
  const pendingAmount = payments
    .filter((p) => p.status === "PENDING")
    .reduce((sum, p) => sum + p.amount, 0);

  const getStatusColor = (status: string): "success" | "warning" | "error" | "grey" => {
    switch (status) {
      case "VERIFIED":
        return "success";
      case "PENDING":
        return "warning";
      case "REJECTED":
        return "error";
      default:
        return "grey";
    }
  };

  return (
    <Grid container spacing={5}>
      {/* Page Header */}
      <Grid container spacing={2.5} size={12}>
        <Grid size={{ xs: 12, md: "grow" }}>
          <Button variant="text" onClick={() => navigate("/dashboard")} className="mb-2">
            ← Back to Dashboard
          </Button>
          <Typography variant="h1">Enrollment Details</Typography>
          <Typography variant="body1" className="text-text-secondary mt-2">
            {enrollment.plan?.name} - {enrollment.frequency} Contribution
          </Typography>
        </Grid>
        <Grid size={{ xs: 12, md: "auto" }} className="flex gap-2">
          <Button variant="outlined" onClick={downloadCertificate}>
            Download Certificate
          </Button>
        </Grid>
      </Grid>

      {/* Overview Cards */}
      <Grid container spacing={3} size={12}>
        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="body2" className="text-text-secondary">
                Total Contributed
              </Typography>
              <Typography variant="h4" className="text-success">
                ${totalContributed.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="body2" className="text-text-secondary">
                Pending Verification
              </Typography>
              <Typography variant="h4" className="text-warning">
                ${pendingAmount.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="body2" className="text-text-secondary">
                Expected Payout
              </Typography>
              <Typography variant="h4" className="text-primary">
                ${enrollment.payout_amount.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="body2" className="text-text-secondary">
                Status
              </Typography>
              <Chip label={enrollment.status} color={getStatusColor(enrollment.status)} className="mt-2" />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Progress Section */}
      <Grid size={12}>
        <Card>
          <CardContent className="flex flex-col gap-4">
            <Typography variant="h5">Contribution Progress</Typography>
            <Box>
              <Box className="mb-1 flex justify-between">
                <Typography variant="body2" className="text-text-secondary">
                  {isMatured ? "🎉 Matured!" : `⏱️ ${daysRemaining} days to maturity`}
                </Typography>
                <Typography variant="body2" className="font-semibold">
                  {Math.round(progress)}%
                </Typography>
              </Box>
              <LinearProgress variant="determinate" value={progress} className="h-3 rounded" />
              <Box className="mt-2 flex justify-between">
                <Typography variant="caption" className="text-text-secondary">
                  Started: {enrollmentDate.toLocaleDateString()}
                </Typography>
                <Typography variant="caption" className="text-text-secondary">
                  Matures: {maturityDate.toLocaleDateString()}
                </Typography>
              </Box>
            </Box>

            <Divider />

            <Box className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <Box>
                <Typography variant="body2" className="text-text-secondary">
                  Contribution
                </Typography>
                <Typography variant="h6">
                  ${enrollment.contribution_amount.toLocaleString()}/{enrollment.frequency === "DAILY" ? "day" : "week"}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" className="text-text-secondary">
                  Multiplier
                </Typography>
                <Typography variant="h6">× {enrollment.multiplier}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" className="text-text-secondary">
                  Days Elapsed
                </Typography>
                <Typography variant="h6">{daysElapsed} days</Typography>
              </Box>
              <Box>
                <Typography variant="body2" className="text-text-secondary">
                  Verified Payments
                </Typography>
                <Typography variant="h6">
                  {payments.filter((p) => p.status === "VERIFIED").length} / {payments.length}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Payment Timeline */}
      <Grid size={{ xs: 12, lg: 6 }}>
        <Card className="h-full">
          <CardContent>
            <Typography variant="h5" className="mb-4">
              Payment Timeline
            </Typography>
            {payments.length === 0 ? (
              <Typography variant="body1" className="text-text-secondary text-center py-8">
                No payments submitted yet
              </Typography>
            ) : (
              <Timeline position="right">
                {payments.map((payment, index) => (
                  <TimelineItem key={payment.id}>
                    <TimelineOppositeContent color="text.secondary">
                      {new Date(payment.payment_date).toLocaleDateString()}
                    </TimelineOppositeContent>
                    <TimelineSeparator>
                      <TimelineDot color={getStatusColor(payment.status)} />
                      {index < payments.length - 1 && <TimelineConnector />}
                    </TimelineSeparator>
                    <TimelineContent>
                      <Box className="mb-4">
                        <Box className="flex items-center gap-2">
                          <Typography variant="h6">${payment.amount.toLocaleString()}</Typography>
                          <Chip label={payment.status} size="small" color={getStatusColor(payment.status)} />
                        </Box>
                        <Typography variant="body2" className="text-text-secondary">
                          {payment.payment_method?.name || "Unknown Method"}
                        </Typography>
                        {payment.notes && (
                          <Typography variant="body2" className="text-text-secondary mt-1">
                            Note: {payment.notes}
                          </Typography>
                        )}
                        {payment.status === "VERIFIED" && (
                          <Button size="small" variant="text" onClick={() => downloadReceipt(payment)} className="mt-1">
                            Download Receipt
                          </Button>
                        )}
                      </Box>
                    </TimelineContent>
                  </TimelineItem>
                ))}
              </Timeline>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Payment History Table */}
      <Grid size={{ xs: 12, lg: 6 }}>
        <Card className="h-full">
          <CardContent>
            <Typography variant="h5" className="mb-4">
              Payment History
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Method</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-text-secondary">
                        No payments yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                        <TableCell>${payment.amount.toLocaleString()}</TableCell>
                        <TableCell>{payment.payment_method?.name || "N/A"}</TableCell>
                        <TableCell>
                          <Chip label={payment.status} size="small" color={getStatusColor(payment.status)} />
                        </TableCell>
                        <TableCell>
                          {payment.proof_screenshot_url && (
                            <Button
                              size="small"
                              variant="text"
                              href={payment.proof_screenshot_url}
                              target="_blank"
                            >
                              View Proof
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
