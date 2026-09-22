import { useEffect } from 'react';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProfile, updateProfile, getParticipation } from '../../api/students';
import { Box, Typography, Card, CardContent, TextField, Button, CircularProgress, Tabs, Tab } from '@mui/material';

export const ProfilePage = () => {
  const queryClient = useQueryClient();
  const { data: profile, isLoading: loadingProfile } = useQuery({ queryKey: ['profile'], queryFn: getProfile });
  const { data: participation, isLoading: loadingPart } = useQuery({ queryKey: ['participation'], queryFn: getParticipation });
  
  const [name, setName] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [tab, setTab] = useState(0);

  const updateMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setEditMode(false);
    }
  });

  useEffect(() => {
    if (profile) setName(profile.full_name);
  }, [profile]);

  if (loadingProfile || loadingPart) return <CircularProgress />;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>My Profile</Typography>
      <Card sx={{ mb: 4, maxWidth: 600 }}>
        <CardContent>
          <Typography color="text.secondary">Email: {profile?.email}</Typography>
          <Typography color="text.secondary">Role: {profile?.role}</Typography>
          
          {editMode ? (
            <Box    sx={{   mt: 2 , display: "flex" , gap: 2 }}>
              <TextField value={name} onChange={e => setName(e.target.value)} size="small" />
              <Button variant="contained" onClick={() => updateMutation.mutate({ full_name: name })}>Save</Button>
              <Button onClick={() => setEditMode(false)}>Cancel</Button>
            </Box>
          ) : (
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography>Name: {profile?.full_name}</Typography>
              <Button size="small" variant="outlined" onClick={() => setEditMode(true)}>Edit</Button>
            </Box>
          )}
        </CardContent>
      </Card>

      <Typography variant="h5" gutterBottom>Participation History</Typography>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Clubs" />
        <Tab label="Events" />
      </Tabs>

      {tab === 0 && (
        <Box>
          {participation?.memberships.map((m: any) => (
            <Card key={m.id} sx={{ mb: 2 }}>
              <CardContent>
                <Typography>Club ID: {m.club_id}</Typography>
                <Typography>Status: {m.status}</Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {tab === 1 && (
        <Box>
          {participation?.registrations.map((r: any) => (
            <Card key={r.id} sx={{ mb: 2 }}>
              <CardContent>
                <Typography>Event ID: {r.event_id}</Typography>
                <Typography>Status: {r.status}</Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
};
