import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as yup from "yup";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  FormControl,
  FormLabel,
  Grid,
  Input,
  InputAdornment,
  IconButton,
  Switch,
  Typography,
} from "@mui/material";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { useNotifications } from "@/hooks/use-notifications";
import NiEyeClose from "@/icons/nexture/ni-eye-close";
import NiEyeOpen from "@/icons/nexture/ni-eye-open";

const profileValidationSchema = yup.object({
  full_name: yup.string().required("Full name is required").min(3, "At least 3 characters"),
  email: yup.string().required("Email is required").email("Enter a valid email"),
  phone: yup.string().nullable(),
});

const passwordValidationSchema = yup.object({
  currentPassword: yup.string().required("Current password is required"),
  newPassword: yup
    .string()
    .required("New password is required")
    .min(8, "At least 8 characters")
    .test("uppercase", "Must contain uppercase and lowercase", (value) => {
      return /[A-Z]/.test(value) && /[a-z]/.test(value);
    }),
  confirmPassword: yup
    .string()
    .required("Please confirm password")
    .oneOf([yup.ref("newPassword")], "Passwords must match"),
});

export default function Page() {
  const { user, updatePassword } = useAuth();
  const navigate = useNavigate();
  const { settings: notificationSettings, requestPermission } = useNotifications();
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleNotificationToggle = async () => {
    if (!notificationSettings.enabled) {
      const granted = await requestPermission();
      if (!granted) {
        alert("Please enable notifications in your browser settings to receive alerts.");
      }
    }
  };

  const profileFormik = useFormik({
    initialValues: {
      full_name: user?.full_name || "",
      email: user?.email || "",
      phone: user?.phone || "",
    },
    validationSchema: profileValidationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      try {
        setProfileError(null);
        setProfileSuccess(false);

        // Update user profile in users table
        const { error: updateError } = await supabase
          .from("users")
          .update({
            full_name: values.full_name,
            phone: values.phone,
          })
          .eq("id", user!.id);

        if (updateError) throw updateError;

        // Update auth email if changed
        if (values.email !== user?.email) {
          const { error: emailError } = await supabase.auth.updateUser({
            email: values.email,
          });
          if (emailError) throw emailError;
        }

        setProfileSuccess(true);
        setTimeout(() => setProfileSuccess(false), 5000);
      } catch (err: any) {
        console.error("Profile update error:", err);
        setProfileError(err.message || "Failed to update profile");
      }
    },
  });

  const passwordFormik = useFormik({
    initialValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    validationSchema: passwordValidationSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        setPasswordError(null);
        setPasswordSuccess(false);

        // Verify current password by trying to sign in
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: user!.email,
          password: values.currentPassword,
        });

        if (signInError) {
          throw new Error("Current password is incorrect");
        }

        // Update to new password
        await updatePassword(values.newPassword);

        setPasswordSuccess(true);
        resetForm();
        setTimeout(() => setPasswordSuccess(false), 5000);
      } catch (err: any) {
        console.error("Password update error:", err);
        setPasswordError(err.message || "Failed to update password");
      }
    },
  });

  if (!user) {
    return null;
  }

  return (
    <Grid container spacing={5}>
      {/* Page Header */}
      <Grid container spacing={2.5} size={12}>
        <Grid size={{ xs: 12, md: "grow" }}>
          <Typography variant="h1">Profile Settings</Typography>
          <Typography variant="body1" className="text-text-secondary mt-2">
            Manage your account information and security settings
          </Typography>
        </Grid>
      </Grid>

      {/* Account Information */}
      <Grid size={{ xs: 12, lg: 8 }}>
        <Card>
          <CardContent>
            <Typography variant="h5" className="mb-4">
              Account Information
            </Typography>

            <Box component="form" onSubmit={profileFormik.handleSubmit} className="flex flex-col gap-4">
              {profileSuccess && (
                <Alert severity="success">Profile updated successfully!</Alert>
              )}
              {profileError && <Alert severity="error">{profileError}</Alert>}

              <FormControl>
                <FormLabel>Full Name</FormLabel>
                <Input
                  id="full_name"
                  name="full_name"
                  value={profileFormik.values.full_name}
                  onChange={profileFormik.handleChange}
                  onBlur={profileFormik.handleBlur}
                  error={profileFormik.touched.full_name && Boolean(profileFormik.errors.full_name)}
                />
                {profileFormik.touched.full_name && profileFormik.errors.full_name && (
                  <Typography variant="caption" className="text-error mt-1">
                    {profileFormik.errors.full_name}
                  </Typography>
                )}
              </FormControl>

              <FormControl>
                <FormLabel>Email</FormLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={profileFormik.values.email}
                  onChange={profileFormik.handleChange}
                  onBlur={profileFormik.handleBlur}
                  error={profileFormik.touched.email && Boolean(profileFormik.errors.email)}
                />
                {profileFormik.touched.email && profileFormik.errors.email && (
                  <Typography variant="caption" className="text-error mt-1">
                    {profileFormik.errors.email}
                  </Typography>
                )}
                <Typography variant="caption" className="text-text-secondary mt-1">
                  Changing email may require verification
                </Typography>
              </FormControl>

              <FormControl>
                <FormLabel>Phone Number</FormLabel>
                <Input
                  id="phone"
                  name="phone"
                  value={profileFormik.values.phone}
                  onChange={profileFormik.handleChange}
                  onBlur={profileFormik.handleBlur}
                />
              </FormControl>

              <Box className="flex gap-2">
                <Button type="submit" variant="contained" disabled={profileFormik.isSubmitting}>
                  {profileFormik.isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => profileFormik.resetForm()}
                  disabled={profileFormik.isSubmitting}
                >
                  Cancel
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Account Details (Read-only) */}
      <Grid size={{ xs: 12, lg: 4 }}>
        <Card>
          <CardContent>
            <Typography variant="h5" className="mb-4">
              Account Details
            </Typography>

            <Box className="flex flex-col gap-3">
              <Box>
                <Typography variant="body2" className="text-text-secondary">
                  User ID
                </Typography>
                <Typography variant="body1" className="font-mono text-sm">
                  {user.id}
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Typography variant="body2" className="text-text-secondary">
                  Role
                </Typography>
                <Typography variant="body1" className="capitalize">
                  {user.role}
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Typography variant="body2" className="text-text-secondary">
                  Account Status
                </Typography>
                <Typography variant="body1" className={user.is_active ? "text-success" : "text-error"}>
                  {user.is_active ? "Active" : "Inactive"}
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Typography variant="body2" className="text-text-secondary">
                  Member Since
                </Typography>
                <Typography variant="body1">
                  {new Date(user.created_at).toLocaleDateString()}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Change Password */}
      <Grid size={{ xs: 12, lg: 8 }}>
        <Card>
          <CardContent>
            <Typography variant="h5" className="mb-4">
              Change Password
            </Typography>

            <Box component="form" onSubmit={passwordFormik.handleSubmit} className="flex flex-col gap-4">
              {passwordSuccess && (
                <Alert severity="success">Password updated successfully!</Alert>
              )}
              {passwordError && <Alert severity="error">{passwordError}</Alert>}

              <FormControl>
                <FormLabel>Current Password</FormLabel>
                <Input
                  id="currentPassword"
                  name="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  value={passwordFormik.values.currentPassword}
                  onChange={passwordFormik.handleChange}
                  onBlur={passwordFormik.handleBlur}
                  error={
                    passwordFormik.touched.currentPassword && Boolean(passwordFormik.errors.currentPassword)
                  }
                  endAdornment={
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowCurrentPassword(!showCurrentPassword)}>
                        {showCurrentPassword ? <NiEyeClose size="medium" /> : <NiEyeOpen size="medium" />}
                      </IconButton>
                    </InputAdornment>
                  }
                />
                {passwordFormik.touched.currentPassword && passwordFormik.errors.currentPassword && (
                  <Typography variant="caption" className="text-error mt-1">
                    {passwordFormik.errors.currentPassword}
                  </Typography>
                )}
              </FormControl>

              <FormControl>
                <FormLabel>New Password</FormLabel>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={passwordFormik.values.newPassword}
                  onChange={passwordFormik.handleChange}
                  onBlur={passwordFormik.handleBlur}
                  error={passwordFormik.touched.newPassword && Boolean(passwordFormik.errors.newPassword)}
                  endAdornment={
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowNewPassword(!showNewPassword)}>
                        {showNewPassword ? <NiEyeClose size="medium" /> : <NiEyeOpen size="medium" />}
                      </IconButton>
                    </InputAdornment>
                  }
                />
                {passwordFormik.touched.newPassword && passwordFormik.errors.newPassword && (
                  <Typography variant="caption" className="text-error mt-1">
                    {passwordFormik.errors.newPassword}
                  </Typography>
                )}
              </FormControl>

              <FormControl>
                <FormLabel>Confirm New Password</FormLabel>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={passwordFormik.values.confirmPassword}
                  onChange={passwordFormik.handleChange}
                  onBlur={passwordFormik.handleBlur}
                  error={
                    passwordFormik.touched.confirmPassword && Boolean(passwordFormik.errors.confirmPassword)
                  }
                  endAdornment={
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                        {showConfirmPassword ? <NiEyeClose size="medium" /> : <NiEyeOpen size="medium" />}
                      </IconButton>
                    </InputAdornment>
                  }
                />
                {passwordFormik.touched.confirmPassword && passwordFormik.errors.confirmPassword && (
                  <Typography variant="caption" className="text-error mt-1">
                    {passwordFormik.errors.confirmPassword}
                  </Typography>
                )}
              </FormControl>

              <Box className="flex gap-2">
                <Button type="submit" variant="contained" disabled={passwordFormik.isSubmitting}>
                  {passwordFormik.isSubmitting ? "Updating..." : "Update Password"}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => passwordFormik.resetForm()}
                  disabled={passwordFormik.isSubmitting}
                >
                  Cancel
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Notification Settings */}
      <Grid size={{ xs: 12, lg: 8 }}>
        <Card>
          <CardContent>
            <Typography variant="h5" className="mb-4">
              Notification Settings
            </Typography>

            <Box className="flex flex-col gap-4">
              <Box className="flex items-center justify-between">
                <Box>
                  <Typography variant="body1">Browser Notifications</Typography>
                  <Typography variant="body2" className="text-text-secondary">
                    Receive alerts for maturity dates, payment reminders, and verification updates
                  </Typography>
                </Box>
                <Switch
                  checked={notificationSettings.enabled}
                  onChange={handleNotificationToggle}
                  disabled={notificationSettings.permission === "denied"}
                />
              </Box>

              {notificationSettings.permission === "denied" && (
                <Alert severity="warning">
                  Notifications are blocked. Please enable them in your browser settings.
                </Alert>
              )}

              {notificationSettings.permission === "default" && !notificationSettings.enabled && (
                <Alert severity="info">
                  Enable notifications to receive timely alerts about your contributions.
                </Alert>
              )}

              {notificationSettings.enabled && (
                <Alert severity="success">
                  ✅ Notifications enabled! You'll receive alerts for:
                  <ul className="mt-2 ml-4">
                    <li>Maturity approaching (7, 3, 1 day before)</li>
                    <li>Payment verification status</li>
                    <li>Upcoming payment reminders</li>
                  </ul>
                </Alert>
              )}
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
