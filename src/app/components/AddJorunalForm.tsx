import React, { useState } from 'react';
import { Box, Button, TextField, Dialog, DialogActions, DialogContent, DialogTitle, Typography, Grid } from '@mui/material';

interface AddJournalFormProps {
  open: boolean;
  onClose: () => void;
  onAdd: (title: string, content: string, emotion: string) => void;
}

const emotions = [
  { label: 'Passion', color: 'red' },
  { label: 'Excitement', color: 'red' },
  { label: 'Love', color: 'red' },
  { label: 'Soft', color: 'pink' },
  { label: 'Reserved', color: 'pink' },
  { label: 'Earthy', color: 'pink' },
  { label: 'Mysterious', color: 'purple' },
  { label: 'Noble', color: 'purple' },
  { label: 'Glamorous', color: 'purple' },
  { label: 'Wisdom', color: 'blue' },
  { label: 'Hope', color: 'blue' },
  { label: 'Reason', color: 'blue' },
  { label: 'Peace', color: 'blue' },
  { label: 'Nature', color: 'green' },
  { label: 'Growth', color: 'green' },
  { label: 'Freshness', color: 'green' },
  { label: 'Hope', color: 'yellow' },
  { label: 'Joy', color: 'yellow' },
  { label: 'Danger', color: 'yellow' },
  { label: 'Warmth', color: 'orange' },
  { label: 'Kindness', color: 'orange' },
  { label: 'Joy', color: 'orange' },
  { label: 'Truth', color: 'white' },
  { label: 'Indifference', color: 'white' },
  { label: 'Noble', color: 'black' },
  { label: 'Mysterious', color: 'black' },
  { label: 'Cold', color: 'black' },
];

const AddJournalForm: React.FC<AddJournalFormProps> = ({ open, onClose, onAdd }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedEmotion, setSelectedEmotion] = useState('');

  const handleSubmit = () => {
    onAdd(title, content, selectedEmotion);
    setTitle('');
    setContent('');
    setSelectedEmotion('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Add New Journal</DialogTitle>
      <DialogContent>
        <Box component="form" sx={{ mt: 2 }}>
          <TextField
            label="Title"
            fullWidth
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            margin="normal"
          />
          <TextField
            label="Content"
            fullWidth
            multiline
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            margin="normal"
          />
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6">How do you feel right now?</Typography>
            <Grid container spacing={1} sx={{ mt: 1 }}>
              {emotions.map((emotion, index) => (
                <Grid item key={index}>
                  <Button
                    variant="contained"
                    sx={{ backgroundColor: emotion.color }}
                    onClick={() => setSelectedEmotion(emotion.label)}
                  >
                    {emotion.label}
                  </Button>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddJournalForm;
