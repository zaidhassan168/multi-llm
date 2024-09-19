// import { db } from '@/firebase';
// import { collection, getDocs } from 'firebase/firestore';
// import  Configuration from 'openai';
// import OpenAIApi from 'openai';
// import { doc, setDoc } from 'firebase/firestore';
// import { query, where, orderBy, limit } from 'firebase/firestore';
// async function extractFirestoreData() {
//   const collections = ['tasks', 'employees', 'projects'];
//   let allData: { id: string; type: string; }[] = [];

//   for (const collectionName of collections) {
//     const querySnapshot = await getDocs(collection(db, collectionName));
//     querySnapshot.forEach((doc) => {
//       allData.push({
//         id: doc.id,
//         type: collectionName,
//         ...doc.data()
//       });
//     });
//   }

//   return allData;
// }



// const configuration = new Configuration({
//     apiKey: process.env.OPENAI_API_KEY,
//   })
//   const openai = new OpenAIApi({ apiKey: process.env.OPENAI_API_KEY });

// async function createEmbedding(text: string) {
//   const response = await openai.embeddings.create({
//     model: "text-embedding-ada-002",
//     input: text,
//   });
//   return response.data[0].embedding;
// }

// async function createEmbeddings(data: any[]) {
//   return Promise.all(data.map(async (item) => {
//     const text = `${item.type}: ${JSON.stringify(item)}`;
//     const embedding = await createEmbedding(text);
//     return { ...item, embedding };
//   }));
// }


// async function storeEmbeddings(data: any[]) {
//   const embeddingsCollection = collection(db, 'embeddings');
  
//   for (const item of data) {
//     await setDoc(doc(embeddingsCollection, item.id), {
//       type: item.type,
//       embedding: item.embedding,
//       originalData: item
//     });
//   }
// }


// async function searchSimilarDocuments(queryText: string, n = 5) {
//   const queryEmbedding = await createEmbedding(queryText);
  
//   // This is a simplified version. In a real-world scenario, you'd need to implement
//   // vector similarity search, which Firestore doesn't support natively.
//   // You might need to use a vector database like Pinecone or implement your own solution.
  
//   const embeddingsCollection = collection(db, 'embeddings');
//   const querySnapshot = await getDocs(query(embeddingsCollection, limit(n)));
  
//   const results: any[] = [];
//   querySnapshot.forEach((doc) => {
//     const data = doc.data();
//     results.push(data.originalData);
//   });
  
//   return results;
// }

// async function generateResponse(queryText: string, relevantDocs: any[]) {
//   const prompt = `
//     Based on the following information:
//     ${relevantDocs.map(doc => JSON.stringify(doc)).join('\n')}
    
//     Answer the following question: ${queryText}
//   `;

//   const response = await openai.embeddings.create({
//     model: "text-davinci-003",
//     max_tokens: 200,
//     temperature: 0.7,
//   });

//   return response.choices[0].text.trim();
// }

// async function ragQuery(queryText: string) {
//   const relevantDocs = await searchSimilarDocuments(queryText);
//   const response = await generateResponse(queryText, relevantDocs);
//   return response;
// }