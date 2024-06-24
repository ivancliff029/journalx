"use client";
import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chat from '@/components/Chat';
import { db } from '../lib/firebase';
import { collection, getDocs, doc, getDoc, addDoc } from 'firebase/firestore';

const LandingPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [journalTitle, setJournalTitle] = useState('');
  const [dataFetched, setDataFetched] = useState(false);
  const [journals, setJournals] = useState<{ id: string, title: string }[]>([]);
  const [journalId,setJournalId] = useState('');

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
  }, []);

  const handleJournalClick = async (id: string) => {
    try {
      const journalDoc = await getDoc(doc(db, 'journals', id));
      if (journalDoc.exists()) {
        const journalData = journalDoc.data();
        setJournalId(id);
        setJournalTitle(journalData.title);
        setResponseText(journalData.quotes[0]);
      }
    } catch (error) {
      console.error('Error fetching journal data:', error);
    } finally {
      setDataFetched(true);
    }
  };

  const addJournal = async () => {
    try {
      const journalData = {
        title: `Journal ${journals.length + 1}`, 
        quotes: [''], 
      };
      const docRef = await addDoc(collection(db, 'journals'), journalData);
      setJournals(prevJournals => [...prevJournals, { id: docRef.id, title: journalData.title }]);
    } catch (error) {
      console.error('Error adding journal:', error);
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
          <Container sx={{ p: 3 }}>
            <Typography variant="h2" gutterBottom>
              {journalTitle || 'Welcome to Journal X'}
            </Typography>
            <Typography variant="body1" paragraph>
              {responseText || 'Explore your journals and start writing!'}
            </Typography>
            <button onClick={addJournal}>Add Journal</button>
          </Container>
          {dataFetched && (
            <Container sx={{ p: 3 }}>
              <Chat setResponseText={setResponseText} journalId={journalId} />
            </Container>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default LandingPage;
