import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBudgetRequests, createBudgetRequest, decideBudgetRequest } from '../../api/budgetRequests';
import { getClubs } from '../../api/clubs';
import { useAuth } from '../../contexts/AuthContext';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  Chip, CircularProgress, Alert, Paper, Grid, Card, CardContent
} from '@mui/material';

export const BudgetRequestsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isSuper = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMINISTRATOR';
  const isAdmin = user?.role === 'ADMIN';

  const { data: requests, isLoading } = useQuery({
    queryKey: ['budgetRequests'],
    queryFn: () => getBudgetRequests()
  });

  const { data: clubs } = useQuery({
    queryKey: ['clubs'],
    queryFn: getClubs
  });

  const [openCreate, setOpenCreate] = useState(false);
  const [formData, setFormData] = useState({
    club_id: '',
    title: '',
    amount: '',
    justification: ''
  });

  const [remarksModal, setRemarksModal] = useState<{ open: boolean; id: number | null; status: 'APPROVED' | 'REJECTED'; remarks: string }>({
    open: false,
    id: null,
    status: 'APPROVED',
    remarks: ''
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => createBudgetRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgetRequests'] });
      setOpenCreate(false);
      setFormData({ club_id: '', title: '', amount: '', justification: '' });
      alert('Budget request submitted to Super Admin!');
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || 'Failed to submit budget request');
    }
  });

  const decideMutation = useMutation({
    mutationFn: ({ id, status, remarks }: { id: number; status: 'APPROVED' | 'REJECTED'; remarks?: string }) =>
      decideBudgetRequest(id, { status, remarks }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgetRequests'] });
      setRemarksModal({ open: false, id: null, status: 'APPROVED', remarks: '' });
      alert('Budget request updated successfully!');
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || 'Failed to process decision');
    }
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      club_id: Number(formData.club_id),
      title: formData.title,
      amount: parseFloat(formData.amount),
      justification: formData.justification
    });
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Chip label="Approved" color="success" size="small" />;
      case 'REJECTED':
        return <Chip label="Rejected" color="error" size="small" />;
      default:
        return <Chip label="Pending Super Admin" color="warning" size="small" />;
    }
  };

  const totalRequested = requests?.reduce((acc, r) => acc + (r.amount || 0), 0) || 0;
  const totalApproved = requests?.filter(r => r.status === 'APPROVED').reduce((acc, r) => acc + (r.amount || 0), 0) || 0;
  const pendingCount = requests?.filter(r => r.status === 'PENDING').length || 0;

  if (isLoading) return <CircularProgress />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <div>
          <Typography variant="h4" sx={{ fontWeight: "bold" }}>
            Budget Approval System
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isSuper
              ? 'Super Admin Review: Authorize or decline club expenditure requests created by Admins.'
              : 'Admin Budget Requests: Forward student event expenditure requests to the Super Admin for budget allocation.'}
          </Typography>
        </div>
        {(isAdmin || isSuper) && (
          <Button variant="contained" color="primary" onClick={() => setOpenCreate(true)}>
            + New Budget Request
          </Button>
        )}
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
            <CardContent>
              <Typography variant="body2">Total Budget Requested</Typography>
              <Typography variant="h5" sx={{ fontWeight: "bold" }}>${totalRequested.toLocaleString()}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
            <CardContent>
              <Typography variant="body2">Total Approved Budget</Typography>
              <Typography variant="h5" sx={{ fontWeight: "bold" }}>${totalApproved.toLocaleString()}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ bgcolor: 'warning.light', color: 'warning.contrastText' }}>
            <CardContent>
              <Typography variant="body2">Pending Approvals</Typography>
              <Typography variant="h5" sx={{ fontWeight: "bold" }}>{pendingCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {requests?.length === 0 ? (
        <Alert severity="info">No budget requests submitted yet.</Alert>
      ) : (
        <Paper sx={{ overflow: 'hidden' }}>
          <Table>
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell>Budget Title</TableCell>
                <TableCell>Club</TableCell>
                <TableCell>Linked Event</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Created By</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
                {isSuper && <TableCell align="center">Super Admin Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {requests?.map((req) => (
                <TableRow key={req.id}>
                  <TableCell>
                    <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>{req.title}</Typography>
                    {req.justification && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', maxWidth: 220 }}>
                        {req.justification}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip label={req.club_name || `Club #${req.club_id}`} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>{req.event_title || 'General Club Funds'}</TableCell>
                  <TableCell>
                    <Typography variant="subtitle1" color="primary.main" sx={{ fontWeight: "bold" }}>
                      ${req.amount.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell>{req.creator?.full_name || `Admin #${req.created_by}`}</TableCell>
                  <TableCell>
                    {getStatusChip(req.status)}
                    {req.remarks && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                        Remarks: {req.remarks}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{new Date(req.created_at).toLocaleDateString()}</TableCell>
                  {isSuper && (
                    <TableCell align="center">
                      {req.status === 'PENDING' ? (
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            onClick={() =>
                              decideMutation.mutate({
                                id: req.id,
                                status: 'APPROVED'
                              })
                            }
                            disabled={decideMutation.isPending}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            onClick={() =>
                              setRemarksModal({
                                open: true,
                                id: req.id,
                                status: 'REJECTED',
                                remarks: ''
                              })
                            }
                            disabled={decideMutation.isPending}
                          >
                            Reject
                          </Button>
                        </Box>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          Processed
                        </Typography>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* New Budget Request Dialog (Admin) */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Budget Request for Super Admin</DialogTitle>
        <form onSubmit={handleCreateSubmit}>
          <DialogContent>
            <TextField
              select
              margin="dense"
              label="Select Club"
              fullWidth
              required
              value={formData.club_id}
              onChange={(e) => setFormData({ ...formData, club_id: e.target.value })}
            >
              {clubs?.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              margin="dense"
              label="Budget Title"
              fullWidth
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Annual Tech Symposium Budget"
            />
            <TextField
              margin="dense"
              label="Amount ($)"
              type="number"
              fullWidth
              required
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              helperText="Enter the amount mentioned by the student club leaders."
            />
            <TextField
              margin="dense"
              label="Justification & Cost Breakdown"
              fullWidth
              multiline
              rows={4}
              required
              value={formData.justification}
              onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
              placeholder="Breakdown of expenses, vendor quotes, expected attendees, etc."
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={createMutation.isPending}>
              Submit to Super Admin
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Decision Remarks Dialog (Super Admin) */}
      <Dialog
        open={remarksModal.open}
        onClose={() => setRemarksModal({ ...remarksModal, open: false })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Reject Budget Allocation</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Super Admin Remarks"
            fullWidth
            multiline
            rows={3}
            value={remarksModal.remarks}
            onChange={(e) => setRemarksModal({ ...remarksModal, remarks: e.target.value })}
            placeholder="Reason for declining this budget..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRemarksModal({ ...remarksModal, open: false })}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() =>
              remarksModal.id &&
              decideMutation.mutate({
                id: remarksModal.id,
                status: 'REJECTED',
                remarks: remarksModal.remarks
              })
            }
          >
            Confirm Rejection
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
