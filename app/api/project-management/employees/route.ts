import { NextResponse } from 'next/server'
import { db } from '@/firebase'
import { doc, collection, getDocs, addDoc, updateDoc, deleteDoc } from 'firebase/firestore'

// Fetch all employees
export async function GET() {
  try {
    const employeesCollection = collection(db, 'employees')
    const employeesSnapshot = await getDocs(employeesCollection)
    const employees = employeesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    return NextResponse.json(employees)
  } catch (error) {
    console.error('Error fetching employees:', error)
    return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 })
  }
}

// Create a new employee
export async function POST(req: Request) {
  try {
    const employee = await req.json()
    const employeeRef = await addDoc(collection(db, 'employees'), employee)
    return NextResponse.json({ id: employeeRef.id, ...employee })
  } catch (error) {
    console.error('Error creating employee:', error)
    return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 })
  }
}

// Update an existing employee
export async function PATCH(req: Request) {
  try {
    const employee = await req.json()
    const employeeRef = doc(db, 'employees', employee.id)
    await updateDoc(employeeRef, employee)
    return NextResponse.json(employee)
  } catch (error) {
    console.error('Error updating employee:', error)
    return NextResponse.json({ error: 'Failed to update employee' }, { status: 500 })
  }
}

// Delete an employee
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json()
    const employeeRef = doc(db, 'employees', id)
    await deleteDoc(employeeRef)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting employee:', error)
    return NextResponse.json({ error: 'Failed to delete employee' }, { status: 500 })
  }
}
