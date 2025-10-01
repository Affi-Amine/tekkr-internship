import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '../lib/api';
import { Chat, CreateChatRequest, SendMessageRequest } from '../types/chat';
import { useToast } from './use-toast';

// Query keys for React Query
export const chatKeys = {
  all: ['chats'] as const,
  lists: () => [...chatKeys.all, 'list'] as const,
  list: (filters: string) => [...chatKeys.lists(), { filters }] as const,
  details: () => [...chatKeys.all, 'detail'] as const,
  detail: (id: string) => [...chatKeys.details(), id] as const,
  messages: (chatId: string) => [...chatKeys.detail(chatId), 'messages'] as const,
};

// Hook to get all chats
export const useChatsQuery = () => {
  return useQuery({
    queryKey: chatKeys.lists(),
    queryFn: chatApi.getChats,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Hook to get a specific chat
export const useChatQuery = (chatId: string | undefined) => {
  return useQuery({
    queryKey: chatKeys.detail(chatId || ''),
    queryFn: () => chatApi.getChat(chatId!),
    enabled: !!chatId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

// Hook to get messages for a specific chat
export const useMessagesQuery = (chatId: string | undefined) => {
  return useQuery({
    queryKey: chatKeys.messages(chatId || ''),
    queryFn: () => chatApi.getMessages(chatId!),
    enabled: !!chatId,
    staleTime: 1000 * 60 * 1, // 1 minute
  });
};

// Hook to create a new chat
export const useCreateChatMutation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateChatRequest) => chatApi.createChat(data),
    onSuccess: (newChat: Chat) => {
      // Update the chats list cache
      queryClient.setQueryData<Chat[]>(chatKeys.lists(), (old) => {
        return [newChat, ...(old || [])];
      });
      
      // Add the new chat to the cache
      queryClient.setQueryData(chatKeys.detail(newChat.id), newChat);
      
      toast({
        title: "Chat created",
        description: `New chat "${newChat.name}" has been created.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating chat",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Hook to send a message
export const useSendMessageMutation = (chatId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: SendMessageRequest) => chatApi.sendMessage(chatId, data),
    onSuccess: (response: any) => {
      // Update the messages cache with the new messages
      queryClient.setQueryData(chatKeys.messages(chatId), (oldMessages: any) => {
        const currentMessages = oldMessages || [];
        // Add both user and assistant messages from the response
        if (response.userMessage && response.assistantMessage) {
          // Attach projectPlan to assistant message if present
          const assistantMessage = {
            ...response.assistantMessage,
            projectPlan: response.projectPlan
          };
          return [...currentMessages, response.userMessage, assistantMessage];
        }
        return currentMessages;
      });
      
      // Invalidate the chats list to update last message/timestamp
      queryClient.invalidateQueries({ queryKey: chatKeys.lists() });
    },
    onError: (error: Error) => {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Hook to delete a chat
export const useDeleteChatMutation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (chatId: string) => chatApi.deleteChat(chatId),
    onSuccess: (_, chatId) => {
      // Remove from chats list cache
      queryClient.setQueryData<Chat[]>(chatKeys.lists(), (old) => {
        return (old || []).filter(chat => chat.id !== chatId);
      });
      
      // Remove the specific chat cache
      queryClient.removeQueries({ queryKey: chatKeys.detail(chatId) });
      
      toast({
        title: "Chat deleted",
        description: "The chat has been successfully deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting chat",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};