import {ChatSidebar} from "../components/chat-sidebar";
import {useState, useEffect, useRef} from "react";
import {ChatInputBox} from "../components/chat-input-box";
import {MessageContainer, AssistantLoadingIndicator} from "../components/message";
import {useChatQuery, useMessagesQuery, useSendMessageMutation} from "../hooks/useChats";
import {Message} from "../types/chat";
import {ScrollArea} from "../components/ui/scroll-area";
import {Skeleton} from "../components/ui/skeleton";
import {MessageContent} from "../components/MessageContent";

export function HomePage () {
    const [chatId, setChatId] = useState<string | null>(null);

    return <div className={"flex flex-col items-center"}>
        <ChatSidebar 
            selectedChatId={chatId} 
            onSelectChat={setChatId}
        />
        <div className={"flex flex-col pt-8 max-w-4xl ms-64 w-full"}>
            {chatId ? (
                <ChatWindow chatId={chatId} />
            ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                    <p>Select a chat or create a new one to get started</p>
                </div>
            )}
        </div>
    </div>
}

function ChatWindow ({ chatId }: { chatId: string }) {
    const { data: chat, isLoading: chatLoading, error: chatError } = useChatQuery(chatId);
    const { data: messages = [], isLoading: messagesLoading, error: messagesError } = useMessagesQuery(chatId);
    const sendMessageMutation = useSendMessageMutation(chatId);
    const [isAssistantTyping, setIsAssistantTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const isLoading = chatLoading || messagesLoading;
    const error = chatError || messagesError;

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (content: string) => {
        if (!content.trim()) return;

        setIsAssistantTyping(true);
        try {
            await sendMessageMutation.mutateAsync({ content });
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setIsAssistantTyping(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col gap-4 h-full">
                <Skeleton className="h-8 w-48" />
                <div className="flex-1 space-y-4">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="space-y-2">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-16 w-full" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-64 text-red-500">
                <p>Error loading chat: {error.message}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 h-full">
            <h2 className="text-2xl font-bold">{chat?.name || 'Chat'}</h2>
            
            <ScrollArea className="flex-1 pr-4">
                <div className="space-y-4">
                    {messages.length === 0 && (
                        <div className="flex items-center justify-center h-32 text-muted-foreground">
                            <p>No messages yet. Start the conversation!</p>
                        </div>
                    )}
                    
                    {messages.map((message: Message) => (
                         <MessageContainer role={message.role} key={message.id}>
                             <MessageContent 
                                 content={message.content} 
                                 projectPlan={message.projectPlan}
                                 role={message.role}
                             />
                         </MessageContainer>
                     ))}
                    
                    {isAssistantTyping && <AssistantLoadingIndicator />}
                    <div ref={messagesEndRef} />
                </div>
            </ScrollArea>
            
            <ChatInputBox 
                onSend={handleSendMessage} 
                disabled={sendMessageMutation.isPending || isAssistantTyping}
            />
        </div>
    );
}