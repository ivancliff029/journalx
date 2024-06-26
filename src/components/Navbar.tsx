"use client";
import React, { useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import AddIcon from '@mui/icons-material/Add';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import { UserButton, useUser, useClerk } from '@clerk/clerk-react';
import AddJournalForm from './AddJorunalForm';
import '../styles/Navbar.css';

interface NavbarProps {
  toggleSidebar: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ toggleSidebar }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { user, isSignedIn } = useUser();
  const { signOut } = useClerk();

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleDialogOpen = () => {
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  const handleAddJournal = (title: string, content: string) => {
    // Handle adding the journal (e.g., update state or make API call)
    console.log('New Journal:', { title, content });
  };

  return (
    <>
      <AppBar position="fixed" className="navbar">
        <Toolbar>
          <IconButton size="large" edge="start" color="inherit" aria-label="menu" onClick={toggleSidebar}>
            <MenuIcon />
          </IconButton>
          <div style={{ flexGrow: 1, zIndex: 1 }}> {/* Ensure title is in front */}
            <div className="navbar-title">Journal X</div>
          </div>
          <IconButton color="inherit" onClick={handleDialogOpen}>
            <AddIcon />
          </IconButton>
          <IconButton color="inherit">
            <Brightness4Icon />
          </IconButton>
          {isSignedIn ? (
            <UserButton
              appearance={{
                elements: {
                  userButtonAvatarBox: {
                    width: 40,
                    height: 40,
                  },
                },
              }}
              afterSignOutUrl="/"
            />
          ) : (
            <IconButton color="inherit" onClick={handleMenu}>
              <AccountCircleIcon />
            </IconButton>
          )}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            {isSignedIn ? (
              <>
                <MenuItem onClick={handleClose}>Profile</MenuItem>
                <MenuItem onClick={() => signOut()}>Logout</MenuItem>
              </>
            ) : (
              <>
                <MenuItem onClick={handleClose}>Profile</MenuItem>
                <MenuItem onClick={handleClose}>Settings</MenuItem>
                <MenuItem onClick={handleClose}>Logout</MenuItem>
              </>
            )}
          </Menu>
        </Toolbar>
      </AppBar>
      <AddJournalForm
        open={dialogOpen}
        onClose={handleDialogClose}
        onAdd={handleAddJournal}
      />
    </>
  );
};

export default Navbar;
