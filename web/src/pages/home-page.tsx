import {ChatSidebar} from "../components/chat-sidebar";
import {useState} from "react";
import {ChatInputBox} from "../components/chat-input-box";
import {Message, MessageContainer} from "../components/message";

// replace this
const dummyChats = [
    {
        name: "Chat 1",
        id: "1",
    },
    {
        name: "Chat 2",
        id: "2",
    },
    {
        name: "Chat 3",
        id: "3",
    }
];
const dummyMessages: Message[] = [
    { role: "assistant", content: "Hey, how can I help you?" },
    { role: "user", content: "Tell me a joke" },
    { role: "assistant", content: "Why don't scientists trust atoms? Because they make up everything!" }
];

export function HomePage () {
    const [chatId, setChatId] = useState<string | null>(null);
    return <div className={"flex flex-col items-center"}>
        <ChatSidebar chats={dummyChats} selectedChatId={chatId} onSelectChat={setChatId} />
        <div className={"flex flex-col pt-8 max-w-4xl ms-64 w-full"}>
            <ChatWindow messages={dummyMessages} />
        </div>
    </div>
}

function ChatWindow ({ messages }: { messages: Message[] }) {
    return <div className={"flex flex-col gap-4"}>
        <h2>Chat 1</h2>
        {messages.map((message, index) => (
            <MessageContainer role={message.role} key={index}>
                {message.content}
            </MessageContainer>
        ))}
        <ChatInputBox onSend={() => {}} />
    </div>
}