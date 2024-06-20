import React from 'react';
import { Drawer, List, ListItem, ListItemText, Box } from '@mui/material';

interface SidebarProps {
  open: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ open }) => {
  return (
    <Drawer
      variant="persistent"
      open={open}
      sx={{
        '& .MuiDrawer-paper': {
          top: '64px', // Adjust based on the height of the Navbar
          width: '240px',
        },
      }}
    >
      <Box sx={{ width: 240 }}>
        <List>
          {/* List items for previous journals can be added here */}
          <ListItem button>
            <ListItemText primary="Journal 1" />
          </ListItem>
          <ListItem button>
            <ListItemText primary="Journal 2" />
          </ListItem>
          {/* Add more ListItems as needed */}
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
