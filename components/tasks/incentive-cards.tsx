
// components/UserProfile.tsx

"use client"

import React from "react"

import { Progress } from "@/components/ui/progress"
import { Card, CardContent} from "@/components/ui/card"

function TaskStatCard({ icon, label, value, total }: { icon: React.ReactNode; label: string; value: number; total: number }) {
    const percentage = total > 0 ? (value / total) * 100 : 0
  
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              {icon}
              <h4 className="font-medium text-muted-foreground">{label}</h4>
            </div>
            <span className="text-2xl font-bold">{value}</span>
          </div>
          <Progress value={percentage} className="h-1 mb-1" />
          <p className="text-xs text-muted-foreground text-right">{percentage.toFixed(0)}% of total</p>
        </CardContent>
      </Card>
    )
  }
  
  function AchievementCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="flex-shrink-0">{icon}</div>
            <h4 className="font-medium">{label}</h4>
          </div>
          <p className="text-xl font-bold">{value}</p>
        </CardContent>
      </Card>
    )
  }
  
  function IncentiveCard({ icon, label, description }: { icon: React.ReactNode; label: string; description: string }) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="flex-shrink-0">{icon}</div>
            <h4 className="font-medium">{label}</h4>
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    )
  }
  

  export { TaskStatCard, AchievementCard, IncentiveCard }