"use client"
import React, { useState } from 'react';
import IconButton from '@mui/material/IconButton'; 
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'; 
import ChevronRightIcon from '@mui/icons-material/ChevronRight'; 
import { Box } from '@mui/material'; 
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import IconSet from "../components/dashboard/MenuBar";

const DashboardLayout = () => {
  const [selectedContent, setSelectedContent] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const contentMap = {
    Journal: <IconSet />,
    Settings: <h2>Settings Content</h2>,
    Profile: <h2>Profile Content</h2>,
  };

  const handleItemClick = (item) => {
    setSelectedContent(item);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      
      <Box sx={{ display: 'flex', flex: 1 }}>
        {/* Sidebar */}
        <aside style={{
          width: isSidebarOpen ? '200px' : '0',
          backgroundColor: '#f4f4f4',
          padding: '10px',
          position: 'relative',
          top: 0,
          left: 0,
          marginTop: '65px', 
          height: 'calc(100vh - 130px)', // Adjusted height to avoid footer overlap (subtracting both navbar and footer heights)
          overflowY: 'auto',
          transition: 'width 0.3s ease',
          zIndex: 1000,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}></div>
          </div>

          {isSidebarOpen && (
            <nav>
              <ul style={{ listStyleType: 'none', padding: 0 }}>
                <li onClick={() => handleItemClick('Journal')} style={{ cursor: 'pointer', padding: '10px' }}>Journal</li>
                <li onClick={() => handleItemClick('Settings')} style={{ cursor: 'pointer', padding: '10px' }}>Settings</li>
                <li onClick={() => handleItemClick('Profile')} style={{ cursor: 'pointer', padding: '10px' }}>Profile</li>
              </ul>
            </nav>
          )}
        </aside>

        {/* Main Content */}
        <Box component="main" sx={{
          flex: 1,
          padding: '20px',
          transition: 'margin-left 0.3s ease',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: 'calc(100vh - 130px)', // To make sure it takes full height minus navbar/footer
          textAlign: 'center', // Ensure centered text alignment for headings
          margin: 0,
          marginLeft: isSidebarOpen ? '0px' : '0px', // Remove extra margin-left
        }}>
          {selectedContent ? contentMap[selectedContent] : <h2 className="text-2xl">Start Journaling Today</h2>}

          {/* Sidebar toggle button */}
          <IconButton
            onClick={toggleSidebar}
            style={{
              position: 'absolute',
              top: '30px',
              left: isSidebarOpen ? '210px' : '10px',
              backgroundColor: '#fff',
              borderRadius: '50%',
              transition: 'left 0.3s ease',
              zIndex: 1001,
              marginTop: '10px',
            }}
          >
            {isSidebarOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
        </Box>
      </Box>

      {/* Footer stays at the bottom */}
      <Footer />
    </Box>
  );
};

export default DashboardLayout;
