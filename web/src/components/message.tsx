import React from "react";
import {cn} from "../lib/utils";
import Spinner from "./ui/spinner";
import {BotIcon, UserIcon} from "lucide-react";

export type Message = { role: "user" | "assistant"; content: string };

export function MessageContainer({ role, children }: React.PropsWithChildren<{ role: Message["role"] }>) {
    return (
        <div className={cn("flex flex-col gap-3 py-2", role === "user" ? "items-end" : "items-start")}>
            <div
                className={
                    "flex flex-row items-center gap-1 rounded-full bg-accent py-1.5 pe-3 ps-1.5 text-xs font-semibold"
                }
            >
                {role === "assistant" && <BotIcon className={"me-1 inline-block h-4 w-4"} />}
                {role === "user" && <UserIcon className={"me-1 inline-block h-4 w-4"} />}
                {role === "user" ? "You" : "Assistant"}
            </div>
            <div className={cn(
                "rounded-lg p-4 max-w-none",
                role === "user" 
                    ? "bg-primary text-primary-foreground ml-16 mr-2" 
                    : "bg-muted/50 mr-16 ml-2 w-full"
            )}>
                {children}
            </div>
        </div>
    );
}

export function AssistantLoadingIndicator() {
    return (
        <MessageContainer role={"assistant"}>
            <div
                className={
                    "flex flex-row items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-muted-foreground"
                }
            >
                <Spinner />
                Working on it...
            </div>
        </MessageContainer>
    );
}
