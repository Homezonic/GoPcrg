import { useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Divider,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useAuth } from "@/contexts/auth-context";
import NiUser from "@/icons/nexture/ni-user";
import NiCreditCard from "@/icons/nexture/ni-credit-card";
import NiPhoneHandset from "@/icons/nexture/ni-phone-handset";
import NiSign from "@/icons/nexture/ni-sign";
import { useNavigate } from "react-router-dom";
import SupportDialog from "../support-dialog";

// Helper function to generate initials from name
function getInitials(name: string | null | undefined): string {
  if (!name) return "U";

  const parts = name.trim().split(" ");
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Helper function to generate a consistent color from a string
function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const hue = hash % 360;
  return `hsl(${hue}, 65%, 50%)`;
}

export default function User() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [supportDialogOpen, setSupportDialogOpen] = useState(false);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleProfileClick = () => {
    navigate("/app/profile");
    handleClose();
  };

  const handlePaymentsClick = () => {
    navigate("/app/payments");
    handleClose();
  };

  const handleSupportClick = () => {
    setSupportDialogOpen(true);
    handleClose();
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth/sign-in");
    handleClose();
  };

  const userName = user?.full_name || "User";
  const userEmail = user?.email || "";
  const initials = getInitials(userName);
  const avatarColor = stringToColor(userName);

  return (
    <>
      {/* Desktop Button */}
      <Button
        variant="text"
        size="large"
        color="text-primary"
        className="hidden sm:flex gap-2 px-3 hover:bg-grey-25"
        onClick={handleClick}
      >
        <Box className="flex flex-col items-end">
          <Typography variant="body2" className="text-text-primary font-medium">
            {userName}
          </Typography>
        </Box>
        <Avatar
          sx={{
            width: 40,
            height: 40,
            bgcolor: avatarColor,
            fontSize: "0.875rem",
            fontWeight: 600,
          }}
        >
          {initials}
        </Avatar>
      </Button>

      {/* Mobile Button */}
      <Button
        variant="text"
        size="large"
        color="text-primary"
        className="icon-only hover-icon-shrink sm:hidden hover:bg-grey-25"
        onClick={handleClick}
      >
        <Avatar
          sx={{
            width: 40,
            height: 40,
            bgcolor: avatarColor,
            fontSize: "0.875rem",
            fontWeight: 600,
          }}
        >
          {initials}
        </Avatar>
      </Button>

      {/* Menu */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              minWidth: 240,
              borderRadius: 2,
            },
          },
        }}
      >
        <Box className="px-4 py-3">
          <Box className="flex items-center gap-3">
            <Avatar
              sx={{
                width: 48,
                height: 48,
                bgcolor: avatarColor,
                fontSize: "1rem",
                fontWeight: 600,
              }}
            >
              {initials}
            </Avatar>
            <Box>
              <Typography variant="body1" className="font-semibold">
                {userName}
              </Typography>
              <Typography variant="body2" className="text-text-secondary">
                {userEmail}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Divider />

        <MenuItem onClick={handleProfileClick}>
          <ListItemIcon>
            <NiUser size={20} />
          </ListItemIcon>
          <ListItemText>Profile</ListItemText>
        </MenuItem>

        <MenuItem onClick={handlePaymentsClick}>
          <ListItemIcon>
            <NiCreditCard size={20} />
          </ListItemIcon>
          <ListItemText>Payments</ListItemText>
        </MenuItem>

        <MenuItem onClick={handleSupportClick}>
          <ListItemIcon>
            <NiPhoneHandset size={20} />
          </ListItemIcon>
          <ListItemText>Support</ListItemText>
        </MenuItem>

        <Divider />

        <MenuItem onClick={handleSignOut}>
          <ListItemIcon>
            <NiSign size={20} />
          </ListItemIcon>
          <ListItemText>Sign Out</ListItemText>
        </MenuItem>
      </Menu>

      {/* Support Dialog */}
      <SupportDialog open={supportDialogOpen} onClose={() => setSupportDialogOpen(false)} />
    </>
  );
}
