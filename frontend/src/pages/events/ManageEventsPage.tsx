import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEvents, cancelEvent } from '../../api/events';
import { Box, Typography, Table, TableBody, TableCell, TableHead, TableRow, Button, CircularProgress } from '@mui/material';

export const ManageEventsPage = () => {
  const queryClient = useQueryClient();
  const { data: events, isLoading } = useQuery({ queryKey: ['events'], queryFn: getEvents });

  const cancelMutation = useMutation({
    mutationFn: cancelEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    }
  });

  if (isLoading) return <CircularProgress />;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Manage Events</Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Title</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {events?.map(event => (
            <TableRow key={event.id}>
              <TableCell>{event.title}</TableCell>
              <TableCell>{new Date(event.event_date).toLocaleString()}</TableCell>
              <TableCell>{event.status}</TableCell>
              <TableCell>
                <Button 
                  size="small" 
                  color="error" 
                  onClick={() => cancelMutation.mutate(event.id)}
                  disabled={event.status === 'CANCELLED'}
                >
                  Cancel Event
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
};
