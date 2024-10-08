import { NextResponse } from 'next/server'
import { db } from '@/firebase'
import { doc, collection, getDocs, setDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { Employee } from '@/models/employee';
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
    const employee: Omit<Employee, 'id'> = await req.json();
    const employeeRef = doc(db, 'employees', employee.email)
    await setDoc(employeeRef, employee)
    return NextResponse.json({ id: employee.email, ...employee })
  } catch (error) {
    console.error('Error creating employee:', error)
    return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 })
  }
}

// Update an existing employee
export async function PATCH(req: Request) {
  try {
    const employee: Employee = await req.json();
    const employeeRef = doc(db, 'employees', employee.email)
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
    const { email } = await req.json()
    console.log('Deleting employee with email:', email)
    const employeeRef = doc(db, 'employees', email)
    await deleteDoc(employeeRef)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting employee edited api:', error)
    return NextResponse.json({ error: 'Failed to delete employee' }, { status: 500 })
  }
}