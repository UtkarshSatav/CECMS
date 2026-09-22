import { useQuery } from '@tanstack/react-query';
import { getFacultyOverview } from '../../api/reports';
import { Box, Typography, Table, TableBody, TableCell, TableHead, TableRow, CircularProgress } from '@mui/material';

export const FacultyOverviewPage = () => {
  const { data: clubs, isLoading } = useQuery({ queryKey: ['facultyOverview'], queryFn: getFacultyOverview });

  if (isLoading) return <CircularProgress />;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Assigned Clubs Overview</Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Club Name</TableCell>
            <TableCell>Coordinator</TableCell>
            <TableCell>Members</TableCell>
            <TableCell>Events</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {clubs?.map((club: any, i: number) => (
            <TableRow key={i}>
              <TableCell>{club.club_name}</TableCell>
              <TableCell>{club.coordinator}</TableCell>
              <TableCell>{club.member_count}</TableCell>
              <TableCell>{club.event_count}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
};
