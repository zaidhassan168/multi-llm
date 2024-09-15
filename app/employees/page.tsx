'use client'

import React, { useState, useEffect } from 'react'
import { Employee, fetchEmployees, createEmployee, updateEmployee, deleteEmployee } from '@/models/employee'
import { Project, fetchProjects } from '@/models/project'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (editingEmployee) {
      setSelectedProjects(Array.isArray(editingEmployee.projectIds) ? editingEmployee.projectIds : editingEmployee.projectIds ? [editingEmployee.projectIds] : [])
    } else {
      setSelectedProjects([])
    }
  }, [editingEmployee])

  const fetchData = async () => {
    try {
      const [employeesData, projectsData] = await Promise.all([
        fetchEmployees(),
        fetchProjects()
      ])
      setEmployees(employeesData)
      setProjects(projectsData)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch data',
        variant: 'destructive'
      })
    }
  }

  const handleCreateOrUpdateEmployee = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const employeeData: Partial<Employee> = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      role: formData.get('role') as 'developer' | 'management' | 'projectManager',
      availability: Number(formData.get('availability')),
      projectIds: selectedProjects
    }

    try {
      if (editingEmployee) {
        await updateEmployee({ ...editingEmployee, ...employeeData })
        toast({ title: 'Success', description: 'Employee updated successfully' })
      } else {
        await createEmployee(employeeData as Omit<Employee, 'id'>)
        toast({ title: 'Success', description: 'Employee created successfully' })
      }
      fetchData()
      setIsDialogOpen(false)
      setEditingEmployee(null)
    } catch (error) {
      console.error('Error saving employee:', error)
      toast({
        title: 'Error',
        description: 'Failed to save employee',
        variant: 'destructive'
      })
    }
  }

  const handleDeleteEmployee = async (email: string) => {
    if (confirm('Are you sure you want to delete this employee?')) {
      try {
        await deleteEmployee(email)
        toast({ title: 'Success', description: 'Employee deleted successfully' })
        fetchData()
      } catch (error) {
        console.error('Error deleting employee:', error)
        toast({
          title: 'Error',
          description: 'Failed to delete employee',
          variant: 'destructive'
        })
      }
    }
  }

  const toggleProject = (projectId: string) => {
    setSelectedProjects(prev => 
      prev.includes(projectId) 
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    )
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">Employee Management</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingEmployee(null)}>Add Employee</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
                <DialogDescription>
                  {editingEmployee ? 'Edit the employee details below.' : 'Enter the details for the new employee.'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateOrUpdateEmployee}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      defaultValue={editingEmployee?.name}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">
                      Email
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      defaultValue={editingEmployee?.email}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="role" className="text-right">
                      Role
                    </Label>
                    <Select name="role" defaultValue={editingEmployee?.role}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="developer">Developer</SelectItem>
                        <SelectItem value="management">Management</SelectItem>
                        <SelectItem value="projectManager">Project Manager</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="availability" className="text-right">
                      Availability
                    </Label>
                    <Input
                      id="availability"
                      name="availability"
                      type="number"
                      defaultValue={editingEmployee?.availability}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label className="text-right pt-2">Projects</Label>
                    <div className="col-span-3 space-y-2">
                      {projects.map((project) => (
                        <div key={project.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`project-${project.id}`}
                            checked={selectedProjects.includes(project.id)}
                            onCheckedChange={() => toggleProject(project.id)}
                          />
                          <label
                            htmlFor={`project-${project.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {project.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit">Save</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Availability</TableHead>
                <TableHead>Projects</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>{employee.name}</TableCell>
                  <TableCell>{employee.email}</TableCell>
                  <TableCell>{employee.role}</TableCell>
                  <TableCell>{employee.availability}%</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(Array.isArray(employee.projectIds) ? employee.projectIds : [employee.projectIds]).map((projectId) => {
                        const project = projects.find(p => p.id === projectId)
                        return project ? (
                          <Badge key={projectId} variant="secondary">
                            {project.name}
                          </Badge>
                        ) : null
                      })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mr-2"
                      onClick={() => {
                        setEditingEmployee(employee)
                        setIsDialogOpen(true)
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteEmployee(employee.email)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}