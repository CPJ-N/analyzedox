import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { OpenAIEmbeddings } from '@langchain/openai';
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { supabase } from "./supabase";
import fs from 'fs';
import path from 'path';

const openAIApiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY
const embeddings = new OpenAIEmbeddings({ openAIApiKey })
const client = supabase

export const loadSinglePDF = async (fileName: string) => {
    try {
        /* Load all PDFs within the specified directory */
        // const directoryLoader = new DirectoryLoader(
        //     "public/Court Procedings/",
        //     {
        //     ".pdf": (path: string) => new PDFLoader(path),
        //     ".PDF": (path: string) => new PDFLoader(path)
        //     }
        // );
        // const loadedDocs = await directoryLoader.load();
        
        /* Load single PDF within the specified directory */
        const loader = new PDFLoader(`${fileName}`, {
            splitPages: false,
            parsedItemSeparator: "",
        });
        const loadedDocs = await loader.load();

        const combinedText = loadedDocs.map((doc: { pageContent: string }) => doc.pageContent.replace(/\r\n|\r|\n/g, " ")).join(" ");
        // console.log(combinedText)

        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            separators: ['\n\n', '\n', ' ', ''], // default setting
            chunkOverlap: 100
        })
        const splitText = await splitter.createDocuments([combinedText])
        // console.log("splitting",splitText)

        console.log("send to data base")
        const result = await SupabaseVectorStore.fromDocuments(
            splitText,
            embeddings, {
            client,
            tableName: 'documents'
        })
        console.log(result)
    } catch (error) {
        console.error("Error loading or processing PDF:", error);
    }

}
