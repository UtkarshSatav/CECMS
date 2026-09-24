import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  AppBar, Toolbar, Typography, Button, IconButton, Drawer, 
  List, ListItem, ListItemButton, ListItemText, Box, useMediaQuery, useTheme, Chip 
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useAuth } from '../contexts/AuthContext';

export const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const navItems = () => {
    const role = user?.role;
    const isSuper = role === 'SUPER_ADMIN' || role === 'ADMINISTRATOR';
    const isAdmin = role === 'ADMIN';
    const isStudent = role === 'STUDENT' || role === 'CLUB_COORDINATOR';

    const base = [
      { text: 'Dashboard', path: '/dashboard' },
    ];

    if (isSuper) {
      return [
        ...base,
        { text: 'Approve Clubs', path: '/admin/club-requests' },
        { text: 'Approve Budgets', path: '/admin/budget-requests' },
        { text: 'Manage Clubs', path: '/clubs/manage' },
        { text: 'Events', path: '/events' },
        { text: 'User Management', path: '/admin/users' },
        { text: 'Reports', path: '/reports' },
        { text: 'Profile', path: '/profile' }
      ];
    }

    if (isAdmin) {
      return [
        ...base,
        { text: 'Club Requests', path: '/admin/club-requests' },
        { text: 'Allot Students', path: '/clubs/manage' },
        { text: 'Event Requests', path: '/admin/event-requests' },
        { text: 'Budget Requests', path: '/admin/budget-requests' },
        { text: 'Events', path: '/events' },
        { text: 'Attendance', path: '/attendance' },
        { text: 'Create Users', path: '/admin/users' },
        { text: 'Reports', path: '/reports' },
        { text: 'Profile', path: '/profile' }
      ];
    }

    if (isStudent) {
      const studentItems = [
        ...base,
        { text: 'Clubs', path: '/clubs' },
        { text: 'Events', path: '/events' },
        { text: 'My Registrations', path: '/registrations' },
      ];

      if (user?.is_club_leader) {
        studentItems.push(
          { text: '⭐ Request Event', path: '/club-leader/create-event-request' },
          { text: '⭐ My Event Requests', path: '/club-leader/event-requests' },
          { text: '⭐ Club Attendance', path: '/attendance' }
        );
      }

      studentItems.push({ text: 'Profile', path: '/profile' });
      return studentItems;
    }

    return [...base, { text: 'Profile', path: '/profile' }];
  };

  const getRoleBadge = () => {
    if (!user) return null;
    if (user.role === 'SUPER_ADMIN' || user.role === 'ADMINISTRATOR') {
      return <Chip label="Super Admin" color="secondary" size="small" sx={{ ml: 1, fontWeight: 'bold' }} />;
    }
    if (user.role === 'ADMIN') {
      return <Chip label="Admin" color="info" size="small" sx={{ ml: 1, fontWeight: 'bold' }} />;
    }
    if (user.is_club_leader) {
      return <Chip label="⭐ Club Leader" color="warning" size="small" sx={{ ml: 1, fontWeight: 'bold' }} />;
    }
    return <Chip label="Student" color="default" size="small" sx={{ ml: 1, bgcolor: 'rgba(255,255,255,0.2)', color: '#fff' }} />;
  };

  const drawer = (
    <div>
      <Toolbar sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', py: 2 }}>
        <Typography variant="h6" noWrap sx={{ fontWeight: 'bold' }}>
          CECMS
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Campus Event & Club MS
        </Typography>
      </Toolbar>
      <List>
        {navItems().map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton 
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path);
                if (isMobile) setMobileOpen(false);
              }}
              sx={{
                '&.Mui-selected': {
                  bgcolor: 'action.selected',
                  borderLeft: '4px solid #1976d2',
                  fontWeight: 'bold'
                }
              }}
            >
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
            CECMS {getRoleBadge()}
          </Typography>
          <Typography variant="body2" sx={{ mr: 2, display: { xs: 'none', sm: 'block' } }}>
            {user?.full_name}
          </Typography>
          <Button color="inherit" onClick={() => { logout(); navigate('/login'); }}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      <Box component="nav" sx={{ width: { md: 240 }, flexShrink: { md: 0 } }}>
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={isMobile ? mobileOpen : true}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 },
          }}
        >
          {drawer}
        </Drawer>
      </Box>
      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { md: `calc(100% - 240px)` } }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};
