import React from 'react';
import { Drawer, List, ListItem, ListItemText, Box } from '@mui/material';

interface SidebarProps {
  open: boolean;
  journals: { id: string, title: string }[];
  setJournals: React.Dispatch<React.SetStateAction<{ id: string, title: string }[]>>;
  onJournalClick: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open, journals, setJournals, onJournalClick }) => {
  return (
    <Drawer
      variant="persistent"
      open={open}
      sx={{
        '& .MuiDrawer-paper': {
          top: '64px', 
          width: '240px',
        },
      }}
    >
      <Box sx={{ width: 240 }}>
        <List>
          {journals.map((journal) => (
            <ListItem button key={journal.id} onClick={() => onJournalClick(journal.id)}>
              <ListItemText primary={journal.title} />
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
