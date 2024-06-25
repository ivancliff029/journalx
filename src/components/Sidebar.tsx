import React from 'react';
import { Drawer, List, ListItem, ListItemText, Box, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { db } from '../lib/firebase';
import { doc, deleteDoc } from 'firebase/firestore';

interface SidebarProps {
  open: boolean;
  journals: { id: string; title: string }[];
  setJournals: React.Dispatch<React.SetStateAction<{ id: string; title: string }[]>>;
  onJournalClick: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open, journals, setJournals, onJournalClick }) => {
  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'journals', id));
      setJournals(prevJournals => prevJournals.filter(journal => journal.id !== id));
    } catch (error) {
      console.error('Error deleting journal:', error);
    }
  };

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
            <ListItem button key={journal.id}>
              <ListItemText primary={journal.title} onClick={() => onJournalClick(journal.id)} />
              <IconButton onClick={() => handleDelete(journal.id)} color="error">
                <DeleteIcon />
              </IconButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
