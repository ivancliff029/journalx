"use client";
import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import RightSidebar from '@/components/RightSidebar';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import Chat from '@/components/Chat';
import { db } from '../lib/firebase';
import { collection, getDocs, doc, getDoc, addDoc, onSnapshot, Timestamp } from 'firebase/firestore';

const LandingPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const [dataFetched, setDataFetched] = useState(false);
  const [journals, setJournals] = useState<{ id: string, title: string }[]>([]);
  const [journalId, setJournalId] = useState('');
  const [messages, setMessages] = useState<Array<{ role: string, parts: Array<{ text: string }> }>>([]);
  const [selectedJournal, setSelectedJournal] = useState<{ id: string, title: string, description: string, timestamp: Timestamp } | null>(null);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const openRightSidebar = () => {
    setRightSidebarOpen(true);
  };

  useEffect(() => {
    const fetchJournalTitles = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'journals'));
        const journalList = querySnapshot.docs.map(doc => ({ id: doc.id, title: doc.data().title }));
        setJournals(journalList);
      } catch (error) {
        console.error('Error fetching journal titles:', error);
      }
    };

    fetchJournalTitles();

    // Listen for real-time updates to journals collection
    const unsubscribe = onSnapshot(collection(db, 'journals'), (snapshot) => {
      const updatedJournals = snapshot.docs.map(doc => ({ id: doc.id, title: doc.data().title }));
      setJournals(updatedJournals);
    });

    return () => unsubscribe();
  }, []);

  const handleJournalClick = async (id: string) => {
    try {
      const journalDoc = await getDoc(doc(db, 'journals', id));
      if (journalDoc.exists()) {
        const journalData = journalDoc.data();
        setJournalId(id);
        setMessages(journalData.history || []);
        setSelectedJournal({
          id: id,
          title: journalData.title,
          description: journalData.description || 'No description available',
          timestamp: journalData.timestamp // This will be the original timestamp from Firestore
        });
        setSidebarOpen(false);
        setRightSidebarOpen(true);
      }
    } catch (error) {
      console.error('Error fetching journal data:', error);
    } finally {
      setDataFetched(true);
    }
  };

  const handleJournalUpdate = (id: string, title: string, description: string) => {
    setSelectedJournal(prev => prev ? {...prev, title, description} : null); // Keep the original timestamp
    setJournals(prev => prev.map(j => j.id === id ? {...j, title} : j));
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar toggleSidebar={toggleSidebar} />
      <Box sx={{ display: 'flex', flex: 1 }}>
        <Sidebar 
          open={sidebarOpen} 
          journals={journals} 
          setJournals={setJournals} 
          onJournalClick={handleJournalClick} 
        />
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            marginLeft: sidebarOpen ? '240px' : '0px',
            marginRight: rightSidebarOpen ? '300px' : '0px',
            transition: 'margin 0.3s',
          }}
        >
          <Container>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h2" gutterBottom>
                Welcome to Journal X
              </Typography>
              <IconButton 
                onClick={openRightSidebar}
                sx={{ ml: 2 }}
                aria-label="open journal details"
              >
                <MenuOpenIcon />
              </IconButton>
            </Box>
            <Typography variant="body1" paragraph>
              Explore your journals and start writing!
            </Typography>
          </Container>
          {dataFetched && (
            <Container sx={{ p: 3 }}>
              <Chat journalId={journalId} messages={messages} />
            </Container>
          )}
        </Box>
        <RightSidebar
          open={rightSidebarOpen}
          onClose={() => setRightSidebarOpen(false)}
          journal={selectedJournal}
          onUpdate={handleJournalUpdate}
        />
      </Box>
    </Box>
  );
};

export default LandingPage;