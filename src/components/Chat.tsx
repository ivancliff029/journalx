
import React, { useState, FormEvent } from 'react';
import { Box, TextField, Button } from '@mui/material';

interface ChatProps {
  setResponseText: (response: string) => void;
  journalId :string;
}

const Chat: React.FC<ChatProps> = ({ setResponseText, journalId }) => {
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
        body: JSON.stringify({ input: userInput, journalId }),
    });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      setResponseText(data.response);
    } catch (error) {
      console.error('Error fetching data:', error);
      setResponseText('Error: Could not fetch response');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        label="Enter your message"
        variant="outlined"
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        fullWidth
      />
      <Button type="submit" variant="contained" color="primary" disabled={loading}>
        {loading ? 'Loading...' : 'Send'}
      </Button>
    </Box>
  );
};

export default Chat;
