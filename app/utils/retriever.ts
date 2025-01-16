import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase"
import { OpenAIEmbeddings } from '@langchain/openai'
import { supabase } from './supabase'

const openAIApiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY
const embeddings = new OpenAIEmbeddings({ openAIApiKey })

const vectorStore = await SupabaseVectorStore.fromExistingIndex(embeddings, {
    client: supabase,
    tableName: 'documents',
    queryName: 'match_documents'
})

const retriever = vectorStore.asRetriever({
    k: 5, // number of results to return
    searchType: "similarity",
    filter: {} // optional metadata filter
})

export { retriever }
