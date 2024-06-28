import React from 'react';
import { Drawer, Typography, Box, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface RightSidebarProps {
  open: boolean;
  onClose: () => void;
  journal: {
    title: string;
    description: string;
  } | null;
}

const RightSidebar: React.FC<RightSidebarProps> = ({ open, onClose, journal }) => {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: '300px',
          padding: '20px',
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>
      {journal ? (
        <>
          <Typography variant="h6" gutterBottom>
            {journal.title}
          </Typography>
          <Typography variant="body1">
            {journal.description}
          </Typography>
        </>
      ) : (
        <Typography variant="body1">No journal selected</Typography>
      )}
    </Drawer>
  );
};

export default RightSidebar;