import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { createUser } from '../../api/auth';
import { Box, Typography, TextField, MenuItem, Button, Card, CardContent, Alert } from '@mui/material';

export const CreateUserPage = () => {
  const [formData, setFormData] = useState({ email: '', password: '', full_name: '', role: 'STUDENT' });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      setSuccess(true);
      setError('');
      setFormData({ email: '', password: '', full_name: '', role: 'STUDENT' });
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

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Create System User</Typography>
      <Card sx={{ maxWidth: 500 }}>
        <CardContent>
          {success && <Alert severity="success" sx={{ mb: 2 }}>User created successfully!</Alert>}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <form onSubmit={handleSubmit}>
            <TextField fullWidth margin="normal" label="Full Name" value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} required />
            <TextField fullWidth margin="normal" label="Email" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
            <TextField fullWidth margin="normal" label="Password" type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required />
            <TextField select fullWidth margin="normal" label="Role" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
              <MenuItem value="STUDENT">Student</MenuItem>
              <MenuItem value="CLUB_COORDINATOR">Club Coordinator</MenuItem>
              <MenuItem value="FACULTY_COORDINATOR">Faculty Coordinator</MenuItem>
              <MenuItem value="ADMINISTRATOR">Administrator</MenuItem>
            </TextField>
            <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }} disabled={mutation.isPending}>
              Create User
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};
