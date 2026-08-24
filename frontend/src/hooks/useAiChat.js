import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  sendAiChatMessage,
  getAiConversations,
  getAiConversationMessages,
  deleteAiConversation,
  clearAiConversationMessages
} from '../services/aiService';
import useAuthStore from '../store/authStore';

export const useAiChat = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isAuthenticated = !!user;

  const [activeConversationId, setActiveConversationId] = useState(null);
  const [localMessages, setLocalMessages] = useState([]);
  const [rateLimitError, setRateLimitError] = useState(null);

  // Fetch list of conversations (only for logged-in users)
  const { data: conversations = [], isLoading: loadingConversations } = useQuery({
    queryKey: ['aiConversations', user?.id],
    queryFn: getAiConversations,
    enabled: isAuthenticated,
  });

  // Fetch messages for current active conversation
  const { data: remoteMessages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ['aiMessages', activeConversationId],
    queryFn: () => getAiConversationMessages(activeConversationId),
    enabled: isAuthenticated && !!activeConversationId,
  });

  // Combined messages trajectory
  const currentMessages = activeConversationId && remoteMessages.length > 0 ? remoteMessages : localMessages;

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: sendAiChatMessage,
    onMutate: async ({ message }) => {
      setRateLimitError(null);
      const userMsg = {
        id: `temp-${Date.now()}`,
        role: 'user',
        content: message,
        createdAt: new Date().toISOString()
      };
      setLocalMessages(prev => [...prev, userMsg]);
    },
    onSuccess: (data) => {
      if (data.conversationId && data.conversationId !== activeConversationId) {
        setActiveConversationId(data.conversationId);
      }

      const assistantMsg = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.message,
        createdAt: data.timestamp || new Date().toISOString()
      };

      setLocalMessages(prev => [...prev, assistantMsg]);

      if (isAuthenticated) {
        queryClient.invalidateQueries(['aiConversations']);
        if (data.conversationId) {
          queryClient.invalidateQueries(['aiMessages', data.conversationId]);
        }
      }
    },
    onError: (error) => {
      if (error.response?.status === 429) {
        setRateLimitError('AI assistant request limit reached. Please try again later.');
      } else {
        const errorMsg = {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: 'The AI assistant is temporarily unavailable. Please try again in a moment.',
          isError: true,
          createdAt: new Date().toISOString()
        };
        setLocalMessages(prev => [...prev, errorMsg]);
      }
    }
  });

  const sendMessage = useCallback((text) => {
    if (!text || !text.trim() || sendMutation.isPending) return;
    sendMutation.mutate({ message: text.trim(), conversationId: activeConversationId });
  }, [activeConversationId, sendMutation]);

  const startNewChat = useCallback(() => {
    setActiveConversationId(null);
    setLocalMessages([]);
    setRateLimitError(null);
  }, []);

  const deleteConversationMutation = useMutation({
    mutationFn: deleteAiConversation,
    onSuccess: (_, conversationId) => {
      if (activeConversationId === conversationId) {
        startNewChat();
      }
      queryClient.invalidateQueries(['aiConversations']);
    }
  });

  const clearMessagesMutation = useMutation({
    mutationFn: clearAiConversationMessages,
    onSuccess: () => {
      setLocalMessages([]);
      if (activeConversationId) {
        queryClient.invalidateQueries(['aiMessages', activeConversationId]);
      }
    }
  });

  return {
    activeConversationId,
    setActiveConversationId,
    messages: currentMessages,
    conversations,
    loadingConversations,
    loadingMessages,
    isSending: sendMutation.isPending,
    rateLimitError,
    sendMessage,
    startNewChat,
    deleteConversation: (id) => deleteConversationMutation.mutate(id),
    clearMessages: (id) => clearMessagesMutation.mutate(id)
  };
};
