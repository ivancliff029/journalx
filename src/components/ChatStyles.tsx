import styled from 'styled-components';

export const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 80vh;
  max-width: 800px;
  margin: 0 auto;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
`;

export const MessagesContainer = styled.div`
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  background-color: #f9f9f9;
`;

export const Message = styled.div`
  margin-bottom: 16px;
  display: flex;
  align-items: flex-start;

  &.user {
    justify-content: flex-end;
  }

  &.bot {
    justify-content: flex-start;
  }
`;

interface MessageBubbleProps {
  isUser: boolean;
}

export const MessageBubble = styled.div<MessageBubbleProps>`
  max-width: 70%;
  padding: 12px;
  border-radius: 8px;
  background-color: ${({ isUser }) => (isUser ? '#007bff' : '#e9ecef')};
  color: ${({ isUser }) => (isUser ? '#fff' : '#000')};
`;

export const FormContainer = styled.form`
  display: flex;
  padding: 16px;
  border-top: 1px solid #ddd;
  background-color: #fff;
`;

export const InputField = styled.input`
  flex: 1;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  margin-right: 8px;
`;

export const SendButton = styled.button`
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  background-color: #007bff;
  color: #fff;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #0056b3;
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;
