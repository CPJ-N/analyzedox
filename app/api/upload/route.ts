import { createClient } from '@supabase/supabase-js';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { OpenAIEmbeddings } from '@langchain/openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        
        if (!file) {
            return new Response('No file provided', { status: 400 });
        }

        // Convert File to Blob
        const arrayBuffer = await file.arrayBuffer();
        const blob = new Blob([arrayBuffer], { type: file.type });

        // Load PDF
        const loader = new PDFLoader(blob);
        const docs = await loader.load();

        // Split text into chunks
        const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        });
        const splitDocs = await textSplitter.splitDocuments(docs);

        // Initialize OpenAI embeddings
        const embeddings = new OpenAIEmbeddings({
            openAIApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
        });

        // Process documents and generate embeddings
        const vectors = await Promise.all(
            splitDocs.map(async (doc) => {
                const embedding = await embeddings.embedQuery(doc.pageContent);
                return {
                    id: crypto.randomUUID(),
                    content: doc.pageContent,
                    metadata: doc.metadata,
                    embedding: embedding
                };
            })
        );

        // Store vectors directly using Supabase client
        const { error } = await supabase
            .from('documents')
            .insert(vectors);

        if (error) {
            throw new Error(`Error inserting: ${error.message}`);
        }

        return new Response(JSON.stringify({ message: 'File processed successfully' }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
            },
        });

    } catch (error) {
        console.error('Error processing file:', error);
        return new Response(JSON.stringify({ error: 'Error processing file' }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }
}