import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getClub, getClubMembers, getClubRequests, decideMembership } from '../../api/clubs';
import {
  Box, Typography, CircularProgress, Alert, Card, CardContent, Button,
  List, ListItem, ListItemText, Chip, Divider, Paper, Grid
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

export const ClubDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const clubId = parseInt(id || '0');
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: club, isLoading } = useQuery({ queryKey: ['club', clubId], queryFn: () => getClub(clubId) });
  
  const isLeader = club?.leader_id === user?.id || user?.led_club_ids?.includes(clubId);
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'ADMINISTRATOR';
  const canManage = isLeader || isAdmin;

  const { data: members, refetch: refetchMembers } = useQuery({
    queryKey: ['clubMembers', clubId],
    queryFn: () => getClubMembers(clubId)
  });

  const { data: requests, refetch: refetchRequests } = useQuery({
    queryKey: ['clubRequests', clubId],
    queryFn: () => getClubRequests(clubId),
    enabled: canManage
  });

  const handleDecision = async (membershipId: number, status: string) => {
    try {
      await decideMembership(clubId, membershipId, status);
      refetchMembers();
      refetchRequests();
      alert(`Request ${status.toLowerCase()}ed!`);
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Failed to update status');
    }
  };

  if (isLoading) return <CircularProgress />;
  if (!club) return <Alert severity="error">Club not found</Alert>;

  return (
    <Box>
      {/* Club Leader Banner */}
      {isLeader && (
        <Alert
          severity="warning"
          sx={{ mb: 3 }}
          action={
            <Button
              color="inherit"
              size="small"
              variant="outlined"
              onClick={() => navigate('/club-leader/create-event-request')}
            >
              + Propose Event
            </Button>
          }
        >
          <strong>⭐ You are the designated Club Leader for {club.name}!</strong> You can submit event proposals and request budgets from the Administration.
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: "bold" }}>{club.name}</Typography>
                <Chip label={club.status || 'ACTIVE'} color="success" />
              </Box>
              <Typography variant="body1" sx={{ mt: 2, lineHeight: 1.7 }}>
                {club.description}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ bgcolor: 'background.paper' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>Club Leadership</Typography>
              <Divider sx={{ mb: 2 }} />
              {club.leader ? (
                <Box>
                  <Typography variant="subtitle1" color="primary" sx={{ fontWeight: "bold" }}>
                    ⭐ {club.leader.full_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Club Leader
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Email: {club.leader.email}
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No student appointed as Club Leader yet.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Pending Membership Requests for Leaders / Admins */}
      {canManage && requests && requests.length > 0 && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" gutterBottom color="warning.dark" sx={{ fontWeight: "bold" }}>
            Pending Student Join Requests ({requests.length})
          </Typography>
          <List>
            {requests.map((req) => (
              <ListItem
                key={req.id}
                secondaryAction={
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      onClick={() => handleDecision(req.id, 'APPROVED')}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => handleDecision(req.id, 'REJECTED')}
                    >
                      Reject
                    </Button>
                  </Box>
                }
              >
                <ListItemText
                  primary={req.student?.full_name || `Student #${req.student_id}`}
                  secondary={`Email: ${req.student?.email || 'N/A'} • Requested on: ${req.requested_at ? new Date(req.requested_at).toLocaleDateString() : 'N/A'}`}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* Members Roster */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: "bold" }}>
          Club Members ({members?.length || 0})
        </Typography>
        {members?.length === 0 ? (
          <Typography color="text.secondary">No students in this club yet.</Typography>
        ) : (
          <List>
            {members?.map((member) => (
              <ListItem key={member.id} divider>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography sx={{ fontWeight: "bold" }}>{member.student?.full_name}</Typography>
                      {member.is_leader && (
                        <Chip label="⭐ Club Leader" color="warning" size="small" />
                      )}
                    </Box>
                  }
                  secondary={member.student?.email}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
};
