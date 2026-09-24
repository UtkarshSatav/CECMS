import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllClubs, getAvailableStudents, allotStudent, setClubLeader, getClubMembers, removeClubMember } from '../../api/clubs';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  FormControlLabel, Checkbox, Chip, CircularProgress, Paper
} from '@mui/material';

export const ManageClubsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'ADMINISTRATOR';

  const { data: clubs, isLoading } = useQuery({ queryKey: ['allClubs'], queryFn: getAllClubs });
  const { data: students } = useQuery({ queryKey: ['availableStudents'], queryFn: getAvailableStudents });

  // Allot Student Dialog State
  const [allotOpen, setAllotOpen] = useState(false);
  const [allotData, setAllotData] = useState({ club_id: '', student_id: '', is_leader: false });

  // Set Leader Dialog State
  const [leaderOpen, setLeaderOpen] = useState(false);
  const [selectedClub, setSelectedClub] = useState<any>(null);
  const [leaderStudentId, setLeaderStudentId] = useState('');

  // Members Modal State
  const [membersOpen, setMembersOpen] = useState(false);
  const [activeClubId, setActiveClubId] = useState<number | null>(null);
  const { data: members, refetch: refetchMembers } = useQuery({
    queryKey: ['clubMembers', activeClubId],
    queryFn: () => (activeClubId ? getClubMembers(activeClubId) : Promise.resolve([])),
    enabled: !!activeClubId
  });

  const allotMutation = useMutation({
    mutationFn: ({ clubId, data }: { clubId: number; data: any }) => allotStudent(clubId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allClubs'] });
      setAllotOpen(false);
      setAllotData({ club_id: '', student_id: '', is_leader: false });
      alert('Student allotted to club successfully!');
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || 'Failed to allot student');
    }
  });

  const leaderMutation = useMutation({
    mutationFn: ({ clubId, studentId }: { clubId: number; studentId: number }) => setClubLeader(clubId, studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allClubs'] });
      setLeaderOpen(false);
      alert('Club leader assigned successfully!');
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || 'Failed to assign leader');
    }
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({ clubId, studentId }: { clubId: number; studentId: number }) => removeClubMember(clubId, studentId),
    onSuccess: () => {
      refetchMembers();
      queryClient.invalidateQueries({ queryKey: ['allClubs'] });
      alert('Member removed from club');
    }
  });

  const handleAllotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    allotMutation.mutate({
      clubId: Number(allotData.club_id),
      data: {
        student_id: Number(allotData.student_id),
        is_leader: allotData.is_leader
      }
    });
  };

  const handleSetLeaderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClub || !leaderStudentId) return;
    leaderMutation.mutate({
      clubId: selectedClub.id,
      studentId: Number(leaderStudentId)
    });
  };

  if (isLoading) return <CircularProgress />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <div>
          <Typography variant="h4" sx={{ fontWeight: "bold" }}>
            Manage Clubs & Student Allotment
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Admin Portal: Allot students to clubs, assign Club Leaders, and manage club rosters.
          </Typography>
        </div>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" color="primary" onClick={() => navigate('/admin/club-requests')}>
            + Propose Club Creation
          </Button>
          <Button variant="contained" color="primary" onClick={() => setAllotOpen(true)}>
            + Allot Student to Club
          </Button>
        </Box>
      </Box>

      <Paper sx={{ overflow: 'hidden' }}>
        <Table>
          <TableHead sx={{ bgcolor: 'action.hover' }}>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Club Name</TableCell>
              <TableCell>Club Leader</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Approved Members</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {clubs?.map((club) => (
              <TableRow key={club.id}>
                <TableCell>{club.id}</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>{club.name}</TableCell>
                <TableCell>
                  {club.leader ? (
                    <Chip
                      label={`⭐ ${club.leader.full_name}`}
                      color="warning"
                      size="small"
                      variant="filled"
                      sx={{ fontWeight: 'bold' }}
                    />
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      No leader assigned
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    label={club.status || 'ACTIVE'}
                    color={club.status === 'ACTIVE' ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{club.member_count || 0} students</TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        setSelectedClub(club);
                        setLeaderStudentId(club.leader_id ? String(club.leader_id) : '');
                        setLeaderOpen(true);
                      }}
                    >
                      Assign Leader
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      color="secondary"
                      onClick={() => {
                        setActiveClubId(club.id);
                        setMembersOpen(true);
                      }}
                    >
                      View Members
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Allot Student to Club Dialog */}
      <Dialog open={allotOpen} onClose={() => setAllotOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Allot Student to Club (Admin)</DialogTitle>
        <form onSubmit={handleAllotSubmit}>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Admins can directly assign students to clubs and designate their leadership roles.
            </Typography>
            <TextField
              select
              margin="dense"
              label="Select Club"
              fullWidth
              required
              value={allotData.club_id}
              onChange={(e) => setAllotData({ ...allotData, club_id: e.target.value })}
            >
              {clubs?.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name} (Current Leader: {c.leader?.full_name || 'None'})
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              margin="dense"
              label="Select Student to Allot"
              fullWidth
              required
              value={allotData.student_id}
              onChange={(e) => setAllotData({ ...allotData, student_id: e.target.value })}
            >
              {students?.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.full_name} ({s.email})
                </MenuItem>
              ))}
            </TextField>

            <FormControlLabel
              control={
                <Checkbox
                  checked={allotData.is_leader}
                  onChange={(e) => setAllotData({ ...allotData, is_leader: e.target.checked })}
                  color="warning"
                />
              }
              label="⭐ Make this student the Club Leader (can propose events & budget)"
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAllotOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={allotMutation.isPending}>
              Allot Student
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Set Leader Dialog */}
      <Dialog open={leaderOpen} onClose={() => setLeaderOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Assign Club Leader for {selectedClub?.name}</DialogTitle>
        <form onSubmit={handleSetLeaderSubmit}>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              The Club Leader has authority to propose events with budgets on behalf of this club.
            </Typography>
            <TextField
              select
              margin="dense"
              label="Select Student Leader"
              fullWidth
              required
              value={leaderStudentId}
              onChange={(e) => setLeaderStudentId(e.target.value)}
            >
              {students?.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.full_name} ({s.email})
                </MenuItem>
              ))}
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setLeaderOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="warning" disabled={leaderMutation.isPending}>
              Set Leader
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Club Members Roster Dialog */}
      <Dialog open={membersOpen} onClose={() => setMembersOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Club Members Roster</DialogTitle>
        <DialogContent>
          {members?.length === 0 ? (
            <Typography color="text.secondary">No approved members in this club yet.</Typography>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Student Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role in Club</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {members?.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell sx={{ fontWeight: 'bold' }}>{m.student?.full_name}</TableCell>
                    <TableCell>{m.student?.email}</TableCell>
                    <TableCell>
                      {m.is_leader ? (
                        <Chip label="⭐ Club Leader" color="warning" size="small" />
                      ) : (
                        <Chip label="Member" size="small" />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {isAdmin && (
                        <Button
                          size="small"
                          color="error"
                          onClick={() =>
                            activeClubId &&
                            removeMemberMutation.mutate({
                              clubId: activeClubId,
                              studentId: m.student_id
                            })
                          }
                        >
                          Remove
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMembersOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
