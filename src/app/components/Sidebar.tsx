import React from 'react';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  return (
    <Drawer
      variant="persistent"
      anchor="left"
      open={open}
      sx={{
        width: '240px',
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: '240px',
        },
      }}
    >
      <div>
        <IconButton onClick={onClose}>
          <ChevronLeftIcon />
        </IconButton>
      </div>
      <List>
        <ListItem button>
          <ListItemText primary="Journal 1" />
        </ListItem>
        <ListItem button>
          <ListItemText primary="Journal 2" />
        </ListItem>
        <ListItem button>
          <ListItemText primary="Journal 3" />
        </ListItem>
        {/* Add more journals dynamically */}
      </List>
    </Drawer>
  );
};

export default Sidebar;
