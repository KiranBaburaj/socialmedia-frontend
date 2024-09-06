import React from 'react';
import { AppBar, Toolbar, Typography, Button, IconButton, Menu, MenuItem } from '@mui/material';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../features/auth/authSlice';
import { useNavigate } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ConnectWithoutContactIcon from '@mui/icons-material/ConnectWithoutContact';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={handleMenuClick}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          MyApp
        </Typography>
        {isAuthenticated ? (
          <>
            <Button component={Link} to="/dashboard" color="inherit" startIcon={<DashboardIcon />}>
              Dashboard
            </Button>
            <Button component={Link} to="/connectroom" color="inherit" startIcon={<ConnectWithoutContactIcon />}>
              Connect Room
            </Button>
            <Button onClick={handleLogout} color="inherit" startIcon={<ExitToAppIcon />}>
              Logout
            </Button>
          </>
        ) : (
          <Button component={Link} to="/login" color="inherit">
            Login
          </Button>
        )}
      </Toolbar>

      {/* Menu for smaller screens */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {isAuthenticated && (
          <>
            <MenuItem component={Link} to="/dashboard" onClick={handleMenuClose}>
              <DashboardIcon /> Dashboard
            </MenuItem>
            <MenuItem component={Link} to="/connectroom" onClick={handleMenuClose}>
              <ConnectWithoutContactIcon /> Connect Room
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ExitToAppIcon /> Logout
            </MenuItem>
          </>
        )}
        {!isAuthenticated && (
          <MenuItem component={Link} to="/login" onClick={handleMenuClose}>
            Login
          </MenuItem>
        )}
      </Menu>
    </AppBar>
  );
};

export default Navbar;