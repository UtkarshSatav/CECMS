import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getClub, getClubMembers, getClubRequests, decideMembership } from '../../api/clubs';
import { Box, Typography, CircularProgress, Alert, Card, CardContent, Button, List, ListItem, ListItemText } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

export const ClubDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const clubId = parseInt(id || '0');
  const { user } = useAuth();

  const { data: club, isLoading } = useQuery({ queryKey: ['club', clubId], queryFn: () => getClub(clubId) });
  const { data: members, refetch: refetchMembers } = useQuery({ queryKey: ['clubMembers', clubId], queryFn: () => getClubMembers(clubId), enabled: user?.role === 'CLUB_COORDINATOR' || user?.role === 'ADMINISTRATOR' });
  const { data: requests, refetch: refetchRequests } = useQuery({ queryKey: ['clubRequests', clubId], queryFn: () => getClubRequests(clubId), enabled: user?.role === 'CLUB_COORDINATOR' });

  const handleDecision = async (membershipId: number, status: string) => {
    try {
      await decideMembership(clubId, membershipId, status);
      refetchMembers();
      refetchRequests();
    } catch (e) {
      alert('Failed to update status');
    }
  };

  if (isLoading) return <CircularProgress />;
  if (!club) return <Alert severity="error">Club not found</Alert>;

  return (
    <Box>
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h4">{club.name}</Typography>
          <Typography color="text.secondary" gutterBottom>Status: {club.status}</Typography>
          <Typography variant="body1" sx={{ mt: 2 }}>{club.description}</Typography>
        </CardContent>
      </Card>

      {user?.role === 'CLUB_COORDINATOR' && requests && requests.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom>Pending Requests</Typography>
          <List>
            {requests.map(req => (
              <ListItem key={req.id}>
                <ListItemText primary={req.student?.full_name} secondary={req.student?.email} />
                <Button color="success" onClick={() => handleDecision(req.id, 'APPROVED')}>Approve</Button>
                <Button color="error" onClick={() => handleDecision(req.id, 'REJECTED')}>Reject</Button>
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {(user?.role === 'CLUB_COORDINATOR' || user?.role === 'ADMINISTRATOR') && (
        <Box>
          <Typography variant="h5" gutterBottom>Members</Typography>
          <List>
            {members?.map(member => (
              <ListItem key={member.id}>
                <ListItemText primary={member.student?.full_name} secondary={`${member.student?.email} - Joined: ${member.joined_at}`} />
              </ListItem>
            ))}
          </List>
        </Box>
      )}
    </Box>
  );
};
