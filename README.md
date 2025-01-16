# AnalyzeDox - Document Chatbot

A chatbot that lets you ask questions about your uploaded documents and get quick, clear answers. Upload your documents and start a natural conversation to extract insights and information efficiently.

## Tech Stack

### Frontend
- **Framework**: [Next.js](https://nextjs.org)
- **UI Library**: Shadcn/Tailwind CSS for modern, responsive design

### AI Backend
- **Language Model**: LLaMA via Together AI
- **Embeddings**: Together AI for text embeddings
- **Framework**: LangChain.js for document processing and query handling

### Database
- **Storage**: Supabase for document metadata and chat history
- **Vector Search**: Supabase Vector for embedding-based search

### Infrastructure
- **Hosting**: [Vercel](https://vercel.com)
- **Document Parsing**: PDF.js for document text extraction

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Features

- Document upload and parsing
- Natural language querying
- Real-time chat interface
- Context-aware responses
- Document history management

## Learn More

To learn more about the technologies used in this project:

- [Next.js Documentation](https://nextjs.org/docs)
- [LangChain.js Documentation](https://js.langchain.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Together AI Documentation](https://together.ai/docs)

## Deploy on Vercel

Deploy your own instance using [Vercel](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).
