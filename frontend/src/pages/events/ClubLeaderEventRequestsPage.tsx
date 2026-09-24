import { useQuery } from '@tanstack/react-query';
import { getEventRequests } from '../../api/eventRequests';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableHead, TableRow,
  Chip, CircularProgress, Alert, Paper
} from '@mui/material';

export const ClubLeaderEventRequestsPage = () => {
  const navigate = useNavigate();

  const { data: requests, isLoading } = useQuery({
    queryKey: ['myEventRequests'],
    queryFn: () => getEventRequests()
  });

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Chip label="Approved & Published" color="success" size="small" />;
      case 'REJECTED':
        return <Chip label="Rejected" color="error" size="small" />;
      default:
        return <Chip label="Under Review by Admin" color="warning" size="small" />;
    }
  };

  if (isLoading) return <CircularProgress />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <div>
          <Typography variant="h4" sx={{ fontWeight: "bold" }}>
            My Club Event Proposals
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track the status of event proposals you've submitted to the Admin.
          </Typography>
        </div>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/club-leader/create-event-request')}
        >
          + Propose New Event
        </Button>
      </Box>

      {requests?.length === 0 ? (
        <Alert severity="info">
          You haven't submitted any event proposals yet. Click '+ Propose New Event' above to get started!
        </Alert>
      ) : (
        <Paper sx={{ overflow: 'hidden' }}>
          <Table>
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell>Event Title</TableCell>
                <TableCell>Club</TableCell>
                <TableCell>Event Date</TableCell>
                <TableCell>Venue</TableCell>
                <TableCell>Capacity</TableCell>
                <TableCell>Budget Requested</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Admin Notes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests?.map((req) => (
                <TableRow key={req.id}>
                  <TableCell sx={{ fontWeight: 'bold' }}>{req.title}</TableCell>
                  <TableCell>{req.club_name || `Club #${req.club_id}`}</TableCell>
                  <TableCell>{new Date(req.event_date).toLocaleString()}</TableCell>
                  <TableCell>{req.venue || 'TBA'}</TableCell>
                  <TableCell>{req.capacity}</TableCell>
                  <TableCell>
                    <Typography variant="subtitle2" color="primary.main" sx={{ fontWeight: "bold" }}>
                      ${req.proposed_budget.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell>{getStatusChip(req.status)}</TableCell>
                  <TableCell>
                    {req.admin_notes ? (
                      <Typography variant="body2">{req.admin_notes}</Typography>
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        No notes
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Box>
  );
};
