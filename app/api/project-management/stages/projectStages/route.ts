import { NextResponse } from 'next/server';
import { StageSummary} from '@/models/summaries';
import { db } from '@/firebase'
import { doc, collection, getDocs, addDoc, updateDoc, deleteDoc, setDoc, writeBatch } from 'firebase/firestore'

export async function GET(request: Request) {
    const url = new URL(request.url);
    const projectId = url.searchParams.get('projectId');
    if (!projectId) return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    const stageCollection = collection(db, 'projects', projectId, 'stages');
    const stageSnapshot = await getDocs(stageCollection);
    const stages = stageSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log('project tages', stages);
    return NextResponse.json(stages);
}
