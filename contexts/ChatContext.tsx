import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import socketService from '../services/socketService';

interface ChatContextType {
    unreadMessagesCount: number;
    setUnreadMessagesCount: (count: number) => void;
    refreshUnreadCount: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
    const [unreadMessagesCount, setUnreadMessagesCount] = useState<number>(0);

    const refreshUnreadCount = async () => {
        try {
            if (socketService.isSocketConnected()) {
                await socketService.loadConversations();
            }
        } catch (error) {
            console.error('Error al refrescar mensajes no leídos:', error);
        }
    };

    useEffect(() => {
        const setupChat = async () => {
            try {
                await socketService.connect();
                
                // Escuchar cuando se cargan las conversaciones
                const handleConversationsLoaded = (conversations: any[]) => {
                    const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
                    setUnreadMessagesCount(totalUnread);
                };
                
                // Escuchar nuevos mensajes
                const handleNewMessage = (data: any) => {
                    // Cargar conversaciones para actualizar contador
                    socketService.loadConversations();
                };

                // Escuchar mensajes leídos
                const handleMessagesRead = () => {
                    // Cargar conversaciones para actualizar contador
                    socketService.loadConversations();
                };
                
                // Registrar listeners
                socketService.on('conversations_loaded', handleConversationsLoaded);
                socketService.on('new_message', handleNewMessage);
                socketService.on('messages_read', handleMessagesRead);
                
                // Cargar conversaciones para obtener contador inicial
                await socketService.loadConversations();
                
                // Cleanup
                return () => {
                    socketService.off('conversations_loaded', handleConversationsLoaded);
                    socketService.off('new_message', handleNewMessage);
                    socketService.off('messages_read', handleMessagesRead);
                };
            } catch (error) {
                console.error('Error al conectar chat:', error);
            }
        };
        
        setupChat();
    }, []);

    return (
        <ChatContext.Provider value={{ unreadMessagesCount, setUnreadMessagesCount, refreshUnreadCount }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error('useChat debe ser usado dentro de un ChatProvider');
    }
    return context;
};
