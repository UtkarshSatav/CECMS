import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createEventRequest } from '../../api/eventRequests';
import { getClubs } from '../../api/clubs';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, TextField, Button, Card, CardContent, MenuItem,
  Alert, InputAdornment, Grid
} from '@mui/material';

export const CreateEventRequestPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: clubs } = useQuery({
    queryKey: ['clubs'],
    queryFn: getClubs
  });

  // Filter clubs where current user is the leader, unless Admin/SuperAdmin
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'ADMINISTRATOR';
  const myClubs = clubs?.filter(c => isAdmin || c.leader_id === user?.id || user?.led_club_ids?.includes(c.id)) || [];

  const [formData, setFormData] = useState({
    club_id: '',
    title: '',
    description: '',
    event_date: '',
    registration_deadline: '',
    venue: '',
    capacity: 50,
    proposed_budget: 0,
    budget_breakdown: ''
  });
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (data: any) => createEventRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventRequests'] });
      alert('Event proposal submitted to the Admin for approval!');
      navigate('/club-leader/event-requests');
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail || 'Failed to submit event proposal');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.club_id) {
      setError('Please select a club');
      return;
    }

    mutation.mutate({
      club_id: Number(formData.club_id),
      title: formData.title,
      description: formData.description,
      event_date: new Date(formData.event_date).toISOString(),
      registration_deadline: formData.registration_deadline
        ? new Date(formData.registration_deadline).toISOString()
        : undefined,
      venue: formData.venue,
      capacity: Number(formData.capacity),
      proposed_budget: Number(formData.proposed_budget),
      budget_breakdown: formData.budget_breakdown
    });
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: "bold" }}>
          Submit Event Proposal (Club Leader)
        </Typography>
        <Typography variant="body2" color="text.secondary">
          As a Club Leader, you can propose events for your club. Once submitted, the Admin will review your proposal, publish the event, and request budget allocation from the Super Admin.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {myClubs.length === 0 && !isAdmin ? (
        <Alert severity="warning">
          You are currently not designated as the Leader for any active club. Only Club Leaders can propose events.
        </Alert>
      ) : (
        <Card elevation={2}>
          <CardContent sx={{ p: 4 }}>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    select
                    fullWidth
                    required
                    label="Select Your Club"
                    value={formData.club_id}
                    onChange={(e) => setFormData({ ...formData, club_id: e.target.value })}
                  >
                    {myClubs.map((club) => (
                      <MenuItem key={club.id} value={club.id}>
                        {club.name} (Club #{club.id})
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    required
                    label="Event Title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Annual Hackathon 2026, Robotics Workshop"
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    required
                    multiline
                    rows={3}
                    label="Event Description & Objectives"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    required
                    type="datetime-local"
                    slotProps={{ inputLabel: { shrink: true } }}
                    label="Event Date & Time"
                    value={formData.event_date}
                    onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    type="datetime-local"
                    slotProps={{ inputLabel: { shrink: true } }}
                    label="Registration Deadline"
                    value={formData.registration_deadline}
                    onChange={(e) => setFormData({ ...formData, registration_deadline: e.target.value })}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    required
                    label="Proposed Venue"
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    placeholder="e.g. Auditorium Hall B, Room 301"
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    required
                    type="number"
                    label="Estimated Capacity"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                  />
                </Grid>

                {/* Budget Section */}
                <Grid size={{ xs: 12 }}>
                  <Typography variant="h6" sx={{ mt: 2, mb: 1 }} color="primary">
                    Budget Request Details
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Specify the funds needed. The Admin will use this amount to create a formal budget request for the Super Admin.
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    required
                    type="number"
                    label="Requested Budget Amount"
                    value={formData.proposed_budget}
                    onChange={(e) => setFormData({ ...formData, proposed_budget: parseFloat(e.target.value) || 0 })}
                    slotProps={{
                      input: {
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      },
                    }}
                    helperText="Total estimated expenditure for this event"
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Budget Breakdown & Justification"
                    value={formData.budget_breakdown}
                    onChange={(e) => setFormData({ ...formData, budget_breakdown: e.target.value })}
                    placeholder="e.g. Speaker fees: $200, Food/Beverages: $150, Sound/Audio equipment: $100"
                    helperText="Detail how the requested funds will be utilized"
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    size="large"
                    fullWidth
                    sx={{ mt: 2 }}
                    disabled={mutation.isPending}
                  >
                    {mutation.isPending ? 'Submitting Proposal...' : 'Submit Event Request to Admin'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};
