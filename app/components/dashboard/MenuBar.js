import React from 'react';
import NoteIcon from '@mui/icons-material/Note';
import MicIcon from '@mui/icons-material/Mic';
import VideocamIcon from '@mui/icons-material/Videocam';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { Box, IconButton } from '@mui/material';

const IconSet = () => {
  const icons = [
    { id: 1, icon: <NoteIcon />, label: 'Notes' },
    { id: 2, icon: <MicIcon />, label: 'Voice' },
    { id: 3, icon: <VideocamIcon />, label: 'Video' },
    { id: 4, icon: <AccountCircleIcon />, label: 'Stoic Avatar' },
  ];

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 2,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 2,
        flexWrap: 'wrap', // Allow icons to wrap on smaller screens
      }}
    >
      {icons.map((item) => (
        <IconButton
          key={item.id}
          sx={{
            border: '2px solid #ccc',
            borderRadius: '50%',
            padding: 2,
            transition: 'all 0.3s ease',
            '&:hover': {
              borderColor: '#000',
              backgroundColor: '#f0f0f0',
            },
            width: { xs: '56px', sm: '64px' }, // Responsive width for buttons
            height: { xs: '56px', sm: '64px' }, // Responsive height for buttons
            fontSize: { xs: '1.5rem', sm: '2rem' }, // Responsive icon size
          }}
          aria-label={item.label}
        >
          {item.icon}
        </IconButton>
      ))}
    </Box>
  );
};

export default IconSet;
