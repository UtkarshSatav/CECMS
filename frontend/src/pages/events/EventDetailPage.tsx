import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEvent } from '../../api/events';
import { registerForEvent } from '../../api/registrations';
import { Box, Typography, Card, CardContent, Button, CircularProgress, Alert } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

export const EventDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const eventId = parseInt(id || '0');
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: event, isLoading } = useQuery({ queryKey: ['event', eventId], queryFn: () => getEvent(eventId) });

  const registerMutation = useMutation({
    mutationFn: () => registerForEvent(eventId),
    onSuccess: () => {
      alert('Registered successfully!');
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.detail || 'Failed to register');
    }
  });

  if (isLoading) return <CircularProgress />;
  if (!event) return <Alert severity="error">Event not found</Alert>;

  return (
    <Box>
      <Card>
        <CardContent>
          <Typography variant="h4" gutterBottom>{event.title}</Typography>
          <Typography color="text.secondary">Date: {new Date(event.event_date).toLocaleString()}</Typography>
          <Typography color="text.secondary">Venue: {event.venue}</Typography>
          <Typography color="text.secondary">Deadline: {event.registration_deadline ? new Date(event.registration_deadline).toLocaleString() : 'N/A'}</Typography>
          <Typography sx={{ mt: 2, mb: 2 }}>{event.description}</Typography>
          
          <Typography variant="body2" sx={{ mb: 2, fontWeight: 'bold' }}>
            Registrations: {event.registration_count || 0} / {event.capacity}
          </Typography>

          {user?.role === 'STUDENT' && (
            <Button 
              variant="contained" 
              color="primary" 
              onClick={() => registerMutation.mutate()}
              disabled={registerMutation.isPending || (event.registration_count || 0) >= event.capacity}
            >
              {registerMutation.isPending ? 'Registering...' : 'Register'}
            </Button>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};
