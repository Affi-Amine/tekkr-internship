import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { chatApi, Chat, Message, CreateChatRequest, SendMessageRequest, SendMessageResponse } from '../chat-api';

// Query keys
export const chatKeys = {
  all: ['chats'] as const,
  lists: () => [...chatKeys.all, 'list'] as const,
  list: (filters: string) => [...chatKeys.lists(), { filters }] as const,
  details: () => [...chatKeys.all, 'detail'] as const,
  detail: (id: string) => [...chatKeys.details(), id] as const,
  messages: (chatId: string) => [...chatKeys.detail(chatId), 'messages'] as const,
};

// Get all chats
export const useChats = () => {
  return useQuery({
    queryKey: chatKeys.lists(),
    queryFn: chatApi.getChats,
  });
};

// Get a specific chat
export const useChat = (chatId: string) => {
  return useQuery({
    queryKey: chatKeys.detail(chatId),
    queryFn: () => chatApi.getChat(chatId),
    enabled: !!chatId,
  });
};

// Get messages for a chat
export const useMessages = (chatId: string) => {
  return useQuery({
    queryKey: chatKeys.messages(chatId),
    queryFn: () => chatApi.getMessages(chatId),
    enabled: !!chatId,
  });
};

// Create a new chat
export const useCreateChat = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateChatRequest) => chatApi.createChat(data),
    onSuccess: () => {
      // Invalidate and refetch chats list
      queryClient.invalidateQueries({ queryKey: chatKeys.lists() });
    },
  });
};

// Delete a chat
export const useDeleteChat = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (chatId: string) => chatApi.deleteChat(chatId),
    onSuccess: () => {
      // Invalidate and refetch chats list
      queryClient.invalidateQueries({ queryKey: chatKeys.lists() });
    },
  });
};

// Send a message
export const useSendMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ chatId, data }: { chatId: string; data: SendMessageRequest }) => 
      chatApi.sendMessage(chatId, data),
    onSuccess: (response: SendMessageResponse, { chatId }) => {
      // Update the messages cache with the new messages
      queryClient.setQueryData(
        chatKeys.messages(chatId),
        (oldData: { messages: Message[] } | undefined) => {
          if (!oldData) return { messages: [response.userMessage, response.assistantMessage] };
          return {
            messages: [...oldData.messages, response.userMessage, response.assistantMessage]
          };
        }
      );
      
      // Invalidate chats list to update message count
      queryClient.invalidateQueries({ queryKey: chatKeys.lists() });
    },
  });
};