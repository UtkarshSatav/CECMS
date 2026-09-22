import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyRegistrations, cancelRegistration } from '../../api/registrations';
import { Box, Typography, Table, TableBody, TableCell, TableHead, TableRow, Button, CircularProgress } from '@mui/material';

export const MyRegistrationsPage = () => {
  const queryClient = useQueryClient();
  const { data: registrations, isLoading } = useQuery({ queryKey: ['myRegistrations'], queryFn: getMyRegistrations });

  const cancelMutation = useMutation({
    mutationFn: cancelRegistration,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myRegistrations'] });
    }
  });

  if (isLoading) return <CircularProgress />;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>My Registrations</Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Event</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {registrations?.map(reg => (
            <TableRow key={reg.id}>
              <TableCell>{reg.event?.title}</TableCell>
              <TableCell>{reg.event ? new Date(reg.event.event_date).toLocaleString() : ''}</TableCell>
              <TableCell>{reg.status}</TableCell>
              <TableCell>
                <Button 
                  size="small" 
                  color="error" 
                  onClick={() => cancelMutation.mutate(reg.event_id)}
                  disabled={reg.status === 'CANCELLED'}
                >
                  Cancel
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
};
