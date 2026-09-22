import { useAuth } from '../contexts/AuthContext';
import { Typography, Grid, Card, CardContent } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { getDashboard } from '../api/reports';

export const DashboardPage = () => {
  const { user } = useAuth();
  
  const { data: stats } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: getDashboard,
    enabled: user?.role === 'ADMINISTRATOR'
  });

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Welcome, {user?.full_name}!
      </Typography>
      <Typography variant="subtitle1" gutterBottom>
        Role: {user?.role.replace('_', ' ')}
      </Typography>

      {user?.role === 'ADMINISTRATOR' && stats && (
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card><CardContent><Typography color="textSecondary" gutterBottom>Total Clubs</Typography><Typography variant="h5">{stats.total_clubs}</Typography></CardContent></Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card><CardContent><Typography color="textSecondary" gutterBottom>Total Events</Typography><Typography variant="h5">{stats.total_events}</Typography></CardContent></Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card><CardContent><Typography color="textSecondary" gutterBottom>Total Students</Typography><Typography variant="h5">{stats.total_students}</Typography></CardContent></Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card><CardContent><Typography color="textSecondary" gutterBottom>Total Registrations</Typography><Typography variant="h5">{stats.total_registrations}</Typography></CardContent></Card>
          </Grid>
        </Grid>
      )}

      {user?.role === 'STUDENT' && (
        <Typography variant="body1" sx={{ mt: 2 }}>
          Use the navigation menu to browse clubs, view upcoming events, and manage your registrations.
        </Typography>
      )}
    </div>
  );
};
