import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getClubRequests, createClubRequest, decideClubRequest } from '../../api/clubRequests';
import { getAvailableStudents } from '../../api/clubs';
import { useAuth } from '../../contexts/AuthContext';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  Chip, CircularProgress, Alert, Paper
} from '@mui/material';

export const ClubRequestsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isSuper = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMINISTRATOR';
  const isAdmin = user?.role === 'ADMIN';

  const { data: requests, isLoading } = useQuery({
    queryKey: ['clubRequests'],
    queryFn: () => getClubRequests()
  });

  const { data: students } = useQuery({
    queryKey: ['availableStudents'],
    queryFn: getAvailableStudents,
    enabled: isAdmin || isSuper
  });

  // Create Request Modal State
  const [openCreate, setOpenCreate] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    initial_leader_id: ''
  });

  // Decision Modal State
  const [decisionModal, setDecisionModal] = useState<{ open: boolean; requestId: number | null; status: 'APPROVED' | 'REJECTED'; reason: string }>({
    open: false,
    requestId: null,
    status: 'APPROVED',
    reason: ''
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => createClubRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clubRequests'] });
      setOpenCreate(false);
      setFormData({ name: '', description: '', category: '', initial_leader_id: '' });
      alert('Club creation request submitted successfully to Super Admin!');
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || 'Failed to submit club request');
    }
  });

  const decisionMutation = useMutation({
    mutationFn: ({ id, status, reason }: { id: number; status: 'APPROVED' | 'REJECTED'; reason?: string }) =>
      decideClubRequest(id, { status, rejection_reason: reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clubRequests'] });
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
      setDecisionModal({ open: false, requestId: null, status: 'APPROVED', reason: '' });
      alert('Club request status updated successfully!');
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || 'Failed to process decision');
    }
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name: formData.name,
      description: formData.description,
      category: formData.category,
      initial_leader_id: formData.initial_leader_id ? Number(formData.initial_leader_id) : undefined
    });
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Chip label="Approved" color="success" size="small" />;
      case 'REJECTED':
        return <Chip label="Rejected" color="error" size="small" />;
      default:
        return <Chip label="Pending Approval" color="warning" size="small" />;
    }
  };

  if (isLoading) return <CircularProgress />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <div>
          <Typography variant="h4" sx={{ fontWeight: "bold" }}>
            Club Creation Requests
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isSuper
              ? 'Super Admin Review: Review and approve new club proposals submitted by Admins.'
              : 'Admin Requests: Propose new student clubs to the Super Admin for creation.'}
          </Typography>
        </div>
        {(isAdmin || isSuper) && (
          <Button variant="contained" color="primary" onClick={() => setOpenCreate(true)}>
            + Propose New Club
          </Button>
        )}
      </Box>

      {requests?.length === 0 ? (
        <Alert severity="info">No club creation requests found.</Alert>
      ) : (
        <Paper sx={{ overflow: 'hidden' }}>
          <Table>
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell>Club Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Requested By</TableCell>
                <TableCell>Initial Leader</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
                {isSuper && <TableCell align="center">Super Admin Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {requests?.map((req) => (
                <TableRow key={req.id}>
                  <TableCell sx={{ fontWeight: 'bold' }}>{req.name}</TableCell>
                  <TableCell sx={{ maxWidth: 250 }}>{req.description || '-'}</TableCell>
                  <TableCell>{req.category || 'General'}</TableCell>
                  <TableCell>{req.requester?.full_name || `Admin #${req.requested_by}`}</TableCell>
                  <TableCell>
                    {req.initial_leader ? (
                      <Chip label={req.initial_leader.full_name} size="small" color="primary" variant="outlined" />
                    ) : (
                      'None'
                    )}
                  </TableCell>
                  <TableCell>
                    {getStatusChip(req.status)}
                    {req.rejection_reason && (
                      <Typography variant="caption" color="error.main" sx={{ display: "block" }}>
                        Reason: {req.rejection_reason}
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
                              decisionMutation.mutate({
                                id: req.id,
                                status: 'APPROVED'
                              })
                            }
                            disabled={decisionMutation.isPending}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            onClick={() =>
                              setDecisionModal({
                                open: true,
                                requestId: req.id,
                                status: 'REJECTED',
                                reason: ''
                              })
                            }
                            disabled={decisionMutation.isPending}
                          >
                            Reject
                          </Button>
                        </Box>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          Decided
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

      {/* Propose New Club Dialog */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Propose New Club (Admin)</DialogTitle>
        <form onSubmit={handleCreateSubmit}>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              This request will be forwarded to the Super Admin for formal approval and budget allotment.
            </Typography>
            <TextField
              margin="dense"
              label="Club Name"
              fullWidth
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <TextField
              margin="dense"
              label="Category"
              placeholder="e.g. Technology, Cultural, Sports"
              fullWidth
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            />
            <TextField
              margin="dense"
              label="Description"
              fullWidth
              multiline
              rows={3}
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <TextField
              select
              margin="dense"
              label="Assign Initial Club Leader (Student)"
              fullWidth
              value={formData.initial_leader_id}
              onChange={(e) => setFormData({ ...formData, initial_leader_id: e.target.value })}
              helperText="Optional: You can allocate student leader now or later."
            >
              <MenuItem value="">
                <em>None (Assign Later)</em>
              </MenuItem>
              {students?.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.full_name} ({s.email})
                </MenuItem>
              ))}
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={createMutation.isPending}>
              Submit Request to Super Admin
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Rejection Modal */}
      <Dialog
        open={decisionModal.open}
        onClose={() => setDecisionModal({ ...decisionModal, open: false })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Reject Club Proposal</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Reason for Rejection"
            fullWidth
            multiline
            rows={3}
            value={decisionModal.reason}
            onChange={(e) => setDecisionModal({ ...decisionModal, reason: e.target.value })}
            placeholder="Please provide constructive feedback to the Admin..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDecisionModal({ ...decisionModal, open: false })}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() =>
              decisionModal.requestId &&
              decisionMutation.mutate({
                id: decisionModal.requestId,
                status: 'REJECTED',
                reason: decisionModal.reason
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
