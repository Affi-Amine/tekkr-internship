import { Chat, Message } from '../types/chat';

class MemoryStore {
  private chats = new Map<string, Chat>();
  private messages = new Map<string, Message[]>();

  // Chat operations
  createChat(chat: Chat): Chat {
    this.chats.set(chat.id, chat);
    this.messages.set(chat.id, []);
    return chat;
  }

  getChat(chatId: string): Chat | undefined {
    return this.chats.get(chatId);
  }

  getChatsByUser(userId: string): Chat[] {
    return Array.from(this.chats.values())
      .filter(chat => chat.userId === userId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  updateChat(chatId: string, updates: Partial<Chat>): Chat | undefined {
    const chat = this.chats.get(chatId);
    if (!chat) return undefined;

    const updatedChat = { ...chat, ...updates, updatedAt: new Date() };
    this.chats.set(chatId, updatedChat);
    return updatedChat;
  }

  deleteChat(chatId: string): boolean {
    const deleted = this.chats.delete(chatId);
    if (deleted) {
      this.messages.delete(chatId);
    }
    return deleted;
  }

  // Message operations
  addMessage(message: Message): Message {
    const chatMessages = this.messages.get(message.chatId) || [];
    chatMessages.push(message);
    this.messages.set(message.chatId, chatMessages);

    // Update chat's updatedAt timestamp
    this.updateChat(message.chatId, {});

    return message;
  }

  getMessages(chatId: string): Message[] {
    return this.messages.get(chatId) || [];
  }

  getMessageCount(chatId: string): number {
    return this.messages.get(chatId)?.length || 0;
  }

  deleteMessage(messageId: string, chatId: string): boolean {
    const chatMessages = this.messages.get(chatId);
    if (!chatMessages) return false;

    const messageIndex = chatMessages.findIndex(msg => msg.id === messageId);
    if (messageIndex === -1) return false;

    chatMessages.splice(messageIndex, 1);
    this.messages.set(chatId, chatMessages);
    return true;
  }

  // Utility methods
  clear(): void {
    this.chats.clear();
    this.messages.clear();
  }

  getChatStats(): { totalChats: number; totalMessages: number } {
    const totalChats = this.chats.size;
    const totalMessages = Array.from(this.messages.values())
      .reduce((sum, messages) => sum + messages.length, 0);
    
    return { totalChats, totalMessages };
  }
}

// Export singleton instance
export const memoryStore = new MemoryStore();