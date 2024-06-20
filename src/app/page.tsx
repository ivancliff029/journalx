import React from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chat from './components/Chat'; // Import the Chat component

const LandingPage = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', marginLeft: '240px' }}>
        <Container sx={{ p: 3 }}>
          <Typography variant="h2" gutterBottom>Welcome to Journal X</Typography>
          <Typography variant="body1" paragraph>
            Explore your journals and start writing!
          </Typography>
        </Container>
        <Container sx={{ p: 3 }}>
          <Chat />
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;
