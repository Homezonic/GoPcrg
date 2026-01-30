import Mode from "../mode/mode";
import { NotificationCenter } from "../notification-center";
import User from "../user/user";
import { Link } from "react-router-dom";

import { Box, Button, useMediaQuery, useTheme } from "@mui/material";

import { useLayoutContext } from "@/components/layout/layout-context";
import Logo from "@/components/logo/logo";
import NiMenuSplit from "@/icons/nexture/ni-menu-split";
import { cn } from "@/lib/utils";
import { MenuShowState } from "@/types/types";

export default function Header() {
  const { showLeftInMobile, showLeftMobileButton, leftPrimaryCurrent, leftShowBackdrop } = useLayoutContext();

  return (
    <Box className="mui-fixed fixed z-20 h-20 w-full" component="header">
      <Box
        className={cn(
          "bg-background-paper shadow-darker-xs flex h-full w-full flex-none flex-row items-center rounded-b-3xl sm:h-20",
          leftShowBackdrop && "pointer-events-none",
        )}
        style={{ padding: `0 var(--main-padding)` }}
      >
        <Box
          className={cn(
            "bg-background-paper absolute inset-0 -z-10 rounded-b-3xl",
            leftPrimaryCurrent !== MenuShowState.Hide && "rounded-bl-none! rtl:rounded-br-none!",
          )}
        ></Box>
        {/* Left menu button */}
        <Button
          variant="text"
          size="large"
          color="text-primary"
          className={cn(
            "icon-only hover-icon-shrink [&.active]:text-primary [&.active]:bg-grey-25 hover:bg-grey-25",
            showLeftMobileButton ? "flex" : "hidden",
            leftPrimaryCurrent !== MenuShowState.Hide && "active",
          )}
          onClick={() => showLeftInMobile()}
          startIcon={<NiMenuSplit size={24} />}
        />

        <Box className="flex h-full flex-1 flex-row items-center gap-4 md:gap-6">
          {/* Logo */}
          <Link to="/dashboard" className="inline-flex">
            <Logo />
          </Link>
        </Box>

        {/* Right buttons */}
        <Box className="flex flex-row gap-1">
          <NotificationCenter />
          <Mode />
          <User />
        </Box>
      </Box>
    </Box>
  );
}
