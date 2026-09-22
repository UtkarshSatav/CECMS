import { useQuery } from '@tanstack/react-query';
import { getEvents } from '../../api/events';
import { Box, Typography, Grid, Card, CardContent, Button, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export const EventListPage = () => {
  const { data: events, isLoading } = useQuery({ queryKey: ['events'], queryFn: getEvents });
  const navigate = useNavigate();

  if (isLoading) return <CircularProgress />;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Events</Typography>
      <Grid container spacing={3}>
        {events?.map((event) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={event.id}>
            <Card>
              <CardContent>
                <Typography variant="h6">{event.title}</Typography>
                <Typography color="text.secondary">{new Date(event.event_date).toLocaleString()}</Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>Venue: {event.venue}</Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>Capacity: {event.registration_count || 0}/{event.capacity}</Typography>
                <Button variant="outlined" size="small" onClick={() => navigate(`/events/${event.id}`)}>View Details</Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};
