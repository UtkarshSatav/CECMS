import { useAuth } from '../contexts/AuthContext';
import { Typography, Grid, Card, CardContent, Box, Button, Chip, Alert, Paper } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { getDashboard } from '../api/reports';
import { getParticipation } from '../api/students';
import { getClubs } from '../api/clubs';
import { useNavigate } from 'react-router-dom';

export const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const isSuper = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMINISTRATOR';
  const isAdmin = user?.role === 'ADMIN';
  const isStudent = user?.role === 'STUDENT' || user?.role === 'CLUB_COORDINATOR';

  const { data: stats } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: getDashboard,
    enabled: isSuper || isAdmin
  });

  const { data: participation } = useQuery({
    queryKey: ['participation'],
    queryFn: getParticipation,
    enabled: isStudent
  });

  const { data: clubs } = useQuery({
    queryKey: ['clubs'],
    queryFn: getClubs,
    enabled: isStudent
  });

  const myClubs = clubs?.filter(c => 
    participation?.memberships?.some(m => m.club_id === c.id && m.status === 'APPROVED')
  ) || [];

  const ledClubs = clubs?.filter(c => c.leader_id === user?.id || user?.led_club_ids?.includes(c.id)) || [];

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Typography variant="h4" sx={{ fontWeight: "bold" }}>
            Welcome back, {user?.full_name}!
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Role: <strong>{user?.role?.replace('_', ' ')}</strong>
            {user?.is_club_leader && ' • ⭐ Designated Club Leader'}
          </Typography>
        </div>
      </Box>

      {/* 1. SUPER ADMIN DASHBOARD */}
      {isSuper && (
        <Box>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ bgcolor: 'secondary.light', color: 'secondary.contrastText' }}>
                <CardContent>
                  <Typography variant="body2">Pending Club Requests</Typography>
                  <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                    {stats?.pending_club_requests ?? 0}
                  </Typography>
                  <Button 
                    size="small" 
                    variant="text" 
                    sx={{ color: 'inherit', p: 0, mt: 1, textDecoration: 'underline' }}
                    onClick={() => navigate('/admin/club-requests')}
                  >
                    Review Proposals &rarr;
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                <CardContent>
                  <Typography variant="body2">Pending Budget Requests</Typography>
                  <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                    {stats?.pending_budget_requests ?? 0}
                  </Typography>
                  <Button 
                    size="small" 
                    variant="text" 
                    sx={{ color: 'inherit', p: 0, mt: 1, textDecoration: 'underline' }}
                    onClick={() => navigate('/admin/budget-requests')}
                  >
                    Authorize Budgets &rarr;
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
                <CardContent>
                  <Typography variant="body2">Total Approved Budget</Typography>
                  <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                    ${(stats?.approved_budget_total ?? 0).toLocaleString()}
                  </Typography>
                  <Typography variant="caption">All active clubs</Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ bgcolor: 'info.light', color: 'info.contrastText' }}>
                <CardContent>
                  <Typography variant="body2">System Administrators</Typography>
                  <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                    {stats?.admins ?? 1}
                  </Typography>
                  <Button 
                    size="small" 
                    variant="text" 
                    sx={{ color: 'inherit', p: 0, mt: 1, textDecoration: 'underline' }}
                    onClick={() => navigate('/admin/users')}
                  >
                    + Create Admin &rarr;
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
              Super Admin Executive Actions
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
              <Button variant="contained" color="secondary" onClick={() => navigate('/admin/club-requests')}>
                Approve Club Proposals ({stats?.pending_club_requests || 0} Pending)
              </Button>
              <Button variant="contained" color="warning" onClick={() => navigate('/admin/budget-requests')}>
                Approve Budget Requests ({stats?.pending_budget_requests || 0} Pending)
              </Button>
              <Button variant="contained" color="primary" onClick={() => navigate('/admin/users')}>
                + Create New Admin
              </Button>
              <Button variant="outlined" onClick={() => navigate('/reports')}>
                View System Reports
              </Button>
            </Box>
          </Paper>
        </Box>
      )}

      {/* 2. ADMIN DASHBOARD */}
      {isAdmin && (
        <Box>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                <CardContent>
                  <Typography variant="body2">Pending Event Requests</Typography>
                  <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                    {stats?.pending_event_requests ?? 0}
                  </Typography>
                  <Button 
                    size="small" 
                    variant="text" 
                    sx={{ color: 'inherit', p: 0, mt: 1, textDecoration: 'underline' }}
                    onClick={() => navigate('/admin/event-requests')}
                  >
                    Review Events &rarr;
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ bgcolor: 'info.light', color: 'info.contrastText' }}>
                <CardContent>
                  <Typography variant="body2">Active Campus Clubs</Typography>
                  <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                    {stats?.total_clubs ?? 0}
                  </Typography>
                  <Button 
                    size="small" 
                    variant="text" 
                    sx={{ color: 'inherit', p: 0, mt: 1, textDecoration: 'underline' }}
                    onClick={() => navigate('/clubs/manage')}
                  >
                    Allot Students &rarr;
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                <CardContent>
                  <Typography variant="body2">Pending Budget Requests</Typography>
                  <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                    {stats?.pending_budget_requests ?? 0}
                  </Typography>
                  <Button 
                    size="small" 
                    variant="text" 
                    sx={{ color: 'inherit', p: 0, mt: 1, textDecoration: 'underline' }}
                    onClick={() => navigate('/admin/budget-requests')}
                  >
                    View Status &rarr;
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
                <CardContent>
                  <Typography variant="body2">Total Published Events</Typography>
                  <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                    {stats?.total_events ?? 0}
                  </Typography>
                  <Button 
                    size="small" 
                    variant="text" 
                    sx={{ color: 'inherit', p: 0, mt: 1, textDecoration: 'underline' }}
                    onClick={() => navigate('/events')}
                  >
                    View Calendar &rarr;
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
              Admin Operations Center
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
              <Button variant="contained" color="primary" onClick={() => navigate('/admin/event-requests')}>
                Review Event Proposals ({stats?.pending_event_requests || 0} Pending)
              </Button>
              <Button variant="contained" color="secondary" onClick={() => navigate('/clubs/manage')}>
                Allot Students & Assign Leaders
              </Button>
              <Button variant="outlined" color="primary" onClick={() => navigate('/admin/club-requests')}>
                + Propose New Club to Super Admin
              </Button>
              <Button variant="outlined" color="warning" onClick={() => navigate('/admin/budget-requests')}>
                + Create Budget Request
              </Button>
            </Box>
          </Paper>
        </Box>
      )}

      {/* 3. STUDENT & CLUB LEADER DASHBOARD */}
      {isStudent && (
        <Box>
          {/* Club Leader Banner */}
          {user?.is_club_leader && (
            <Card sx={{ mb: 4, bgcolor: '#fff8e1', border: '1px solid #ffe082' }}>
              <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h5" color="#b78103" sx={{ fontWeight: "bold" }}>
                    ⭐ Club Leader Command Center
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    You are the designated leader for: <strong>{ledClubs.map(c => c.name).join(', ') || 'Your Club'}</strong>. You have permissions to submit event proposals with estimated budgets to the Admin!
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  color="warning"
                  onClick={() => navigate('/club-leader/create-event-request')}
                >
                  + Propose Event with Budget
                </Button>
              </CardContent>
            </Card>
          )}

          {/* My Clubs & Leaders */}
          <Typography variant="h5" gutterBottom sx={{ fontWeight: "bold" }}>
            My Clubs & Club Leaders
          </Typography>
          {myClubs.length === 0 ? (
            <Alert severity="info" sx={{ mb: 3 }}>
              You haven't joined any clubs yet. <Button onClick={() => navigate('/clubs')}>Browse clubs</Button> to find and join clubs led by student leaders!
            </Alert>
          ) : (
            <Grid container spacing={2} sx={{ mb: 4 }}>
              {myClubs.map((club) => (
                <Grid size={{ xs: 12, sm: 6 }} key={club.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" sx={{ fontWeight: "bold" }}>{club.name}</Typography>
                        {club.leader_id === user?.id ? (
                          <Chip label="⭐ You are Leader" color="warning" size="small" />
                        ) : (
                          <Chip label="Member" color="primary" size="small" />
                        )}
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Club Leader: <strong>{club.leader ? `⭐ ${club.leader.full_name}` : 'To be assigned'}</strong>
                      </Typography>
                      {club.leader?.email && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                          Leader Email: {club.leader.email}
                        </Typography>
                      )}
                      <Button size="small" sx={{ mt: 1 }} onClick={() => navigate(`/clubs/${club.id}`)}>
                        View Club Details
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          {/* Quick Shortcuts */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
              Quick Student Actions
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
              <Button variant="contained" onClick={() => navigate('/events')}>
                Browse Upcoming Events
              </Button>
              <Button variant="outlined" onClick={() => navigate('/registrations')}>
                My Event Registrations
              </Button>
              <Button variant="outlined" onClick={() => navigate('/clubs')}>
                Explore Clubs
              </Button>
              {user?.is_club_leader && (
                <Button variant="outlined" color="warning" onClick={() => navigate('/club-leader/event-requests')}>
                  Track My Event Proposals
                </Button>
              )}
            </Box>
          </Paper>
        </Box>
      )}
    </Box>
  );
};
