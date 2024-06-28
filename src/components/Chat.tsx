import React, { useState, useEffect, FormEvent } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  ChatContainer,
  MessagesContainer,
  Message,
  MessageBubble,
  FormContainer,
  InputField,
  SendButton,
} from './ChatStyles'; 

interface ChatProps {
  journalId: string;
  messages: Array<{ role: string, parts: Array<{ text: string }> }>;
}

const Chat: React.FC<ChatProps> = ({  journalId, messages: initialMessages }) => {
  const [userInput, setUserInput] = useState('');
  const [messages, setMessages] = useState(initialMessages);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

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
      const newMessages = data.history;
      setMessages(newMessages);
      setUserInput('');
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };


  return (
    <ChatContainer>
      <MessagesContainer>
        {messages.map((message, index) => (
          <Message key={index} className={message.role}>
            <MessageBubble isUser={message.role === 'user'}>
              {message.role === 'model' ? (
                <ReactMarkdown>{message.parts[0].text}</ReactMarkdown>
              ) : (
                message.parts[0].text
              )}
            </MessageBubble>
          </Message>
        ))}
      </MessagesContainer>
      <FormContainer onSubmit={handleSubmit}>
        <InputField
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Enter your message"
          disabled={loading}
        />
        <SendButton type="submit" disabled={loading}>
          {loading ? 'Loading...' : 'Send'}
        </SendButton>
      </FormContainer>
    </ChatContainer>
  );
};

export default Chat;
