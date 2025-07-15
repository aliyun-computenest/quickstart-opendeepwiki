import UserMessage from "./user";
import AssistantMessage from "./assistant";
import { MessageItem } from "../../../types/chat";
import './index.css'

interface MessageProps {
    messageItem: MessageItem;
    handleDelete: (messageId: string) => void;
    organizationName: string;
    repositoryName: string;
}

export default function Message({ messageItem, handleDelete, organizationName, repositoryName }: MessageProps) {

    if (messageItem.role === "user") {
        return <UserMessage 
            messageItem={messageItem}
            handleDelete={handleDelete} />
    }

    if (messageItem.role === "assistant") {
        return <AssistantMessage 
            messageItem={messageItem} 
            handleDelete={handleDelete} 
            organizationName={organizationName} 
            repositoryName={repositoryName} />
    }
}