import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormLabel,
  Grid,
  Input,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Select,
  Tooltip,
  Typography,
} from "@mui/material";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import type { Enrollment, Payment, PaymentMethod } from "@/types/contribution";
import { LiveActivityFeed } from "@/components/layout/live-activity-feed";
import NiUploadCloud from "@/icons/nexture/ni-upload-cloud";
import NiMoneyBag from "@/icons/nexture/ni-money-bag";
import NiCalendar from "@/icons/nexture/ni-calendar";
import NiReceipt from "@/icons/nexture/ni-receipt";
import NiDollar from "@/icons/nexture/ni-dollar";

export default function Page() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPaid, setTotalPaid] = useState(0);

  useEffect(() => {
    if (user) {
      fetchEnrollments();
      fetchTotalPaid();
    }
  }, [user]);

  const fetchEnrollments = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('enrollments')
        .select('*, plan:plans(*)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setEnrollments(data || []);
    } catch (err: any) {
      console.error('Error fetching enrollments:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTotalPaid = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('payments')
        .select('amount')
        .eq('user_id', user!.id)
        .eq('status', 'VERIFIED');

      if (fetchError) throw fetchError;
      const total = data?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
      setTotalPaid(total);
    } catch (err: any) {
      console.error('Error fetching total paid:', err);
    }
  };

  const calculateStats = () => {
    const activeEnrollments = enrollments.filter(e => e.status === 'ACTIVE');
    const upcomingBalance = activeEnrollments.reduce((sum, e) => sum + e.payout_amount, 0);
    const nextMaturityDate = activeEnrollments
      .map(e => new Date(e.maturity_date))
      .sort((a, b) => a.getTime() - b.getTime())[0];

    return {
      balance: totalPaid,
      upcomingBalance,
      nextMaturityDate,
      activePlans: activeEnrollments.length,
    };
  };

  if (loading) {
    return (
      <Box className="flex min-h-screen items-center justify-center">
        <CircularProgress />
      </Box>
    );
  }

  if (enrollments.length === 0) {
    return (
      <Grid container spacing={5}>
        <Grid size={12}>
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-12">
              <Typography variant="h4">No Active Contributions</Typography>
              <Typography variant="body1" className="text-text-secondary">
                You haven't enrolled in any contribution plans yet.
              </Typography>
              <Button variant="contained" onClick={() => navigate('/plans')}>
                Browse Plans
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  }

  const stats = calculateStats();
  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <Grid container spacing={5}>
      {/* Page Header */}
      <Grid container spacing={2.5} size={12}>
        <Grid size={{ xs: 12, md: 'grow' }}>
          <Typography variant="h1" component="h1" className="mb-0">
            My Dashboard
          </Typography>
          <Typography variant="body2" className="text-text-secondary">
            Track your contributions and upcoming payouts
          </Typography>
        </Grid>
        <Grid size={{ xs: 12, md: 'auto' }}>
          <Button variant="contained" onClick={() => navigate('/plans')}>
            Join Another Plan
          </Button>
        </Grid>
      </Grid>

      {/* Stats Cards */}
      <Grid container spacing={2.5} size={12}>
        <Grid size={{ lg: 3, md: 6, xs: 12 }}>
          <Card className="flex flex-row items-center p-1">
            <Box className="bg-success-light/10 flex h-28 w-16 flex-none items-center justify-center rounded-2xl">
              <NiDollar className="text-success" size="large" />
            </Box>
            <CardContent>
              <Typography variant="body1" className="text-text-secondary leading-5">
                Balance
              </Typography>
              <Typography variant="h5" className="text-leading-5">
                {formatCurrency(stats.balance)}
              </Typography>
              <Typography variant="caption" className="text-text-secondary">
                Total paid
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ lg: 3, md: 6, xs: 12 }}>
          <Card className="flex flex-row items-center p-1">
            <Box className="bg-primary-light/10 flex h-28 w-16 flex-none items-center justify-center rounded-2xl">
              <NiMoneyBag className="text-primary" size="large" />
            </Box>
            <CardContent>
              <Typography variant="body1" className="text-text-secondary leading-5">
                Upcoming Balance
              </Typography>
              <Typography variant="h5" className="text-leading-5">
                {formatCurrency(stats.upcomingBalance)}
              </Typography>
              <Typography variant="caption" className="text-text-secondary">
                Expected payout
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ lg: 3, md: 6, xs: 12 }}>
          <Card className="flex flex-row items-center p-1">
            <Box className="bg-accent-1-light/10 flex h-28 w-16 flex-none items-center justify-center rounded-2xl">
              <NiCalendar className="text-accent-1" size="large" />
            </Box>
            <CardContent>
              <Typography variant="body1" className="text-text-secondary leading-5">
                Maturity Date
              </Typography>
              <Typography variant="h5" className="text-leading-5">
                {formatDate(stats.nextMaturityDate)}
              </Typography>
              <Typography variant="caption" className="text-text-secondary">
                Next payout
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ lg: 3, md: 6, xs: 12 }}>
          <Card className="flex flex-row items-center p-1">
            <Box className="bg-secondary-light/10 flex h-28 w-16 flex-none items-center justify-center rounded-2xl">
              <NiReceipt className="text-secondary" size="large" />
            </Box>
            <CardContent>
              <Typography variant="body1" className="text-text-secondary leading-5">
                Active Plans
              </Typography>
              <Typography variant="h5" className="text-leading-5">
                {stats.activePlans}
              </Typography>
              <Typography variant="caption" className="text-text-secondary">
                Enrollments
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {error && (
        <Grid size={12}>
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </Grid>
      )}

      {/* Main Content */}
      <Grid container spacing={3} size={12}>
        {/* Enrollments - Left Side */}
        <Grid container spacing={3} size={{ xs: 12, lg: 8 }}>
          {enrollments.map((enrollment) => (
            <EnrollmentCard
              key={enrollment.id}
              enrollment={enrollment}
              onRefresh={fetchEnrollments}
              totalEnrollments={enrollments.length}
            />
          ))}
        </Grid>

        {/* Live Activity Feed - Right Side */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <LiveActivityFeed />
        </Grid>
      </Grid>
    </Grid>
  );
}

interface EnrollmentCardProps {
  enrollment: Enrollment;
  onRefresh: () => void;
  totalEnrollments: number;
}

function EnrollmentCard({ enrollment, onRefresh, totalEnrollments }: EnrollmentCardProps) {
  const navigate = useNavigate();
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [supportDialogOpen, setSupportDialogOpen] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [showSchedule, setShowSchedule] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, [enrollment.id]);

  const fetchPayments = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('payments')
        .select('*')
        .eq('enrollment_id', enrollment.id)
        .order('payment_date', { ascending: false });

      if (fetchError) throw fetchError;
      setPayments(data || []);
    } catch (err: any) {
      console.error('Error fetching payments:', err);
    }
  };

  const now = new Date();
  const maturityDate = new Date(enrollment.maturity_date);
  const enrollmentDate = new Date(enrollment.enrollment_date);
  const totalDays = Math.ceil((maturityDate.getTime() - enrollmentDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysElapsed = Math.ceil((now.getTime() - enrollmentDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(0, totalDays - daysElapsed);
  const progress = Math.min(100, (daysElapsed / totalDays) * 100);
  const isMatured = enrollment.status === 'MATURED' || now >= maturityDate;

  // Calculate total contributed (verified payments only)
  const totalContributed = payments
    .filter(p => p.status === 'VERIFIED')
    .reduce((sum, p) => sum + p.amount, 0);

  // Calculate expected total based on frequency
  const daysSinceEnrollment = Math.ceil((now.getTime() - enrollmentDate.getTime()) / (1000 * 60 * 60 * 24));
  const expectedPayments = enrollment.frequency === 'DAILY'
    ? daysSinceEnrollment
    : Math.floor(daysSinceEnrollment / 7);
  const expectedTotal = Math.min(expectedPayments * enrollment.contribution_amount, enrollment.payout_amount / enrollment.multiplier);

  // Calculate next payment date
  const getNextPaymentDate = () => {
    if (isMatured) return null;

    const lastPayment = payments.find(p => p.status === 'VERIFIED');
    if (!lastPayment) {
      return enrollment.frequency === 'DAILY'
        ? new Date(enrollmentDate.getTime() + 24 * 60 * 60 * 1000)
        : new Date(enrollmentDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    }

    const lastPaymentDate = new Date(lastPayment.payment_date);
    return enrollment.frequency === 'DAILY'
      ? new Date(lastPaymentDate.getTime() + 24 * 60 * 60 * 1000)
      : new Date(lastPaymentDate.getTime() + 7 * 24 * 60 * 60 * 1000);
  };

  const nextPaymentDate = getNextPaymentDate();
  const daysUntilNextPayment = nextPaymentDate
    ? Math.ceil((nextPaymentDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // Generate payment schedule
  const getPaymentSchedule = () => {
    const schedule: { date: Date; isPaid: boolean; amount: number }[] = [];
    const interval = enrollment.frequency === 'DAILY' ? 1 : 7;
    let currentDate = new Date(enrollmentDate);

    while (currentDate <= maturityDate && schedule.length < 20) {
      const isPaid = payments.some(
        p => p.status === 'VERIFIED' &&
        Math.abs(new Date(p.payment_date).getTime() - currentDate.getTime()) < interval * 24 * 60 * 60 * 1000
      );

      schedule.push({
        date: new Date(currentDate),
        isPaid,
        amount: enrollment.contribution_amount,
      });

      currentDate = new Date(currentDate.getTime() + interval * 24 * 60 * 60 * 1000);
    }

    return schedule;
  };

  const getStatusColor = () => {
    switch (enrollment.status) {
      case 'ACTIVE':
        return 'primary';
      case 'MATURED':
        return 'success';
      case 'PAID':
        return 'default';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <>
      <Grid size={{ xs: 12, lg: totalEnrollments === 1 ? 12 : 6 }}>
        <Card className="h-full">
          <CardContent className="flex flex-col gap-4">
            {/* Header */}
            <Box className="flex items-center justify-between">
              <Box>
                <Typography variant="h5">{enrollment.plan?.name}</Typography>
                <Typography variant="body2" className="text-text-secondary">
                  {enrollment.frequency === 'DAILY' ? 'Daily' : 'Weekly'} Contribution
                </Typography>
              </Box>
              <Chip label={enrollment.status} color={getStatusColor()} />
            </Box>

            {/* Progress with countdown */}
            <Box>
              <Box className="flex justify-between mb-1">
                <Typography variant="body2" className="text-text-secondary">
                  {isMatured ? '🎉 Matured!' : `⏱️ ${daysRemaining} days to maturity`}
                </Typography>
                <Typography variant="body2" className="font-semibold">
                  {Math.round(progress)}%
                </Typography>
              </Box>
              <LinearProgress variant="determinate" value={progress} className="h-2 rounded" />
              <Box className="flex justify-between mt-1">
                <Typography variant="caption" className="text-text-secondary">
                  Started: {enrollmentDate.toLocaleDateString()}
                </Typography>
                <Typography variant="caption" className="text-text-secondary">
                  Matures: {maturityDate.toLocaleDateString()}
                </Typography>
              </Box>
            </Box>

            {/* Contribution Stats */}
            <Box className="grid grid-cols-2 gap-3">
              <Box>
                <Typography variant="body2" className="text-text-secondary">
                  Contribution
                </Typography>
                <Typography variant="h5" component="h5">
                  ${enrollment.contribution_amount.toLocaleString()}/{enrollment.frequency === 'DAILY' ? 'day' : 'week'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" className="text-text-secondary">
                  Total Contributed
                </Typography>
                <Tooltip title={`Expected: $${expectedTotal.toLocaleString()}`}>
                  <Typography variant="h5" component="h5" className={totalContributed >= expectedTotal ? 'text-success' : 'text-warning'}>
                    ${totalContributed.toLocaleString()}
                  </Typography>
                </Tooltip>
              </Box>
              <Box>
                <Typography variant="body2" className="text-text-secondary">
                  Multiplier
                </Typography>
                <Typography variant="h5" component="h5">× {enrollment.multiplier}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" className="text-text-secondary">
                  Expected Payout
                </Typography>
                <Typography variant="h5" component="h5" className="text-success">
                  ${enrollment.payout_amount.toLocaleString()}
                </Typography>
              </Box>
            </Box>

            {/* Next Payment Alert */}
            {!isMatured && nextPaymentDate && (
              <Alert severity={daysUntilNextPayment <= 0 ? 'error' : daysUntilNextPayment <= 2 ? 'warning' : 'info'}>
                <Typography variant="body2">
                  {daysUntilNextPayment <= 0
                    ? '⚠️ Payment overdue!'
                    : `📅 Next payment due in ${daysUntilNextPayment} day${daysUntilNextPayment !== 1 ? 's' : ''} (${nextPaymentDate.toLocaleDateString()})`
                  }
                </Typography>
              </Alert>
            )}

            {/* Payment Schedule Toggle */}
            <Button variant="text" size="small" onClick={() => setShowSchedule(!showSchedule)}>
              {showSchedule ? 'Hide' : 'Show'} Payment Schedule
            </Button>

            {/* Payment Schedule */}
            {showSchedule && (
              <Box className="border border-divider rounded-lg p-3 max-h-60 overflow-y-auto">
                <Typography variant="subtitle2" className="mb-2">Payment Schedule</Typography>
                <List dense>
                  {getPaymentSchedule().map((payment, index) => (
                    <ListItem key={index} className={payment.isPaid ? 'bg-success/10' : ''}>
                      <ListItemText
                        primary={
                          <Box className="flex justify-between items-center">
                            <Typography variant="body2">
                              {payment.isPaid ? '✅' : payment.date <= now ? '❌' : '⏳'} {payment.date.toLocaleDateString()}
                            </Typography>
                            <Typography variant="body2" className="font-semibold">
                              ${payment.amount.toLocaleString()}
                            </Typography>
                          </Box>
                        }
                        secondary={payment.isPaid ? 'Verified' : payment.date <= now ? 'Pending/Overdue' : 'Upcoming'}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            <Divider />

            {/* Actions */}
            <Box className="flex flex-col gap-2">
              <Button variant="outlined" fullWidth onClick={() => navigate(`/enrollments/${enrollment.id}`)}>
                View Details
              </Button>
              {enrollment.status === 'ACTIVE' && (
                <Button variant="contained" fullWidth onClick={() => setPaymentDialogOpen(true)}>
                  Submit Payment
                </Button>
              )}
              {isMatured && enrollment.status !== 'PAID' && (
                <Button variant="contained" color="success" fullWidth onClick={() => setSupportDialogOpen(true)}>
                  Request Withdrawal
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <PaymentDialog
        open={paymentDialogOpen}
        onClose={() => setPaymentDialogOpen(false)}
        enrollment={enrollment}
        onSuccess={() => {
          setPaymentDialogOpen(false);
          fetchPayments();
          onRefresh();
        }}
      />

      <SupportDialog open={supportDialogOpen} onClose={() => setSupportDialogOpen(false)} enrollment={enrollment} />
    </>
  );
}

interface PaymentDialogProps {
  open: boolean;
  onClose: () => void;
  enrollment: Enrollment;
  onSuccess: () => void;
}

function PaymentDialog({ open, onClose, enrollment, onSuccess }: PaymentDialogProps) {
  const { user } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [amount, setAmount] = useState(enrollment.contribution_amount);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchPaymentMethods();
    }
  }, [open]);

  const fetchPaymentMethods = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('is_active', true);

      if (fetchError) throw fetchError;
      setPaymentMethods(data || []);
    } catch (err: any) {
      console.error('Error fetching payment methods:', err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setScreenshot(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!selectedMethod || !screenshot || !user) {
      setError('Please select a payment method and upload a screenshot');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Upload screenshot
      const fileExt = screenshot.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(fileName, screenshot);

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('payment-proofs').getPublicUrl(fileName);

      // Create payment record
      const { error: paymentError } = await supabase.from('payments').insert({
        enrollment_id: enrollment.id,
        user_id: user.id,
        amount,
        payment_date: new Date().toISOString(),
        proof_screenshot_url: publicUrl,
        payment_method_id: selectedMethod,
        status: 'PENDING',
      });

      if (paymentError) throw paymentError;

      onSuccess();
    } catch (err: any) {
      console.error('Error submitting payment:', err);
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Submit Payment</DialogTitle>
      <DialogContent>
        <Box className="flex flex-col gap-4 pt-2">
          {error && <Alert severity="error">{error}</Alert>}

          <FormControl>
            <FormLabel>Payment Method</FormLabel>
            <Select value={selectedMethod} onChange={(e) => setSelectedMethod(e.target.value)}>
              {paymentMethods.map((method) => (
                <MenuItem key={method.id} value={method.id}>
                  <Box>
                    <Typography variant="body1">{method.name}</Typography>
                    <Typography variant="body2" className="text-text-secondary">
                      {method.account_identifier}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
            {selectedMethod && (
              <Typography variant="body2" className="text-text-secondary mt-1">
                {paymentMethods.find((m) => m.id === selectedMethod)?.instructions}
              </Typography>
            )}
          </FormControl>

          <FormControl>
            <FormLabel>Amount</FormLabel>
            <Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
          </FormControl>

          <FormControl>
            <FormLabel>Payment Proof (Screenshot)</FormLabel>
            <Button variant="outlined" component="label" startIcon={<NiUploadCloud />}>
              {screenshot ? screenshot.name : "Upload Screenshot"}
              <input type="file" hidden accept="image/*" onChange={handleFileChange} />
            </Button>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={uploading}>
          {uploading ? 'Submitting...' : 'Submit Payment'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

interface SupportDialogProps {
  open: boolean;
  onClose: () => void;
  enrollment: Enrollment;
}

function SupportDialog({ open, onClose, enrollment }: SupportDialogProps) {
  const whatsappMessage = encodeURIComponent(
    `Hello, I would like to request withdrawal for my ${enrollment.plan?.name} contribution. Expected payout: $${enrollment.payout_amount.toLocaleString()}`
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Request Withdrawal</DialogTitle>
      <DialogContent>
        <Box className="flex flex-col gap-4">
          <Typography variant="body1">
            Your contribution has matured! To request withdrawal of ${enrollment.payout_amount.toLocaleString()},
            please contact our support team:
          </Typography>

          <Box className="flex flex-col gap-2">
            <Button
              variant="contained"
              color="success"
              href={`https://wa.me/1234567890?text=${whatsappMessage}`}
              target="_blank"
            >
              Contact via WhatsApp
            </Button>
            <Button
              variant="outlined"
              href={`mailto:support@gopcrg.com?subject=Withdrawal Request&body=${whatsappMessage}`}
            >
              Send Email
            </Button>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
