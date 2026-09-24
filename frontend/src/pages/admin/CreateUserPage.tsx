import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createUser, getUsers } from '../../api/auth';
import { useAuth } from '../../contexts/AuthContext';
import {
  Box, Typography, TextField, MenuItem, Button, Card, CardContent,
  Alert, Grid, Paper, Table, TableBody, TableCell, TableHead, TableRow, Chip
} from '@mui/material';

export const CreateUserPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isSuper = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMINISTRATOR';

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: isSuper ? 'ADMIN' : 'STUDENT'
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const { data: usersList } = useQuery({
    queryKey: ['systemUsers'],
    queryFn: () => getUsers()
  });

  const mutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      setSuccess(true);
      setError('');
      setFormData({
        email: '',
        password: '',
        full_name: '',
        role: isSuper ? 'ADMIN' : 'STUDENT'
      });
      queryClient.invalidateQueries({ queryKey: ['systemUsers'] });
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail || 'Failed to create user');
      setSuccess(false);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const getRoleChip = (role: string, isLeader?: boolean) => {
    if (role === 'SUPER_ADMIN' || role === 'ADMINISTRATOR') {
      return <Chip label="Super Admin" color="secondary" size="small" />;
    }
    if (role === 'ADMIN') {
      return <Chip label="Admin" color="info" size="small" />;
    }
    if (isLeader) {
      return <Chip label="⭐ Student (Leader)" color="warning" size="small" />;
    }
    return <Chip label="Student" size="small" />;
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: "bold" }}>
          {isSuper ? 'User & Administrator Management' : 'Create Student Account'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {isSuper
            ? 'Super Admin Authority: Create new Admin accounts to delegate club and event operations.'
            : 'Admin Authority: Register new student accounts.'}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
                {isSuper ? 'Create Admin or Student' : 'Register New Student'}
              </Typography>
              {success && <Alert severity="success" sx={{ mb: 2 }}>Account created successfully!</Alert>}
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              <form onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  margin="normal"
                  label="Full Name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                />
                <TextField
                  fullWidth
                  margin="normal"
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
                <TextField
                  fullWidth
                  margin="normal"
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  helperText="Minimum 6 characters"
                />
                <TextField
                  select
                  fullWidth
                  margin="normal"
                  label="Account Role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  {isSuper ? (
                    [
                      <MenuItem key="ADMIN" value="ADMIN">
                        🛡️ Admin (Manage Clubs, Allot Students, Approve Events)
                      </MenuItem>,
                      <MenuItem key="STUDENT" value="STUDENT">
                        👤 Student (Club Member / Leader)
                      </MenuItem>,
                      <MenuItem key="SUPER_ADMIN" value="SUPER_ADMIN">
                        🔑 Super Admin (Executive Oversight)
                      </MenuItem>
                    ]
                  ) : (
                    <MenuItem value="STUDENT">👤 Student</MenuItem>
                  )}
                </TextField>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  size="large"
                  sx={{ mt: 3 }}
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? 'Creating Account...' : isSuper && formData.role === 'ADMIN' ? 'Create Admin Account' : 'Create User'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <Paper sx={{ p: 2, overflow: 'hidden' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
              System Directory ({usersList?.length || 0} Accounts)
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {usersList?.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell sx={{ fontWeight: 'bold' }}>{u.full_name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{getRoleChip(u.role, u.is_club_leader)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};
