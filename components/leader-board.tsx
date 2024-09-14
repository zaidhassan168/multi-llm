// components/Leaderboard.tsx

"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { fetchLeaderboard, Employee } from "@/models/employee"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getLeaderboard = async () => {
      try {
        const topEmployees = await fetchLeaderboard()
        setLeaderboard(topEmployees)
      } catch (error) {
        console.error("Failed to fetch leaderboard:", error)
      } finally {
        setLoading(false)
      }
    }

    getLeaderboard()
  }, [])

  if (loading) {
    return <div className="text-center p-4">Loading Leaderboard...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full table-auto">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">Rank</th>
                <th className="py-2">Avatar</th>
                <th className="py-2">Name</th>
                <th className="py-2">Points</th>
                <th className="py-2">Rank</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((emp, index) => (
                <tr key={emp.id} className="hover:bg-muted">
                  <td className="py-2">{index + 1}</td>
                  <td className="py-2">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={emp.photoURL || "/placeholder.svg"} alt={emp.name} />
                      <AvatarFallback>{emp.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </td>
                  <td className="py-2">{emp.name}</td>
                  <td className="py-2">{emp.points || 0}</td>
                  <td className="py-2">{emp.rank || "Novice"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}

export default Leaderboard
