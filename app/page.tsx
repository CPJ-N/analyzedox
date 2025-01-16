"use client"
import Image from "next/image"
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  
  return (
    <div>
      <div className="relative w-full h-screen">
        <div className="absolute inset-0 z-0 bg-background">
          <div className="absolute inset-0 opacity-50 bg-gradient-to-br from-primary to-transparent" />
        </div>
        <div className="relative z-10 flex flex-col justify-center items-center h-full text-center px-4">
          <h1 className="text-6xl text-foreground font-bold mb-6">AnalyzeDox</h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
            Upload your documents and get instant answers. Our AI-powered chatbot helps you extract insights and information efficiently through natural conversation.
          </p>
          <button 
            onClick={() => router.push('/chatbot')}
            className="bg-primary text-primary-foreground px-8 py-3 rounded-full text-lg font-bold 
            hover:bg-primary/90 transition duration-300 shadow-lg hover:shadow-primary/20">
            Start Analyzing Documents
          </button>
        </div>
      </div>
    </div>
  )
}
