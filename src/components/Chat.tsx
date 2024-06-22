// components/Chat.js
import React, { useState } from 'react';
import { Box, TextField, Button, Typography } from '@mui/material';

const Chat = ({ setResponseText }) => {
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input: userInput }),
    });

    const data = await res.json();
    setResponseText(data.response);
    setLoading(false);
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
