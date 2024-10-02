"use client"

import React, { useState, useEffect } from 'react'
import { Bell, Trash2, AlertTriangle, MessageSquare, Eye } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { getDatabase, ref, onValue, off, update, remove } from 'firebase/database'
import { app } from '../firebase'
import { useAuth } from '../contexts/AuthContext'

interface Notification {
  id: string
  title: string
  message: string
  timestamp: number
  viewed: boolean
}

export function NotificationPanel() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [activeTab, setActiveTab] = useState('inbox')
  const [isOpen, setIsOpen] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (user?.uid) {
      const db = getDatabase(app)
      const notificationsRef = ref(db, `notifications/${user.uid}`)

      onValue(notificationsRef, (snapshot) => {
        const data = snapshot.val()
        if (data) {
          const notificationList = Object.entries(data).map(([id, notif]: [string, any]) => ({
            id,
            ...notif,
          }))
          setNotifications(notificationList)
        } else {
          setNotifications([])
        }
      })

      return () => {
        off(notificationsRef)
      }
    }
  }, [user])

  const unviewedCount = notifications.filter(n => !n.viewed).length

  const markAsViewed = async (notificationId: string) => {
    if (user?.uid) {
      const db = getDatabase(app)
      const notificationRef = ref(db, `notifications/${user.uid}/${notificationId}`)
      await update(notificationRef, { viewed: true })
    }
  }

  const deleteNotification = async (notificationId: string) => {
    if (user?.uid) {
      const db = getDatabase(app)
      const notificationRef = ref(db, `notifications/${user.uid}/${notificationId}`)
      await remove(notificationRef)
    }
  }

  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'inbox') return !notification.viewed
    if (activeTab === 'viewed') return notification.viewed
    return true // 'comments' tab shows all notifications
  })

  return (
    <TooltipProvider>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative" aria-label="Open notifications">
            <Bell className="h-5 w-5" />
            {unviewedCount > 0 && (
              <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0">
                {unviewedCount}     
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full max-w-lg min-w-[512px] p-0">
          <div className="flex items-center border-b border-muted">
            <button
              className={`flex-1 py-4 text-center text-sm font-medium ${
                activeTab === 'inbox'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-primary'
              } transition-colors`}
              onClick={() => setActiveTab('inbox')}
            >
              Inbox{" "}
              <span className="ml-1 px-2 py-1 text-xs font-semibold text-primary-foreground bg-primary rounded-full">
                {unviewedCount}
              </span>
            </button>
            <button
              className={`flex-1 py-4 text-center text-sm font-medium ${
                activeTab === 'viewed'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-primary'
              } transition-colors`}
              onClick={() => setActiveTab('viewed')}
            >
              Viewed
            </button>
            <button
              className={`flex-1 py-4 text-center text-sm font-medium ${
                activeTab === 'comments'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-primary'
              } transition-colors`}
              onClick={() => setActiveTab('comments')}
            >
              Comments
            </button>
          </div>
          <ScrollArea className="h-[400px]">
            {filteredNotifications.length > 0 ? (
              <div className="divide-y divide-muted">
                {filteredNotifications.map((notification) => (
                  <div key={notification.id} className="flex items-center p-4 hover:bg-muted/50 transition-colors">
                    <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0" />
                    <div className="ml-4 flex-1">
                      <p className="text-sm">
                        <span className="font-semibold">{notification.title}</span> {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(notification.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center ml-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => markAsViewed(notification.id)}
                            className={notification.viewed ? 'text-muted-foreground' : 'text-primary'}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{notification.viewed ? 'Viewed' : 'Mark as viewed'}</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteNotification(notification.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Delete notification</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">No notifications in this category.</p>
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </TooltipProvider>
  )
}