"use client";
import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chat from '@/components/Chat';
import { db } from '../lib/firebase';
import { collection, getDocs, doc, getDoc, addDoc, onSnapshot } from 'firebase/firestore';

const LandingPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dataFetched, setDataFetched] = useState(false);
  const [journals, setJournals] = useState<{ id: string, title: string }[]>([]);
  const [journalId, setJournalId] = useState('');
  const [messages, setMessages] = useState<Array<{ role: string, parts: Array<{ text: string }> }>>([]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
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
      }
    } catch (error) {
      console.error('Error fetching journal data:', error);
    } finally {
      setDataFetched(true);
    }
  };


  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar toggleSidebar={toggleSidebar} />
      <Box sx={{ display: 'flex', flex: 1 }}>
        <Sidebar open={sidebarOpen} journals={journals} setJournals={setJournals} onJournalClick={handleJournalClick} />
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
          <Container>
            <Typography variant="h2" gutterBottom>
              'Welcome to Journal X'
            </Typography>
            <Typography variant="body1" paragraph>
              'Explore your journals and start writing!'
            </Typography>
          </Container>
          {dataFetched && (
            <Container sx={{ p: 3 }}>
              <Chat journalId={journalId} messages={messages} />
            </Container>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default LandingPage;
