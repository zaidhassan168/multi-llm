import { db } from '@/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: { email: string } }) {
  try {
    const email = params.email;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Create a query to fetch the employee by email
    const q = query(collection(db, 'employees'), where('email', '==', email));
    const querySnapshot = await getDocs(q);

    // Check if any employee was found
    if (querySnapshot.empty) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Assuming only one employee will be fetched with the email
    const employee = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))[0];

    return NextResponse.json(employee);
  } catch (error) {
    console.error('Error fetching employee:', error);
    return NextResponse.json({ error: 'Failed to fetch employee' }, { status: 500 });
  }
}
