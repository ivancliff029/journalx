import React, { useState, useEffect } from 'react';
import { Drawer, Typography, Box, IconButton, TextField, Button } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { db } from '../lib/firebase';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';

interface RightSidebarProps {
  open: boolean;
  onClose: () => void;
  journal: {
    id: string;
    title: string;
    description: string;
    timestamp?: Timestamp;
  } | null;
  onUpdate: (id: string, title: string, description: string) => void;
}

const RightSidebar: React.FC<RightSidebarProps> = ({ open, onClose, journal, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDescription, setEditedDescription] = useState('');

  useEffect(() => {
    if (journal) {
      setEditedTitle(journal.title);
      setEditedDescription(journal.description);
    }
  }, [journal]);

  const handleSave = async () => {
    if (journal) {
      try {
        await updateDoc(doc(db, 'journals', journal.id), {
          title: editedTitle,
          description: editedDescription,
        });
        onUpdate(journal.id, editedTitle, editedDescription);
        setIsEditing(false);
      } catch (error) {
        console.error('Error updating journal:', error);
      }
    }
  };

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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Journal Details</Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>
      {journal ? (
        <>
          {isEditing ? (
            <>
              <TextField
                fullWidth
                label="Title"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Description"
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                margin="normal"
                multiline
                rows={4}
              />
              <Button startIcon={<SaveIcon />} onClick={handleSave} variant="contained" sx={{ mt: 2 }}>
                Save
              </Button>
            </>
          ) : (
            <>
              <Typography variant="h6" gutterBottom>
                {journal.title}
              </Typography>
              <Typography variant="body1" paragraph>
                {journal.description}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                <AccessTimeIcon sx={{ mr: 1 }} />
                <Typography variant="body2">
                  {journal.timestamp 
                    ? journal.timestamp.toDate().toLocaleString() 
                    : 'Date not available'}
                </Typography>
              </Box>
              <Button startIcon={<EditIcon />} onClick={() => setIsEditing(true)} variant="outlined" sx={{ mt: 2 }}>
                Edit
              </Button>
            </>
          )}
        </>
      ) : (
        <Typography variant="body1">No journal selected</Typography>
      )}
    </Drawer>
  );
};

export default RightSidebar;