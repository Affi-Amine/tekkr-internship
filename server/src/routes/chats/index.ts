import { FastifyPluginAsync } from 'fastify';
import { randomUUID } from 'crypto';
import { memoryStore } from '../../storage/memory-store';
import { llmService } from '../../services/llm-service';
import { 
  Chat, 
  Message, 
  CreateChatRequest, 
  SendMessageRequest,
  ChatResponse,
  MessageResponse 
} from '../../types/chat';

const chats: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  
  // GET /chats - List all chats for the authenticated user
  fastify.get('/', async function (request, reply) {
    try {
      const userId = request.userId;
      const userChats = memoryStore.getChatsByUser(userId);
      
      const chatResponses: ChatResponse[] = userChats.map(chat => ({
        id: chat.id,
        name: chat.name,
        createdAt: chat.createdAt.toISOString(),
        updatedAt: chat.updatedAt.toISOString(),
        messageCount: memoryStore.getMessageCount(chat.id)
      }));

      reply.send({ chats: chatResponses });
    } catch (error) {
      console.error('Error fetching chats:', error);
      reply.status(500).send({ error: 'Failed to fetch chats' });
    }
  });

  // POST /chats - Create a new chat
  fastify.post<{ Body: CreateChatRequest }>('/', async function (request, reply) {
    try {
      const userId = request.userId;
      const { name } = request.body;
      
      const chatId = randomUUID();
      const now = new Date();
      
      const newChat: Chat = {
        id: chatId,
        name: name || `Chat ${now.toLocaleString()}`,
        createdAt: now,
        updatedAt: now,
        userId
      };

      const createdChat = memoryStore.createChat(newChat);
      
      const response: ChatResponse = {
        id: createdChat.id,
        name: createdChat.name,
        createdAt: createdChat.createdAt.toISOString(),
        updatedAt: createdChat.updatedAt.toISOString(),
        messageCount: 0
      };

      reply.status(201).send(response);
    } catch (error) {
      console.error('Error creating chat:', error);
      reply.status(500).send({ error: 'Failed to create chat' });
    }
  });

  // GET /chats/:chatId - Get a specific chat
  fastify.get<{ Params: { chatId: string } }>('/:chatId', async function (request, reply) {
    try {
      const { chatId } = request.params;
      const userId = request.userId;
      
      const chat = memoryStore.getChat(chatId);
      
      if (!chat) {
        reply.status(404).send({ error: 'Chat not found' });
        return;
      }

      if (chat.userId !== userId) {
        reply.status(403).send({ error: 'Access denied' });
        return;
      }

      const response: ChatResponse = {
        id: chat.id,
        name: chat.name,
        createdAt: chat.createdAt.toISOString(),
        updatedAt: chat.updatedAt.toISOString(),
        messageCount: memoryStore.getMessageCount(chat.id)
      };

      reply.send(response);
    } catch (error) {
      console.error('Error fetching chat:', error);
      reply.status(500).send({ error: 'Failed to fetch chat' });
    }
  });

  // DELETE /chats/:chatId - Delete a chat
  fastify.delete<{ Params: { chatId: string } }>('/:chatId', async function (request, reply) {
    try {
      const { chatId } = request.params;
      const userId = request.userId;
      
      const chat = memoryStore.getChat(chatId);
      
      if (!chat) {
        reply.status(404).send({ error: 'Chat not found' });
        return;
      }

      if (chat.userId !== userId) {
        reply.status(403).send({ error: 'Access denied' });
        return;
      }

      const deleted = memoryStore.deleteChat(chatId);
      
      if (deleted) {
        reply.status(204).send();
      } else {
        reply.status(500).send({ error: 'Failed to delete chat' });
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
      reply.status(500).send({ error: 'Failed to delete chat' });
    }
  });

  // GET /chats/:chatId/messages - Get messages for a chat
  fastify.get<{ Params: { chatId: string } }>('/:chatId/messages', async function (request, reply) {
    try {
      const { chatId } = request.params;
      const userId = request.userId;
      
      const chat = memoryStore.getChat(chatId);
      
      if (!chat) {
        reply.status(404).send({ error: 'Chat not found' });
        return;
      }

      if (chat.userId !== userId) {
        reply.status(403).send({ error: 'Access denied' });
        return;
      }

      const messages = memoryStore.getMessages(chatId);
      
      const messageResponses: MessageResponse[] = messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp.toISOString(),
        chatId: msg.chatId,
        projectPlan: msg.projectPlan
      }));

      reply.send({ messages: messageResponses });
    } catch (error) {
      console.error('Error fetching messages:', error);
      reply.status(500).send({ error: 'Failed to fetch messages' });
    }
  });

  // POST /chats/:chatId/messages - Send a message and get AI response
  fastify.post<{ 
    Params: { chatId: string }, 
    Body: SendMessageRequest 
  }>('/:chatId/messages', async function (request, reply) {
    try {
      const { chatId } = request.params;
      const { content } = request.body;
      const userId = request.userId;
      
      if (!content || content.trim().length === 0) {
        reply.status(400).send({ error: 'Message content is required' });
        return;
      }

      const chat = memoryStore.getChat(chatId);
      
      if (!chat) {
        reply.status(404).send({ error: 'Chat not found' });
        return;
      }

      if (chat.userId !== userId) {
        reply.status(403).send({ error: 'Access denied' });
        return;
      }

      // Create user message
      const userMessage: Message = {
        id: randomUUID(),
        role: 'user',
        content: content.trim(),
        timestamp: new Date(),
        chatId
      };

      // Add user message to storage
      memoryStore.addMessage(userMessage);

      // Get conversation history for LLM
      const conversationHistory = memoryStore.getMessages(chatId);
      
      // Generate AI response
      const llmResponse = await llmService.generateResponse(
        conversationHistory.slice(0, -1), // Exclude the just-added user message
        content.trim()
      );

      // Create assistant message
      const assistantMessage: Message = {
        id: randomUUID(),
        role: 'assistant',
        content: llmResponse.content,
        timestamp: new Date(),
        chatId,
        projectPlan: llmResponse.projectPlan
      };

      // Add assistant message to storage
      memoryStore.addMessage(assistantMessage);

      // Prepare response
      const userMessageResponse: MessageResponse = {
        id: userMessage.id,
        role: userMessage.role,
        content: userMessage.content,
        timestamp: userMessage.timestamp.toISOString(),
        chatId: userMessage.chatId
      };

      const assistantMessageResponse: MessageResponse = {
        id: assistantMessage.id,
        role: assistantMessage.role,
        content: assistantMessage.content,
        timestamp: assistantMessage.timestamp.toISOString(),
        chatId: assistantMessage.chatId,
        projectPlan: assistantMessage.projectPlan
      };

      reply.send({
        userMessage: userMessageResponse,
        assistantMessage: assistantMessageResponse,
        projectPlan: llmResponse.projectPlan
      });

    } catch (error) {
      console.error('Error sending message:', error);
      
      if (error instanceof Error && error.message.includes('API key')) {
        reply.status(503).send({ 
          error: 'AI service unavailable. Please check API configuration.' 
        });
      } else {
        reply.status(500).send({ error: 'Failed to send message' });
      }
    }
  });
};

export default chats;