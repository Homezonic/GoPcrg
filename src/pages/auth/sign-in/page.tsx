import { useFormik } from "formik";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as yup from "yup";
import { useSnackbar } from "notistack";
import { supabase } from "@/lib/supabase";

import {
  Alert,
  AlertTitle,
  Box,
  Button,
  capitalize,
  Divider,
  FormControl,
  FormLabel,
  IconButton,
  Input,
  InputAdornment,
  Paper,
  Tooltip,
  Typography,
} from "@mui/material";

import Logo from "@/components/logo/logo";
import { DEFAULTS } from "@/config";
import { useAuth } from "@/contexts/auth-context";
import NiCrossSquare from "@/icons/nexture/ni-cross-square";
import NiEyeClose from "@/icons/nexture/ni-eye-close";
import NiEyeOpen from "@/icons/nexture/ni-eye-open";

const validationSchema = yup.object({
  email: yup.string().required("The field is required").email("Enter a valid email"),
  password: yup.string().required("The field is required"),
});

type InputErrorProps = {
  title: string;
};

const InputErrorTooltip = ({ title }: InputErrorProps) => {
  return (
    <Box className="relative">
      <Tooltip title={title} arrow className="absolute -top-1.5">
        <Button
          startIcon={<NiCrossSquare size="small" />}
          color="error"
          size="small"
          className="group icon-only !bg-transparent !outline-0"
        ></Button>
      </Tooltip>
    </Box>
  );
};

export default function Page() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [siteName, setSiteName] = useState("GoPcrg");

  useEffect(() => {
    const fetchSiteName = async () => {
      const { data } = await supabase.from("site_settings").select("site_name").single();
      if (data?.site_name) {
        setSiteName(data.site_name);
        document.title = data.site_name;
      }
    };
    fetchSiteName();
  }, []);

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setError(null);
        await signIn(values.email, values.password);
        enqueueSnackbar('Welcome back!', { variant: 'success' });
        navigate(DEFAULTS.appRoot);
      } catch (err: any) {
        console.error('Sign in error:', err);
        setError(err.message || 'Invalid email or password');
        enqueueSnackbar(err.message || 'Invalid email or password', { variant: 'error' });
      }
    },
    validateOnBlur: false,
    validateOnMount: false,
  });

  const [showPassword, setShowPassword] = useState(false);

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  const handleMouseUpPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  return (
    <Box className="bg-waves flex min-h-screen w-full items-center justify-center bg-cover bg-center p-4">
      <Paper elevation={3} className="bg-background-paper shadow-darker-xs w-[32rem] max-w-full rounded-4xl py-14">
        <Box className="flex flex-col gap-4 px-8 sm:px-14">
          <Box className="flex flex-col">
            <Box className="mb-14 flex justify-center">
              <Logo />
            </Box>

            <Box className="flex flex-col gap-10">
              <Box className="flex flex-col">
                <Typography variant="h1" component="h1" className="mb-2">
                  Sign in
                </Typography>
                <Typography variant="body1" className="text-text-primary">
                  Access your account quickly and securely to get started.
                </Typography>
              </Box>

              <Box className="flex flex-col gap-5">
                <Box
                  component={"form"}
                  onSubmit={(event) => {
                    setSubmitted(true);
                    formik.handleSubmit(event);
                  }}
                  className="flex flex-col"
                >
                  <FormControl className="outlined" variant="standard" size="small">
                    <FormLabel component="label" className="flex flex-row">
                      Email
                      {formik.touched.email && formik.errors.email && <InputErrorTooltip title={formik.errors.email} />}
                    </FormLabel>
                    <Input
                      id="email"
                      name="email"
                      placeholder=""
                      value={formik.values.email}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                  </FormControl>

                  <FormControl className="outlined" variant="standard" size="small">
                    <FormLabel component="label" className="flex flex-row">
                      Password
                      {formik.touched.password && formik.errors.password && (
                        <InputErrorTooltip title={formik.errors.password} />
                      )}
                    </FormLabel>
                    <Input
                      size="small"
                      id="password"
                      name="password"
                      placeholder=""
                      autoComplete="off"
                      value={formik.values.password}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      type={showPassword ? "text" : "password"}
                      endAdornment={
                        <InputAdornment position="end">
                          <IconButton
                            onClick={handleClickShowPassword}
                            onMouseDown={handleMouseDownPassword}
                            onMouseUp={handleMouseUpPassword}
                          >
                            {showPassword ? (
                              <NiEyeClose size="medium" className="text-text-secondary" />
                            ) : (
                              <NiEyeOpen size="medium" className="text-text-secondary" />
                            )}
                          </IconButton>
                        </InputAdornment>
                      }
                    />
                  </FormControl>

                  {submitted && !formik.isValid && (
                    <Alert severity="error" icon={<NiCrossSquare />} className="neutral !bg-background-paper/60 mb-4">
                      <AlertTitle variant="subtitle2">The following inputs have errors!</AlertTitle>
                      {Object.entries(formik.errors).map(([key, value]) => {
                        return (
                          <Box className="flex flex-row gap-0.5" key={crypto.randomUUID()}>
                            <Typography variant="body2" className="text-error">
                              {capitalize(key)}:
                            </Typography>
                            <Typography variant="body2" className="text-text-primary">
                              {value}
                            </Typography>
                          </Box>
                        );
                      })}
                    </Alert>
                  )}
                  {error && (
                    <Alert severity="error" icon={<NiCrossSquare />} className="neutral !bg-background-paper/60 mb-4">
                      <AlertTitle variant="subtitle2">Sign in failed</AlertTitle>
                      <Typography variant="body2" className="text-text-primary">
                        {error}
                      </Typography>
                    </Alert>
                  )}
                  <Box className="flex flex-col gap-2">
                    <Link
                      to="/auth/password-reset"
                      className="link-text-secondary link-underline-hover text-center text-sm font-semibold"
                    >
                      Reset Password
                    </Link>
                    <Button type="submit" variant="contained" className="mb-4" disabled={formik.isSubmitting}>
                      {formik.isSubmitting ? 'Signing in...' : 'Continue'}
                    </Button>
                  </Box>

                  <Typography variant="body2" className="text-text-secondary">
                    By clicking Continue, you agree to the{" "}
                    <Link target="_blank" to="/auth/terms-and-conditions" className="link-primary link-underline-hover">
                      Terms and Conditions
                    </Link>{" "}
                    and{" "}
                    <Link target="_blank" to="/auth/privacy-policy" className="link-primary link-underline-hover">
                      Privacy Policy
                    </Link>
                    .
                  </Typography>
                </Box>
              </Box>
              <Divider className="text-text-secondary my-0 text-sm"></Divider>
              <Box className="flex flex-col">
                <Typography variant="h6" component="h6">
                  Get Started
                </Typography>
                <Typography variant="body1" className="text-text-secondary">
                  New to {siteName}? Please use your email to{" "}
                  <Link to="/auth/sign-up" className="link-primary link-underline-hover">
                    sign up
                  </Link>
                  .
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
