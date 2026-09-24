import { useQuery } from '@tanstack/react-query';
import { getClubs, joinClub } from '../../api/clubs';
import { getParticipation } from '../../api/students';
import { Card, CardContent, Typography, Grid, Button, Box, CircularProgress, Alert, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const ClubListPage = () => {
  const { data: clubs, isLoading, error, refetch: refetchClubs } = useQuery({ queryKey: ['clubs'], queryFn: getClubs });
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: participation, refetch: refetchPart } = useQuery({
    queryKey: ['participation'],
    queryFn: getParticipation,
    enabled: user?.role === 'STUDENT'
  });

  const myMemberships = participation?.memberships || [];
  const joinedClubIds = myMemberships.filter((m: any) => m.status === 'APPROVED').map((m: any) => m.club_id);
  const pendingClubIds = myMemberships.filter((m: any) => m.status === 'PENDING').map((m: any) => m.club_id);

  const handleJoin = async (id: number) => {
    try {
      await joinClub(id);
      alert('Join request sent to the Club Leader & Admin!');
      refetchClubs();
      refetchPart();
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Failed to send join request');
    }
  };

  if (isLoading) return <CircularProgress />;
  if (error) return <Alert severity="error">Failed to load clubs</Alert>;

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: "bold" }}>Explore Campus Clubs</Typography>
        <Typography variant="body2" color="text.secondary">
          Browse active clubs, connect with Club Leaders, and participate in campus activities.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {clubs?.map((club) => {
          const isMember = joinedClubIds.includes(club.id);
          const isPending = pendingClubIds.includes(club.id);
          const isLeader = club.leader_id === user?.id || (isMember && club.leader_id === user?.id);

          return (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={club.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h5" component="div" sx={{ fontWeight: "bold" }}>
                      {club.name}
                    </Typography>
                    {isLeader && (
                      <Chip label="⭐ You are Leader" color="warning" size="small" />
                    )}
                    {isMember && !isLeader && (
                      <Chip label="Joined Member" color="success" size="small" />
                    )}
                    {isPending && (
                      <Chip label="Pending" color="default" size="small" />
                    )}
                  </Box>

                  <Typography color="text.secondary" variant="body2" gutterBottom>
                    {club.leader ? (
                      <span>Club Leader: <strong>⭐ {club.leader.full_name}</strong></span>
                    ) : (
                      <span>Club Leader: <em>To be appointed</em></span>
                    )}
                  </Typography>

                  <Typography color="text.secondary" variant="body2" gutterBottom>
                    Approved Members: <strong>{club.member_count || 0}</strong>
                  </Typography>

                  <Typography variant="body2" sx={{ my: 2, color: 'text.primary' }}>
                    {club.description}
                  </Typography>
                </CardContent>

                <Box sx={{ p: 2, pt: 0, display: 'flex', gap: 1 }}>
                  <Button variant="outlined" size="small" onClick={() => navigate(`/clubs/${club.id}`)}>
                    Club Details
                  </Button>
                  {user?.role === 'STUDENT' && !isMember && !isPending && (
                    <Button variant="contained" size="small" color="primary" onClick={() => handleJoin(club.id)}>
                      Join Club
                    </Button>
                  )}
                  {isLeader && (
                    <Button
                      variant="contained"
                      size="small"
                      color="warning"
                      onClick={() => navigate('/club-leader/create-event-request')}
                    >
                      Propose Event
                    </Button>
                  )}
                </Box>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};
