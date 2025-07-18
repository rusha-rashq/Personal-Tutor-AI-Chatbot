"use client";

import React, { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import CodeDisplayBlock from "@/components/code-display-block";
import { marked } from "marked";
import { Message } from "@/lib/types";
import { AILogo, UserIcon } from "./ui/icons";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { CheckIcon, CopyIcon } from "lucide-react";

interface ChatMessageProps {
  messages: Message[] | undefined;
  isLoading: boolean;
}

export default function ChatMessage({ messages, isLoading }: ChatMessageProps) {
  const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (messages === undefined || messages.length === 0) {
    return (
      <div className="w-full h-full flex justify-center items-center">
        <div className="flex flex-col gap-4 items-center"></div>
      </div>
    );
  }

  const copyResponseToClipboard = (code: string, messageId: number) => {
    navigator.clipboard.writeText(code);
    setCopiedMessageId(messageId);
    toast.success("Code copied to clipboard!");
    setTimeout(() => {
      setCopiedMessageId(null);
    }, 1500);
  };

  return (
    <div
      id="scroller"
      className="w-full overflow-y-scroll overflow-x-hidden h-full justify-end"
      style={{ height: "calc(100vh - 200px)" }} // Adjust height as needed
    >
      <div className="w-full flex flex-col overflow-x-hidden overflow-y-hidden min-h-full justify-end">
        {messages.map((message, index) => (
          <motion.div
            key={index}
            layout
            initial={{ opacity: 0, scale: 1, y: 20, x: 0 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 1, y: 20, x: 0 }}
            transition={{
              opacity: { duration: 0.1 },
              layout: {
                type: "spring",
                bounce: 0.3,
                duration: messages.indexOf(message) * 0.05 + 0.2,
              },
            }}
            className={cn(
              "flex flex-col gap-2 p-4 whitespace-pre-wrap",
              message.role === "user" ? "items-end" : "items-start"
            )}
          >
            <div className="flex gap-3 items-center">
              {message.role === "user" && (
                <div className="flex items-end w-full gap-3">
                  <span
                    className="bg-accent p-3 rounded-md w-full max-w-xs sm:max-w-2xl overflow-x-auto"
                    dangerouslySetInnerHTML={{
                      __html: marked.parse(message.content),
                    }}
                  />

                  {/* <Avatar className="flex justify-start items-center overflow-hidden"> */}
                  <Avatar className="flex justify-center items-center overflow-hidden w-12 h-12 rounded-full bg-gray-700">
                    <UserIcon />
                  </Avatar>
                </div>
              )}

              {message.role === "assistant" && (
                <div className="flex items-end gap-2">
                  {isLoading &&
                    messages.indexOf(message) === messages.length - 1 ? (
                    <Avatar className="flex justify-center items-center overflow-hidden w-12 h-12 rounded-full bg-gray-700">
                      {/* <IconLogo className="object-contain dark:invert" /> */}
                      <AILogo
                        className="object-contain dark:invert"
                        width={32}
                        height={32}
                      />
                    </Avatar>
                  ) : (
                    <Avatar className="flex justify-center items-center overflow-hidden w-12 h-12 rounded-full bg-gray-700">
                      {/* <IconLogo className="object-contain" /> */}
                      {/* <AILogo className="object-contain" /> */}
                      <AILogo
                        className="object-contain"
                        width={32}
                        height={32}
                      />
                    </Avatar>
                  )}

                  <span className="p-3 rounded-md max-w-xs sm:max-w-2xl overflow-x-auto">
                    {/* Check if the message content contains a code block */}
                    {message.content.split("```").map((part, index) => {
                      if (index % 2 === 0) {
                        return (
                          // <React.Fragment key={index}>{part}</React.Fragment>
                          <span
                            key={index}
                            dangerouslySetInnerHTML={{
                              __html: marked.parse(part),
                            }}
                          />
                        );
                      } else {
                        // Extract language from the code block (assuming first word is the lang)
                        const lines = part.split("\n");
                        const firstLine = lines[0].trim();
                        const detectedLang = /^[a-zA-Z]+$/.test(firstLine) ? firstLine : "plaintext"; // Default to 'plaintext' if no lang is specified
                        const codeContent = detectedLang === "plaintext" ? part : lines.slice(1).join("\n");

                        return (
                          <pre className="whitespace-pre-wrap" key={index}>
                            <CodeDisplayBlock code={codeContent} lang={detectedLang} />
                          </pre>
                        );
                      }
                    })}

                    {isLoading &&
                      messages.indexOf(message) === messages.length - 1 && (
                        <span className="animate-pulse" aria-label="Typing">
                          ...
                        </span>
                      )}

                    {/* Copy button inside the response container */}
                    {!isLoading && (
                      <Button
                        onClick={() =>
                          copyResponseToClipboard(message.content, index)
                        }
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                      >
                        {copiedMessageId === index ? (
                          <CheckIcon className="w-4 h-4 scale-100 transition-all" />
                        ) : (
                          <CopyIcon className="w-4 h-4 scale-100 transition-all" />
                        )}
                      </Button>
                    )}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <div className="flex pl-4 pb-4 gap-2 items-center">
            <div className="bg-accent p-3 rounded-md max-w-xs sm:max-w-2xl overflow-x-auto">
              <div className="flex gap-1">
                <span className="size-1.5 rounded-full bg-slate-700 motion-safe:animate-[bounce_1s_ease-in-out_infinite] dark:bg-slate-300"></span>
                <span className="size-1.5 rounded-full bg-slate-700 motion-safe:animate-[bounce_0.5s_ease-in-out_infinite] dark:bg-slate-300"></span>
                <span className="size-1.5 rounded-full bg-slate-700 motion-safe:animate-[bounce_1s_ease-in-out_infinite] dark:bg-slate-300"></span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div id="anchor" ref={bottomRef} className="my-4"></div>
    </div>
  );
}