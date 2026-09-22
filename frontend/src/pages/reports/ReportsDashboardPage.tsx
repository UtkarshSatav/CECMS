import { useQuery } from '@tanstack/react-query';
import { getClubReports, getEventReports } from '../../api/reports';
import { Box, Typography, Table, TableBody, TableCell, TableHead, TableRow, CircularProgress } from '@mui/material';

export const ReportsDashboardPage = () => {
  const { data: clubs, isLoading: loadingClubs } = useQuery({ queryKey: ['clubReports'], queryFn: getClubReports });
  const { data: events, isLoading: loadingEvents } = useQuery({ queryKey: ['eventReports'], queryFn: getEventReports });

  if (loadingClubs || loadingEvents) return <CircularProgress />;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Reports Dashboard</Typography>
      
      <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>Clubs Overview</Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Club Name</TableCell>
            <TableCell>Members</TableCell>
            <TableCell>Events</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {clubs?.map((club: any, i: number) => (
            <TableRow key={i}>
              <TableCell>{club.club_name}</TableCell>
              <TableCell>{club.member_count}</TableCell>
              <TableCell>{club.event_count}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>Events Overview</Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Event Title</TableCell>
            <TableCell>Club</TableCell>
            <TableCell>Registrations</TableCell>
            <TableCell>Attendance Rate</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {events?.map((event: any, i: number) => (
            <TableRow key={i}>
              <TableCell>{event.event_title}</TableCell>
              <TableCell>{event.club_name}</TableCell>
              <TableCell>{event.registrations}</TableCell>
              <TableCell>{event.attendance_rate}%</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
};
