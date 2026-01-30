import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useSnackbar } from "notistack";
import { useAuth } from "@/contexts/auth-context";

export default function LogoutPage() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    const handleLogout = async () => {
      try {
        await signOut();
        enqueueSnackbar("You've been signed out successfully", { variant: "success" });
        navigate("/auth/sign-in");
      } catch (error) {
        console.error("Logout error:", error);
        enqueueSnackbar("Error signing out", { variant: "error" });
        navigate("/dashboard");
      }
    };

    handleLogout();
  }, [signOut, navigate, enqueueSnackbar]);

  return (
    <Box className="flex flex-col items-center justify-center min-h-screen gap-4">
      <CircularProgress />
      <Typography variant="body1" className="text-text-secondary">
        Signing out...
      </Typography>
    </Box>
  );
}
