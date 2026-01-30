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
  Avatar,
  Tabs,
  Tab,
  MenuItem,
  Select,
  FormControl,
  Badge,
} from "@mui/material";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import type { User } from "@/types/contribution";
import NiUsers from "@/icons/nexture/ni-users";
import NiReceipt from "@/icons/nexture/ni-receipt";
import NiDocumentFull from "@/icons/nexture/ni-document-full";

interface UserWithStats extends User {
  enrollment_count: number;
  payment_count: number;
  total_contributed: number;
}

export default function UsersPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserWithStats | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0); // 0 = All, 1 = Admins, 2 = Regular Users
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [tabValue]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase.from("users").select("*").order("created_at", { ascending: false });

      if (tabValue === 1) {
        query = query.eq("role", "admin");
      } else if (tabValue === 2) {
        query = query.eq("role", "user");
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch stats for each user
      const usersWithStats = await Promise.all(
        (data || []).map(async (u) => {
          const [enrollments, payments] = await Promise.all([
            supabase
              .from("enrollments")
              .select("*", { count: "exact", head: true })
              .eq("user_id", u.id),
            supabase
              .from("payments")
              .select("amount")
              .eq("user_id", u.id)
              .eq("status", "APPROVED"),
          ]);

          const totalContributed = payments.data?.reduce((sum, p) => sum + p.amount, 0) || 0;

          return {
            ...u,
            enrollment_count: enrollments.count || 0,
            payment_count: payments.data?.length || 0,
            total_contributed: totalContributed,
          };
        })
      );

      setUsers(usersWithStats);
    } catch (err: any) {
      console.error("Error fetching users:", err);
      setError(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleChangeRole = async (userId: string, newRole: "user" | "admin") => {
    try {
      setUpdating(true);
      setError(null);

      const { error } = await supabase
        .from("users")
        .update({ role: newRole })
        .eq("id", userId);

      if (error) throw error;

      await fetchUsers();
      setDialogOpen(false);
      setSelectedUser(null);
    } catch (err: any) {
      console.error("Error updating user role:", err);
      setError(err.message || "Failed to update user role");
    } finally {
      setUpdating(false);
    }
  };

  const handleViewDetails = (u: UserWithStats) => {
    setSelectedUser(u);
    setDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
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
        <NiUsers size={32} className="text-primary" />
        <Box>
          <Typography variant="h1" component="h1" className="mb-0">
            User Management
          </Typography>
          <Typography variant="body2" className="text-text-secondary">
            Manage user accounts and roles
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
              <Badge badgeContent={tabValue === 0 ? users.length : 0} color="primary">
                All Users
              </Badge>
            }
          />
          <Tab label="Admins" />
          <Tab label="Regular Users" />
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
                  <TableCell>Role</TableCell>
                  <TableCell>Enrollments</TableCell>
                  <TableCell>Payments</TableCell>
                  <TableCell>Total Contributed</TableCell>
                  <TableCell>Joined</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <Box className="flex items-center gap-2">
                        <Avatar sx={{ width: 36, height: 36, fontSize: "0.875rem" }}>
                          {getInitials(u.full_name)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" className="font-medium">
                            {u.full_name || "Unknown"}
                          </Typography>
                          <Typography variant="caption" className="text-text-secondary">
                            {u.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={u.role === "admin" ? "Admin" : "User"}
                        size="small"
                        color={u.role === "admin" ? "secondary" : "default"}
                      />
                    </TableCell>
                    <TableCell>
                      <Box className="flex items-center gap-1">
                        <NiDocumentFull size={16} className="text-text-secondary" />
                        <Typography variant="body2">{u.enrollment_count}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box className="flex items-center gap-1">
                        <NiReceipt size={16} className="text-text-secondary" />
                        <Typography variant="body2">{u.payment_count}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" className="font-semibold">
                        ${u.total_contributed.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" className="text-text-secondary">
                        {formatDate(u.created_at)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleViewDetails(u)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" className="py-8">
                      <Typography variant="body2" className="text-text-secondary">
                        No users found.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* User Details Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>User Details</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box className="space-y-4 mt-2">
              <Box className="flex items-center gap-3">
                <Avatar sx={{ width: 64, height: 64, fontSize: "1.5rem" }}>
                  {getInitials(selectedUser.full_name)}
                </Avatar>
                <Box>
                  <Typography variant="h6">{selectedUser.full_name || "Unknown"}</Typography>
                  <Typography variant="body2" className="text-text-secondary">
                    {selectedUser.email}
                  </Typography>
                </Box>
              </Box>

              <Box className="grid grid-cols-2 gap-4">
                <Box>
                  <Typography variant="caption" className="text-text-secondary">
                    Role
                  </Typography>
                  <FormControl fullWidth size="small" className="mt-1">
                    <Select
                      value={selectedUser.role}
                      onChange={(e) =>
                        handleChangeRole(selectedUser.id, e.target.value as "user" | "admin")
                      }
                      disabled={updating || selectedUser.id === user?.id}
                    >
                      <MenuItem value="user">Regular User</MenuItem>
                      <MenuItem value="admin">Admin</MenuItem>
                    </Select>
                  </FormControl>
                  {selectedUser.id === user?.id && (
                    <Typography variant="caption" className="text-text-secondary">
                      You cannot change your own role
                    </Typography>
                  )}
                </Box>
                <Box>
                  <Typography variant="caption" className="text-text-secondary">
                    Joined
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(selectedUser.created_at)}
                  </Typography>
                </Box>
              </Box>

              <Box className="grid grid-cols-3 gap-4 pt-4 border-t">
                <Box>
                  <Typography variant="caption" className="text-text-secondary">
                    Enrollments
                  </Typography>
                  <Typography variant="h6">{selectedUser.enrollment_count}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" className="text-text-secondary">
                    Payments
                  </Typography>
                  <Typography variant="h6">{selectedUser.payment_count}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" className="text-text-secondary">
                    Total Paid
                  </Typography>
                  <Typography variant="h6">
                    ${selectedUser.total_contributed.toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
