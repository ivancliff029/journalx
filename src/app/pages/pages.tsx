import React from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Chat from '../components/Chat';
import { Box, Grid } from '@mui/material';

const Page = () => {
  return (
    <div>
      <Navbar />
      <Grid container>
        <Grid item xs>
          <Box p={3}>
            <Chat />
          </Box>
        </Grid>
      </Grid>
    </div>
  );
};

export default Page;
