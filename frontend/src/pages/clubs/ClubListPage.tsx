import { useQuery } from '@tanstack/react-query';
import { getClubs, joinClub } from '../../api/clubs';
import { Card, CardContent, Typography, Grid, Button, Box, CircularProgress, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const ClubListPage = () => {
  const { data: clubs, isLoading, error } = useQuery({ queryKey: ['clubs'], queryFn: getClubs });
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleJoin = async (id: number) => {
    try {
      await joinClub(id);
      alert('Join request sent!');
    } catch (e) {
      alert('Failed to send join request');
    }
  };

  if (isLoading) return <CircularProgress />;
  if (error) return <Alert severity="error">Failed to load clubs</Alert>;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Clubs</Typography>
      <Grid container spacing={3}>
        {clubs?.map((club) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={club.id}>
            <Card>
              <CardContent>
                <Typography variant="h5" component="div">{club.name}</Typography>
                <Typography color="text.secondary" gutterBottom>
                  Members: {club.member_count || 0}
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  {club.description.substring(0, 100)}...
                </Typography>
                <Button size="small" onClick={() => navigate(`/clubs/${club.id}`)}>Details</Button>
                {user?.role === 'STUDENT' && (
                  <Button size="small" color="primary" onClick={() => handleJoin(club.id)}>Join</Button>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};
