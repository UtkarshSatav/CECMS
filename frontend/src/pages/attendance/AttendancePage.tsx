import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getEvents } from '../../api/events';
import { getEventAttendance, markAttendance } from '../../api/attendance';
import { Box, Typography, TextField, MenuItem, Button, Table, TableBody, TableCell, TableHead, TableRow, Checkbox } from '@mui/material';

export const AttendancePage = () => {
  const [eventId, setEventId] = useState<number | ''>('');
  const [attendanceData, setAttendanceData] = useState<Record<number, boolean>>({});

  const { data: events } = useQuery({ queryKey: ['events'], queryFn: getEvents });
  const { data: attendanceList, refetch } = useQuery({ 
    queryKey: ['attendance', eventId], 
    queryFn: () => getEventAttendance(eventId as number),
    enabled: !!eventId
  });

  const mutation = useMutation({
    mutationFn: (records: any[]) => markAttendance(eventId as number, records),
    onSuccess: () => {
      alert('Attendance saved!');
      refetch();
    }
  });

  const handleSave = () => {
    if (!attendanceList) return;
    const records = attendanceList.map(a => ({
      registration_id: a.registration_id,
      status: attendanceData[a.registration_id] ? 'PRESENT' : 'ABSENT'
    }));
    mutation.mutate(records);
  };

  const handleToggle = (id: number) => {
    setAttendanceData(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Attendance</Typography>
      <Box sx={{ maxWidth: 400, mb: 4 }}>
        <TextField
          select
          label="Select Event"
          fullWidth
          value={eventId}
          onChange={(e) => setEventId(Number(e.target.value))}
        >
          {events?.map(ev => (
            <MenuItem key={ev.id} value={ev.id}>{ev.title}</MenuItem>
          ))}
        </TextField>
      </Box>

      {attendanceList && (
        <Box>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Student</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Present</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {attendanceList.map(a => (
                <TableRow key={a.registration_id}>
                  <TableCell>{a.student_name}</TableCell>
                  <TableCell>{a.student_email}</TableCell>
                  <TableCell>
                    <Checkbox 
                      checked={attendanceData[a.registration_id] || a.status === 'PRESENT'}
                      onChange={() => handleToggle(a.registration_id)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Button variant="contained" color="primary" sx={{ mt: 2 }} onClick={handleSave}>
            Save Attendance
          </Button>
        </Box>
      )}
    </Box>
  );
};
