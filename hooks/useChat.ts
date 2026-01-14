import { useState, useEffect } from 'react';
import apiService from '../services/apiService';
import authService from '../services/authService';
import socketService from '../services/socketService';

export function useChatList() {
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      setLoading(true);
      const data = await apiService.getChats();
      // Sort by date DESC (Newest activity first)
      const sorted = (data || []).sort((a, b) => {
        const dateA = new Date(a.lastMessageDate || 0).getTime();
        const dateB = new Date(b.lastMessageDate || 0).getTime();
        return dateB - dateA;
      });
      setChats(sorted);
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    chats,
    loading,
    refresh: loadChats
  };
}

export function useChatMessages(chatId: string) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (chatId) {
      loadMessages();
    }
  }, [chatId]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const [data, user] = await Promise.all([
        apiService.getMessages(chatId),
        authService.getUser()
      ]);
      
      if (data && Array.isArray(data)) {
        const mappedMessages = data.map(msg => ({
          id: msg.id,
          text: msg.mensaje,
          createdAt: msg.fechaCreacion,
          isMe: msg.remitenteId === user?.id
        })).reverse(); // Reverse to have newest first for Inverted FlatList
        setMessages(mappedMessages);

        if (user) {
          apiService.markConversationAsRead(chatId).then(() => {
            // Trigger global refresh to update badges
            socketService.loadConversations();
          }).catch(err => 
            console.error('Error marking as read inside hook:', err)
          );
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    try {
      setSending(true);
      const newMessage = await apiService.sendMessage(chatId, text);
      
      const mappedMessage = {
        id: newMessage.id,
        text: newMessage.mensaje,
        createdAt: newMessage.fechaCreacion,
        isMe: true
      };
      
      // Prepend message because FlatList is inverted (Index 0 is at bottom)
      setMessages(prev => [mappedMessage, ...prev]);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  return {
    messages,
    loading,
    sending,
    sendMessage
  };
}
