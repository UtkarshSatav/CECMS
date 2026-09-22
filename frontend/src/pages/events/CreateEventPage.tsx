import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createEvent } from '../../api/events';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, TextField, Button, Card, CardContent } from '@mui/material';

export const CreateEventPage = () => {
  const [formData, setFormData] = useState({
    title: '', description: '', event_date: '', venue: '', capacity: 0, registration_deadline: '', club_id: 1 // hardcoded for simple flow, typically selected
  });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      navigate('/events/manage');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      ...formData,
      event_date: new Date(formData.event_date).toISOString(),
      registration_deadline: new Date(formData.registration_deadline).toISOString(),
    });
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Create Event</Typography>
      <Card sx={{ maxWidth: 600 }}>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <TextField fullWidth margin="normal" label="Title" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required />
            <TextField fullWidth margin="normal" label="Description" multiline rows={4} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} required />
            <TextField fullWidth margin="normal" label="Event Date" type="datetime-local" slotProps={{ inputLabel: { shrink: true } }} value={formData.event_date} onChange={e => setFormData({ ...formData, event_date: e.target.value })} required />
            <TextField fullWidth margin="normal" label="Registration Deadline" type="datetime-local" slotProps={{ inputLabel: { shrink: true } }} value={formData.registration_deadline} onChange={e => setFormData({ ...formData, registration_deadline: e.target.value })} required />
            <TextField fullWidth margin="normal" label="Venue" value={formData.venue} onChange={e => setFormData({ ...formData, venue: e.target.value })} required />
            <TextField fullWidth margin="normal" label="Capacity" type="number" value={formData.capacity} onChange={e => setFormData({ ...formData, capacity: parseInt(e.target.value) })} required />
            <TextField fullWidth margin="normal" label="Club ID" type="number" value={formData.club_id} onChange={e => setFormData({ ...formData, club_id: parseInt(e.target.value) })} required />
            
            <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }} disabled={mutation.isPending}>
              Create
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};
