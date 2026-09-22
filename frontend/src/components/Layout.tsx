import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  AppBar, Toolbar, Typography, Button, IconButton, Drawer, 
  List, ListItem, ListItemButton, ListItemText, Box, useMediaQuery, useTheme 
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
    const base = [
      { text: 'Dashboard', path: '/dashboard' },
      { text: 'Profile', path: '/profile' }
    ];

    if (role === 'STUDENT') {
      return [...base, { text: 'Clubs', path: '/clubs' }, { text: 'Events', path: '/events' }, { text: 'My Registrations', path: '/registrations' }];
    }
    if (role === 'CLUB_COORDINATOR') {
      return [...base, { text: 'Events', path: '/events' }, { text: 'Create Event', path: '/events/create' }, { text: 'Manage Events', path: '/events/manage' }, { text: 'Attendance', path: '/attendance' }];
    }
    if (role === 'FACULTY_COORDINATOR') {
      return [...base, { text: 'Clubs Overview', path: '/faculty' }];
    }
    if (role === 'ADMINISTRATOR') {
      return [...base, { text: 'Manage Clubs', path: '/clubs/manage' }, { text: 'Events', path: '/events' }, { text: 'Reports', path: '/reports' }, { text: 'Create User', path: '/admin/users' }];
    }
    return base;
  };

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap>CECMS</Typography>
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
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Campus Event & Club Management System
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
