"use client";
import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chat from './components/Chat'; // Import the Chat component

const LandingPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar toggleSidebar={toggleSidebar} />
      <Box sx={{ display: 'flex', flex: 1 }}>
        <Sidebar open={sidebarOpen} />
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            marginLeft: sidebarOpen ? '240px' : '0px',
            transition: 'margin-left 0.3s',
          }}
        >
          <Container sx={{ p: 3 }}>
            <Typography variant="h2" gutterBottom>
              Welcome to Journal X
            </Typography>
            <Typography variant="body1" paragraph>
              Explore your journals and start writing!
            </Typography>
          </Container>
          <Container sx={{ p: 3 }}>
            <Chat />
          </Container>
        </Box>
      </Box>
    </Box>
  );
};

export default LandingPage;
