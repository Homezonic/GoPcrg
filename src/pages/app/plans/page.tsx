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
  Grid,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';
import type { Plan, Settings, FrequencyType } from '@/types/contribution';

export default function Page() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    planId: string | null;
    frequency: FrequencyType | null;
    plan: Plan | null;
  }>({
    open: false,
    planId: null,
    frequency: null,
    plan: null,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch active plans
      const { data: plansData, error: plansError } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('contribution_amount', { ascending: true });

      if (plansError) throw plansError;

      // Fetch settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('settings')
        .select('*')
        .single();

      if (settingsError) throw settingsError;

      setPlans(plansData || []);
      setSettings(settingsData);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (planId: string, frequency: FrequencyType) => {
    if (!user || !settings) return;

    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;

    // Show confirmation dialog
    setConfirmDialog({
      open: true,
      planId,
      frequency,
      plan,
    });
  };

  const handleConfirmEnroll = async () => {
    if (!user || !settings || !confirmDialog.planId || !confirmDialog.frequency) return;

    setEnrolling(confirmDialog.planId);
    setError(null);
    setConfirmDialog({ open: false, planId: null, frequency: null, plan: null });

    try {
      const plan = plans.find((p) => p.id === confirmDialog.planId);
      if (!plan) throw new Error('Plan not found');

      const enrollmentDate = new Date();
      let maturityDate = new Date(enrollmentDate);

      // Calculate maturity date based on frequency
      if (confirmDialog.frequency === 'DAILY') {
        maturityDate.setDate(maturityDate.getDate() + settings.daily_maturity_weeks * 7);
      } else {
        maturityDate.setMonth(maturityDate.getMonth() + settings.weekly_maturity_months);
      }

      const multiplier = 50; // Default multiplier
      const payoutAmount = plan.contribution_amount * multiplier;

      const { error: enrollError } = await supabase.from('enrollments').insert({
        user_id: user.id,
        plan_id: confirmDialog.planId,
        frequency: confirmDialog.frequency,
        contribution_amount: plan.contribution_amount,
        multiplier,
        enrollment_date: enrollmentDate.toISOString(),
        maturity_date: maturityDate.toISOString(),
        payout_amount: payoutAmount,
        status: 'ACTIVE',
      });

      if (enrollError) throw enrollError;

      enqueueSnackbar('Successfully enrolled in plan!', { variant: 'success' });
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Error enrolling:', err);
      setError(err.message);
      enqueueSnackbar(err.message || 'Failed to enroll in plan', { variant: 'error' });
    } finally {
      setEnrolling(null);
    }
  };

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
        <Grid size={{ xs: 12, md: 'grow' }}>
          <Typography variant="h1">Select Your Contribution Plan</Typography>
          <Typography variant="body1" className="text-text-secondary mt-2">
            Choose a slot and contribution frequency. You'll receive your contribution × 50 at maturity.
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

      {/* Plans Grid */}
      <Grid container spacing={3} size={12}>
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            settings={settings}
            onEnroll={handleEnroll}
            enrolling={enrolling === plan.id}
          />
        ))}
      </Grid>

      {/* Disclaimer */}
      <Grid size={12}>
        <Alert severity="info">
          <Typography variant="subtitle2" className="font-semibold mb-1">
            Important Notice
          </Typography>
          <Typography variant="body2">
            This is NOT an investment and does not generate interest or profit. Members simply rotate access to pooled
            funds based on a pre-agreed schedule. You will receive exactly what you contributed multiplied by the
            number of participants (50).
          </Typography>
        </Alert>
      </Grid>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, planId: null, frequency: null, plan: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Enrollment</DialogTitle>
        <DialogContent>
          <Typography variant="body1" className="mb-3">
            Are you sure you want to enroll in this plan?
          </Typography>
          {confirmDialog.plan && (
            <Box className="space-y-2">
              <Typography variant="body2">
                <strong>Plan:</strong> ${confirmDialog.plan.contribution_amount} Contribution
              </Typography>
              <Typography variant="body2">
                <strong>Frequency:</strong> {confirmDialog.frequency}
              </Typography>
              <Typography variant="body2">
                <strong>Expected Payout:</strong> ${confirmDialog.plan.contribution_amount * 50}
              </Typography>
              {settings && (
                <Typography variant="body2">
                  <strong>Maturity Period:</strong>{' '}
                  {confirmDialog.frequency === 'DAILY'
                    ? `${settings.daily_maturity_weeks} weeks`
                    : `${settings.weekly_maturity_months} months`}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirmDialog({ open: false, planId: null, frequency: null, plan: null })}
            disabled={enrolling !== null}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmEnroll}
            variant="contained"
            disabled={enrolling !== null}
          >
            {enrolling !== null ? 'Enrolling...' : 'Confirm Enrollment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}

interface PlanCardProps {
  plan: Plan;
  settings: Settings | null;
  onEnroll: (planId: string, frequency: FrequencyType) => void;
  enrolling: boolean;
}

function PlanCard({ plan, settings, onEnroll, enrolling }: PlanCardProps) {
  const [frequency, setFrequency] = useState<FrequencyType>('DAILY');
  const [spotsLeft, setSpotsLeft] = useState(46);

  useEffect(() => {
    // Animate spots counter
    const timer1 = setTimeout(() => setSpotsLeft(48), 1000);
    const timer2 = setTimeout(() => setSpotsLeft(Math.floor(Math.random() * 4) + 2), 2000);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const multiplier = 50;
  const payoutAmount = plan.contribution_amount * multiplier;
  const maturityPeriod =
    frequency === 'DAILY'
      ? `${settings?.daily_maturity_weeks || 5} weeks`
      : `${settings?.weekly_maturity_months || 3} months`;

  return (
    <Grid size={{ xs: 12, md: 6, lg: 4 }}>
      <Card className="h-full hover:shadow-lg transition-shadow">
        <CardContent className="flex flex-col gap-4">
          {/* Plan Header */}
          <Box className="flex items-center justify-between">
            <Typography variant="h4" component="h2">
              {plan.name}
            </Typography>
            <Chip
              label={`${spotsLeft} spots left`}
              color="warning"
              size="small"
              className="animate-pulse"
            />
          </Box>

          {/* Contribution Amount */}
          <Box>
            <Typography variant="h2" component="div" className="text-primary">
              ${plan.contribution_amount.toLocaleString()}
            </Typography>
            <Typography variant="body2" className="text-text-secondary">
              per contribution
            </Typography>
          </Box>

          {/* Frequency Tabs */}
          <Tabs value={frequency} onChange={(_, val) => setFrequency(val)} variant="fullWidth">
            <Tab label="Daily" value="DAILY" />
            <Tab label="Weekly" value="WEEKLY" />
          </Tabs>

          {/* Details */}
          <Box className="flex flex-col gap-2 py-2">
            <Box className="flex justify-between">
              <Typography variant="body2" className="text-text-secondary">
                Contribute:
              </Typography>
              <Typography variant="body2" className="font-semibold">
                ${plan.contribution_amount} / {frequency === 'DAILY' ? 'day' : 'week'}
              </Typography>
            </Box>
            <Box className="flex justify-between">
              <Typography variant="body2" className="text-text-secondary">
                Maturity:
              </Typography>
              <Typography variant="body2" className="font-semibold">
                {maturityPeriod}
              </Typography>
            </Box>
            <Box className="flex justify-between">
              <Typography variant="body2" className="text-text-secondary">
                Multiplier:
              </Typography>
              <Typography variant="body2" className="font-semibold">
                × {multiplier}
              </Typography>
            </Box>
            <Box className="flex justify-between border-t pt-2 mt-2">
              <Typography variant="body1" className="font-semibold">
                Total Payout:
              </Typography>
              <Typography variant="h6" className="text-success">
                ${payoutAmount.toLocaleString()}
              </Typography>
            </Box>
          </Box>

          {/* Enroll Button */}
          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={() => onEnroll(plan.id, frequency)}
            disabled={enrolling}
          >
            {enrolling ? 'Enrolling...' : 'Enroll Now'}
          </Button>
        </CardContent>
      </Card>
    </Grid>
  );
}
