import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEventRequests, decideEventRequest } from '../../api/eventRequests';
import { createBudgetRequest } from '../../api/budgetRequests';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Chip, CircularProgress, Alert, Paper, Tooltip
} from '@mui/material';

export const EventRequestsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'ADMINISTRATOR';

  const { data: requests, isLoading } = useQuery({
    queryKey: ['eventRequests'],
    queryFn: () => getEventRequests()
  });

  // Decision Modal State
  const [rejectModal, setRejectModal] = useState<{ open: boolean; requestId: number | null; notes: string }>({
    open: false,
    requestId: null,
    notes: ''
  });

  // Budget Request Modal State (prefilled from student-mentioned amount!)
  const [budgetModal, setBudgetModal] = useState<{
    open: boolean;
    clubId: number;
    eventRequestId: number;
    title: string;
    amount: number;
    justification: string;
  }>({
    open: false,
    clubId: 0,
    eventRequestId: 0,
    title: '',
    amount: 0,
    justification: ''
  });

  const decisionMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: number; status: 'APPROVED' | 'REJECTED'; notes?: string }) =>
      decideEventRequest(id, { status, admin_notes: notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventRequests'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setRejectModal({ open: false, requestId: null, notes: '' });
      alert('Event request decided successfully! If approved, the event is now live for student registrations.');
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || 'Failed to decide event request');
    }
  });

  const budgetMutation = useMutation({
    mutationFn: (data: any) => createBudgetRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgetRequests'] });
      setBudgetModal({ open: false, clubId: 0, eventRequestId: 0, title: '', amount: 0, justification: '' });
      alert('Budget request forwarded to Super Admin for approval!');
      navigate('/admin/budget-requests');
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || 'Failed to create budget request');
    }
  });

  const handleOpenBudgetModal = (req: any) => {
    setBudgetModal({
      open: true,
      clubId: req.club_id,
      eventRequestId: req.id,
      title: `Budget for: ${req.title}`,
      amount: req.proposed_budget || 0,
      justification: req.budget_breakdown || `Budget requested by Club Leader for event "${req.title}"`
    });
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Chip label="Approved & Published" color="success" size="small" />;
      case 'REJECTED':
        return <Chip label="Rejected" color="error" size="small" />;
      default:
        return <Chip label="Pending Admin Approval" color="warning" size="small" />;
    }
  };

  if (isLoading) return <CircularProgress />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <div>
          <Typography variant="h4" sx={{ fontWeight: "bold" }}>
            Club Leader Event Requests
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Admins review event proposals submitted by Club Leaders, approve events, and create budget requests for Super Admin.
          </Typography>
        </div>
      </Box>

      {requests?.length === 0 ? (
        <Alert severity="info">No event requests found.</Alert>
      ) : (
        <Paper sx={{ overflow: 'hidden' }}>
          <Table>
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell>Event Title</TableCell>
                <TableCell>Club</TableCell>
                <TableCell>Club Leader</TableCell>
                <TableCell>Date & Venue</TableCell>
                <TableCell>Capacity</TableCell>
                <TableCell>Proposed Budget</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Admin Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests?.map((req) => (
                <TableRow key={req.id}>
                  <TableCell>
                    <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                      {req.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', maxWidth: 200 }}>
                      {req.description}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={req.club_name || `Club #${req.club_id}`} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>{req.creator?.full_name || `Leader #${req.created_by}`}</TableCell>
                  <TableCell>
                    <Typography variant="body2">{new Date(req.event_date).toLocaleString()}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {req.venue || 'TBA'}
                    </Typography>
                  </TableCell>
                  <TableCell>{req.capacity}</TableCell>
                  <TableCell>
                    <Typography variant="subtitle2" color="primary.main" sx={{ fontWeight: "bold" }}>
                      ${req.proposed_budget.toLocaleString()}
                    </Typography>
                    {req.budget_breakdown && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                        {req.budget_breakdown}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {getStatusChip(req.status)}
                    {req.admin_notes && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                        Note: {req.admin_notes}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center' }}>
                      {req.status === 'PENDING' && isAdmin && (
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            onClick={() => decisionMutation.mutate({ id: req.id, status: 'APPROVED' })}
                            disabled={decisionMutation.isPending}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            onClick={() => setRejectModal({ open: true, requestId: req.id, notes: '' })}
                            disabled={decisionMutation.isPending}
                          >
                            Reject
                          </Button>
                        </Box>
                      )}
                      {isAdmin && (
                        <Tooltip title="Create a formal budget request for Super Admin based on student's requested amount">
                          <Button
                            variant="outlined"
                            color="info"
                            size="small"
                            onClick={() => handleOpenBudgetModal(req)}
                          >
                            + Request Budget (${req.proposed_budget})
                          </Button>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* Reject Event Modal */}
      <Dialog
        open={rejectModal.open}
        onClose={() => setRejectModal({ ...rejectModal, open: false })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Reject Event Request</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Admin Notes / Reason"
            fullWidth
            multiline
            rows={3}
            value={rejectModal.notes}
            onChange={(e) => setRejectModal({ ...rejectModal, notes: e.target.value })}
            placeholder="Feedback for the Club Leader..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectModal({ ...rejectModal, open: false })}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() =>
              rejectModal.requestId &&
              decisionMutation.mutate({
                id: rejectModal.requestId,
                status: 'REJECTED',
                notes: rejectModal.notes
              })
            }
          >
            Confirm Rejection
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Budget Request Modal (Admin to Super Admin) */}
      <Dialog
        open={budgetModal.open}
        onClose={() => setBudgetModal({ ...budgetModal, open: false })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create Budget Request for Super Admin</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            This will request funds from the Super Admin according to the amount mentioned by the student club leader.
          </Typography>
          <TextField
            margin="dense"
            label="Budget Title"
            fullWidth
            required
            value={budgetModal.title}
            onChange={(e) => setBudgetModal({ ...budgetModal, title: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Requested Amount ($)"
            type="number"
            fullWidth
            required
            value={budgetModal.amount}
            onChange={(e) => setBudgetModal({ ...budgetModal, amount: parseFloat(e.target.value) || 0 })}
            helperText="Amount based on student's proposal. Admin can adjust if needed."
          />
          <TextField
            margin="dense"
            label="Justification & Expense Breakdown"
            fullWidth
            multiline
            rows={3}
            value={budgetModal.justification}
            onChange={(e) => setBudgetModal({ ...budgetModal, justification: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBudgetModal({ ...budgetModal, open: false })}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() =>
              budgetMutation.mutate({
                club_id: budgetModal.clubId,
                event_request_id: budgetModal.eventRequestId,
                title: budgetModal.title,
                amount: budgetModal.amount,
                justification: budgetModal.justification
              })
            }
            disabled={budgetMutation.isPending}
          >
            Submit to Super Admin
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
