import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getClubs, createClub, updateClub } from '../../api/clubs';
import { Box, Typography, Button, Table, TableBody, TableCell, TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions, TextField, CircularProgress } from '@mui/material';

export const ManageClubsPage = () => {
  const queryClient = useQueryClient();
  const { data: clubs, isLoading } = useQuery({ queryKey: ['clubs'], queryFn: getClubs });
  const [open, setOpen] = useState(false);
  const [currentClub, setCurrentClub] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  const createMutation = useMutation({
    mutationFn: createClub,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
      setOpen(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: number, params: any }) => updateClub(data.id, data.params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
      setOpen(false);
    }
  });

  const handleOpen = (club: any = null) => {
    setCurrentClub(club);
    setFormData(club ? { name: club.name, description: club.description } : { name: '', description: '' });
    setOpen(true);
  };

  const handleSave = () => {
    if (currentClub) {
      updateMutation.mutate({ id: currentClub.id, params: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  if (isLoading) return <CircularProgress />;

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Manage Clubs</Typography>
        <Button variant="contained" onClick={() => handleOpen()}>Create Club</Button>
      </Box>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>Description</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {clubs?.map(club => (
            <TableRow key={club.id}>
              <TableCell>{club.id}</TableCell>
              <TableCell>{club.name}</TableCell>
              <TableCell>{club.description}</TableCell>
              <TableCell>{club.status}</TableCell>
              <TableCell>
                <Button size="small" onClick={() => handleOpen(club)}>Edit</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>{currentClub ? 'Edit Club' : 'Create Club'}</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Name"
            fullWidth
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={createMutation.isPending || updateMutation.isPending}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
