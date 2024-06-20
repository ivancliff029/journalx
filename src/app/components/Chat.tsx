import React from 'react';
import { Container, Box, Typography, TextField, Button } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

const Chat = () => {
  return (
    <Container maxWidth="md">
      <Box my={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Chat Area
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Box sx={{ width: '100%', maxWidth: 600 }}>
            {/* Chat messages can be added here */}
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Type a message"
                sx={{ mr: 2 }}
              />
              <Button variant="contained" color="primary" endIcon={<SendIcon />}>
                Send
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default Chat;
