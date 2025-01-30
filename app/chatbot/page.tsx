"use client"
import { useState } from 'react';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { retriever } from '../utils/retriever';
import { combineDocuments } from '../utils/combineDocuments';
import { RunnablePassthrough, RunnableSequence } from "@langchain/core/runnables";
import { formatConvHistory } from '../utils/formatConvHistory';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bot } from 'lucide-react';  // Add this import
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload } from 'lucide-react';

interface Message {
  text: string;
  sender: 'user' | 'bot';
}

const sampleQuestion: string[] = [
  "What are the main topics covered in this document?",
  "Can you summarize the key points of this document?",
  "Find any specific terms or definitions in the document",
  "What are the most important conclusions or recommendations?"
]

export default function ChatbotComponent() {
 
  const [convHistory, setConvHistory] = useState<string[]>([]);
  const [userInput, setUserInput] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const { toast } = useToast();
  
  const openAIApiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  const llm = new ChatOpenAI({ 
      openAIApiKey,
      temperature: 0
  });

  const standaloneQuestionTemplate = `Given a conversation history and a question about a document, convert the question to a standalone question that can be used to search for relevant information.
  conversation history: {conv_history}
  question: {question} 
  standalone question:`;
  const standaloneQuestionPrompt = PromptTemplate.fromTemplate(standaloneQuestionTemplate);

  const answerTemplate = `You are AnalyzeDox, a helpful AI assistant specialized in analyzing and explaining document content.

  Your goal is to:
  1. Provide clear, concise answers based on the provided document context
  2. If the answer is found in the context, explain it in a natural, conversational way
  3. If you're unsure or the information isn't in the context, say "I don't see that information in the provided documents. Could you please upload the relevant document or rephrase your question?"
  4. Maintain a professional yet friendly tone
  5. When appropriate, suggest related questions the user might want to ask

  context: {context}
  conversation history: {conv_history}
  question: {question}
  answer: `;
  const answerPrompt = PromptTemplate.fromTemplate(answerTemplate)
  console.log("answerPrompt", answerPrompt)
  
  const standaloneQuestionChain = standaloneQuestionPrompt
      .pipe(llm)
      .pipe(new StringOutputParser())
  console.log("standaloneQuestionChain", standaloneQuestionChain)

  const retrieverChain = RunnableSequence.from([
      prevResult => prevResult.standalone_question,
      retriever,
      combineDocuments
  ])
  console.log("retrieverChain", retrieverChain)

  const answerChain = answerPrompt
      .pipe(llm)
      .pipe(new StringOutputParser())
  console.log("answerChain", answerChain)

  const fallbackTemplate = `You are AnalyzeDox, a helpful AI assistant specialized in providing information about legal documents and general knowledge.
  
  Question: {question}
  Previous conversation: {conv_history}

  Provide a clear, helpful response that:
  1. Answers the question based on general knowledge
  2. Uses a natural, conversational tone
  3. Suggests relevant follow-up questions when appropriate
  4. Maintains accuracy while being engaging
  
  Answer:`;

  const fallbackPrompt = PromptTemplate.fromTemplate(fallbackTemplate);
  const fallbackChain = fallbackPrompt
    .pipe(llm)
    .pipe(new StringOutputParser());

  interface ChainInput {
      question: string;
      conv_history: string;
  }
  
  const chain = RunnableSequence.from([
        {
            standalone_question: standaloneQuestionChain,
            original_input: new RunnablePassthrough()
        },
        {
            context: retrieverChain,
            question: ({ original_input }: { original_input: ChainInput }) => original_input.question,
            conv_history: ({ original_input }: { original_input: ChainInput }) => original_input.conv_history
        },
        answerChain
    ])

  const handleQuestionClick = async (qnum: number) => {
    setUserInput(sampleQuestion[qnum]);
    console.log(userInput)
    sendMessage()
  }

  const handleUserInput = async (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && userInput.trim()) {
      const newMessage = { text: userInput, sender: 'user' as 'user' | 'bot' };
      setMessages([...messages, newMessage]);
      setUserInput('');

      const response = await chain.invoke({
        question: newMessage.text,
        conv_history: formatConvHistory(convHistory),
      }).catch(async (error) => {
        console.error('Error retrieving documents:', error);
        return await fallbackChain.invoke({
          question: newMessage.text,
          conv_history: formatConvHistory(convHistory),
        });
      });
      console.log(response)

      const botResponse = { text: response, sender: 'bot' as 'user' | 'bot' };
      setMessages(prevMessages => [...prevMessages, botResponse]);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Log all available file information
    const fileInfo = {
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      type: file.type,
      lastModified: new Date(file.lastModified).toLocaleString(),
      webkitRelativePath: (file as any).webkitRelativePath || '',
    };

    console.log('File Information:', fileInfo);
    console.table(fileInfo);

    setSelectedFile(file.name);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        toast({
          title: "File uploaded successfully",
          description: `${file.name} has been processed and is ready for analysis.`,
        });
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      toast({
        title: "Error uploading file",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const sendMessage = async () => {
    if (!userInput.trim()) return;
    
    setIsLoading(true);
    try {
      const newMessage = { text: userInput, sender: 'user' as 'user' | 'bot' };
      setMessages([...messages, newMessage]);
      setUserInput('');

      await chain.invoke({
        question: newMessage.text,
        conv_history: formatConvHistory(convHistory),
      })
      .then(response => {
        console.log("response", response)
        const botResponse = { text: response, sender: 'bot' as 'user' | 'bot' };
        setMessages(prevMessages => [...prevMessages, botResponse]);
      })
      .catch(async (error) => {
        console.error('Error retrieving documents:', error);
        const response = await fallbackChain.invoke({
          question: newMessage.text,
          conv_history: formatConvHistory(convHistory),
        });
        const botResponse = { text: response, sender: 'bot' as 'user' | 'bot' };
        setMessages(prevMessages => [...prevMessages, botResponse]);
      });
    } catch (error) {
      toast({
        title: "Error sending message",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="fixed top-0 w-full z-10 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 max-w-screen-2xl items-center px-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-10 w-10 border">
              <AvatarFallback className="bg-primary">
                <Bot className="h-6 w-6 text-primary-foreground" />
              </AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-semibold text-foreground">AnalyzeDox Assistant</h2>
          </div>
        </div>
      </header>

      <main className="flex flex-col flex-1 pt-20">
        <div className="container mx-auto p-4">
          <div className="w-full max-w-3xl mx-auto">
            <div className="relative group">
              <input
                type="file"
                accept=".pdf,.txt"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                disabled={isUploading}
              />
              <div className={`flex flex-col items-center justify-center border-2 border-dashed 
                rounded-lg p-6 transition-all duration-200 ease-in-out space-y-3
                ${isUploading ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-accent/50'}`}
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                  {isUploading ? (
                    <Loader2 className="h-6 w-6 text-primary animate-spin" />
                  ) : (
                    <Upload className="h-6 w-6 text-primary" />
                  )}
                </div>
                <div className="text-center space-y-1">
                  <h3 className="text-lg font-semibold text-foreground">
                    {isUploading ? 'Uploading...' : 'Upload your document'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {isUploading 
                      ? 'Please wait while we process your document'
                      : selectedFile || 'Drop your PDF file here or click to browse'
                    }
                  </p>
                </div>
                {!isUploading && !selectedFile && (
                  <p className="text-xs text-muted-foreground">
                    PDF files up to 10MB
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 px-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-12 py-8">
              <div className="space-y-4 text-center max-w-3xl mx-auto px-4">
                <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                  Welcome to AnalyzeDox
                </h1>
                <p className="text-lg text-foreground/70 md:text-xl">
                  Ask questions about your documents and get instant answers.
                </p>
              </div>
              
              <Card className="w-full max-w-2xl mx-auto bg-card border-border">
                <CardContent className="p-6">
                  <h3 className="text-foreground text-lg font-medium mb-4">Try asking about:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sampleQuestion.map((question, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="h-auto min-h-[64px] w-full p-4 text-left text-sm 
                        text-foreground bg-background hover:bg-primary/20 
                        border-border hover:border-primary 
                        transition-colors duration-200 
                        whitespace-normal break-words"
                        onClick={() => handleQuestionClick(index)}
                      >
                        {question}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="space-y-6 max-w-3xl mx-auto py-8">
              {messages.map((message, index) => (
                <Card
                  key={index}
                  className={`${
                    message.sender === 'bot'
                      ? 'ml-auto bg-primary text-primary-foreground'
                      : 'mr-auto bg-muted text-foreground'
                  } max-w-[85%] shadow-sm`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {message.sender === 'bot' && (
                        <Avatar className="h-8 w-8 border border-secondary/20">
                          <AvatarFallback className="bg-secondary/10">
                            <Bot className="h-4 w-4 text-primary" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className="flex-1 text-base leading-relaxed">
                        {message.text}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="border-t bg-background/95 backdrop-blur p-4 md:p-6">
          <div className="mx-auto max-w-3xl flex items-center gap-4">
            <Input
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={handleUserInput}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1 bg-background border text-foreground"
            />
            <Button
              onClick={sendMessage}
              disabled={!userInput.trim() || isLoading}
              className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <PaperAirplaneIcon className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

