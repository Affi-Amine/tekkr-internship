import {Button} from "./ui/button";
import {Skeleton} from "./ui/skeleton";
import {MessagesSquareIcon, PlusIcon, TrashIcon} from "lucide-react";
import {useChatsQuery, useCreateChatMutation, useDeleteChatMutation} from "../hooks/useChats";
import {Chat} from "../types/chat";

interface Props {
  onSelectChat?: (chatId: string) => void;
  selectedChatId: string | null;
}

export function ChatSidebar(props: Props) {
  const { selectedChatId, onSelectChat } = props;
  
  // React Query hooks
  const { data: chats, isLoading, error } = useChatsQuery();
  const createChatMutation = useCreateChatMutation();
  const deleteChatMutation = useDeleteChatMutation();

  const handleCreateChat = () => {
    createChatMutation.mutate({});
  };

  const handleDeleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this chat?')) {
      deleteChatMutation.mutate(chatId);
    }
  };

  const formatChatName = (chat: Chat) => {
    if (chat.name && chat.name.trim()) {
      return chat.name;
    }
    // Fallback to default name since messages are loaded separately
    return 'New Chat';
  };

  return (
    <div className={"flex flex-col border-r-accent border-r-2 h-full w-64 fixed left-0 top-16 bottom-0 p-4 gap-3"}>
      <Button 
        onClick={handleCreateChat} 
        size={"sm"}
        disabled={createChatMutation.isPending}
      >
        <PlusIcon className={"w-5 h-5"}/>
        {createChatMutation.isPending ? 'Creating...' : 'New Chat'}
      </Button>
      
      <hr />
      
      <div className={"flex flex-col gap-1 overflow-y-auto"}>
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))
        ) : error ? (
          <div className="text-red-500 text-sm p-2">
            Error loading chats: {error.message}
          </div>
        ) : chats && chats.length > 0 ? (
          chats.map((chat: Chat) => (
            <div key={chat.id} className="relative group">
              <Button
                variant={selectedChatId === chat.id ? "secondary" : "ghost"}
                size={"sm"}
                className={"w-full text-left justify-start pr-8"}
                onClick={() => onSelectChat?.(chat.id)}
              >
                <MessagesSquareIcon className={"w-5 h-5 me-2"}/>
                <span className="truncate">{formatChatName(chat)}</span>
              </Button>
              
              {/* Delete button - only show on hover */}
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => handleDeleteChat(chat.id, e)}
                disabled={deleteChatMutation.isPending}
              >
                <TrashIcon className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          ))
        ) : (
          <div className="text-gray-500 text-sm p-2 text-center">
            No chats yet. Create your first chat!
          </div>
        )}
      </div>
    </div>
  );
}