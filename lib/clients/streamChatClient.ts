import { Message } from "@/lib/types";
import { generateUUID } from "@/lib/utils";

interface StreamChatParams {
  inputContent: string;
  setIsLoading: (loading: boolean) => void;
  append: (message: Message) => Promise<string | null | undefined>;
}

export async function streamChat({ inputContent, setIsLoading, append }: StreamChatParams) {
  setIsLoading(true);
  
  try {
    const response = await fetch("http://localhost:8000/chat/stream", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: inputContent }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error("No response body");
    }

    // Create initial assistant message
    const assistantMessage: Message = {
      id: generateUUID(),
      content: "",
      role: "assistant",
    };

    let isFirstChunk = true;
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      
      // Keep the last incomplete line in buffer
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.trim()) {
          try {
            const data = JSON.parse(line);
            if (data.content) {
              if (isFirstChunk) {
                assistantMessage.content = data.content;
                await append(assistantMessage);
                isFirstChunk = false;
              } else {
                const updateMessage: Message = {
                  id: generateUUID(),
                  content: data.content,
                  role: "assistant",
                };
                await append(updateMessage);
              }
            }
          } catch (e) {
            console.error("Error parsing JSON:", e, "Line:", line);
          }
        }
      }
    }

    // Process any remaining buffer
    if (buffer.trim()) {
      try {
        const data = JSON.parse(buffer);
        if (data.content) {
          if (isFirstChunk) {
            assistantMessage.content = data.content;
            await append(assistantMessage);
          } else {
            const updateMessage: Message = {
              id: generateUUID(),
              content: data.content,
              role: "assistant",
            };
            await append(updateMessage);
          }
        }
      } catch (e) {
        console.error("Error parsing final JSON:", e);
      }
    }
  } catch (error) {
    console.error("Error in streamChat:", error);
    
    // Add error message to chat
    const errorMessage: Message = {
      id: generateUUID(),
      content: "Sorry, I encountered an error. Please make sure the server is running and try again.",
      role: "assistant",
    };
    await append(errorMessage);
  } finally {
    setIsLoading(false);
  }
}