import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  SelectChangeEvent,
} from '@mui/material';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import BookIcon from '@mui/icons-material/Book';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';

interface AddJournalFormProps {
  open: boolean;
  onClose: () => void;
  onAdd: (title: string, content: string, emotion: string, stoicQuote: string) => void;
}

const emotions = [
  { label: 'Passion', color: 'red', icon: '❤️' },
  { label: 'Excitement', color: 'red', icon: '🎉' },
  { label: 'Love', color: 'red', icon: '💕' },
  { label: 'Soft', color: 'pink', icon: '🌸' },
  { label: 'Reserved', color: 'pink', icon: '🤐' },
  { label: 'Earthy', color: 'pink', icon: '🌍' },
  { label: 'Mysterious', color: 'purple', icon: '🔮' },
  { label: 'Noble', color: 'purple', icon: '👑' },
  { label: 'Glamorous', color: 'purple', icon: '✨' },
  { label: 'Wisdom', color: 'blue', icon: '🧠' },
  { label: 'Hope', color: 'blue', icon: '🙏' },
  { label: 'Reason', color: 'blue', icon: '🤔' },
  { label: 'Peace', color: 'blue', icon: '🕊️' },
  { label: 'Nature', color: 'green', icon: '🌿' },
  { label: 'Growth', color: 'green', icon: '🌱' },
  { label: 'Freshness', color: 'green', icon: '🍃' },
  { label: 'Hope', color: 'yellow', icon: '🌟' },
  { label: 'Joy', color: 'yellow', icon: '😊' },
  { label: 'Danger', color: 'yellow', icon: '⚠️' },
  { label: 'Warmth', color: 'orange', icon: '🌞' },
  { label: 'Kindness', color: 'orange', icon: '😊' },
  { label: 'Joy', color: 'orange', icon: '😁' },
  { label: 'Truth', color: 'white', icon: '⚪' },
  { label: 'Indifference', color: 'white', icon: '😐' },
  { label: 'Noble', color: 'black', icon: '🖤' },
  { label: 'Mysterious', color: 'black', icon: '🖤' },
  { label: 'Cold', color: 'black', icon: '❄️' },
];

const AddJournalForm: React.FC<AddJournalFormProps> = ({ open, onClose, onAdd }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedEmotion, setSelectedEmotion] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState('');
  const [descriptionPlaceholder, setDescriptionPlaceholder] = useState("What's on your mind?");
  const [stoicQuote, setStoicQuote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    setIsActive(value.length > 0 || selectedEmotion.length > 0 || selectedActivity.length > 0);
    if (e.target.id === 'title') {
      setTitle(value);
    } else {
      setContent(value);
    }
  };

  const handleEmotionChange = (event: SelectChangeEvent<string>) => {
    setSelectedEmotion(event.target.value);
    setIsActive(title.length > 0 || content.length > 0 || event.target.value !== '' || selectedActivity.length > 0);
  };

  const handleActivityClick = (activity: string) => {
    setSelectedActivity(activity);
    setDescriptionPlaceholder('Comment on activity');
    setIsActive(true);
  };

  const handleKeyboardClick = () => {
    setSelectedActivity('');
    setDescriptionPlaceholder("What's on your mind?");
    setIsActive(title.length > 0 || content.length > 0 || selectedEmotion.length > 0);
  };

  const handleSubmit = async () => {
    setLoading(true);
  
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description: content }),
      });
  
      if (!response.ok) {
        const errorData: { details?: string } = await response.json(); // Type assertion
        throw new Error(errorData.details || 'Error communicating with Gemini');
      }
  
      const result = await response.json();
      const quote: string = result.response; // Type assertion
  
      console.log('Received stoic quote:', quote);
  
      setStoicQuote(quote);
      onAdd(title, content, selectedEmotion, quote);
    } catch (error: unknown) { // Catching with unknown type
      if (error instanceof Error) {
        console.error('Error fetching data:', error.message, error.stack);
      } else {
        console.error('Unexpected error:', error);
      }
    } finally {
      setLoading(false);
      onClose();
    }
  };
  

  return (
    <Dialog open={open} onClose={onClose}>
      <Box display="flex" justifyContent="space-between" alignItems="center" p={2}>
        <KeyboardIcon onClick={handleKeyboardClick} sx={{ cursor: 'pointer', border: selectedActivity === '' ? '2px solid blue' : 'none' }} />
        <Box display="flex" gap={1}>
          <FitnessCenterIcon
            onClick={() => handleActivityClick('gym')}
            sx={{ border: selectedActivity === 'gym' ? '2px solid blue' : 'none', cursor: 'pointer' }}
          />
          <BookIcon
            onClick={() => handleActivityClick('reading')}
            sx={{ border: selectedActivity === 'reading' ? '2px solid blue' : 'none', cursor: 'pointer' }}
          />
          <DirectionsRunIcon
            onClick={() => handleActivityClick('jogging')}
            sx={{ border: selectedActivity === 'jogging' ? '2px solid blue' : 'none', cursor: 'pointer' }}
          />
        </Box>
      </Box>
      <DialogTitle>What's on your mind?</DialogTitle>
      <DialogContent>
        <Box component="form" sx={{ mt: 2 }}>
          <TextField
            id="title"
            label="Title"
            fullWidth
            value={title}
            onChange={handleInputChange}
            margin="normal"
          />
          <TextField
            id="description"
            label="Description"
            fullWidth
            multiline
            rows={4}
            value={content}
            onChange={handleInputChange}
            margin="normal"
            placeholder={descriptionPlaceholder}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Emotion</InputLabel>
          <Select
            value={selectedEmotion}
            onChange={handleEmotionChange}
            displayEmpty
          >
            {emotions.map((emotion, index) => (
              <MenuItem key={index} value={emotion.label}>
                {emotion.icon} {emotion.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={!isActive || loading} color="primary">
          {loading ? 'Submitting...' : 'Submit'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddJournalForm;
