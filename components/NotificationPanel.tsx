"use client"

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Bell,
  Trash2,
  AlertTriangle,
  MessageSquare,
  Eye,
} from 'lucide-react'
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  update,
  remove,
  getDatabase, ref, onValue, off, query, orderByChild, limitToLast
} from 'firebase/database'
import { app } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { CommentNotification } from '@/utils/storeNotifications'
import Link from 'next/link'
// Define Notification Interface
interface Notification {
  id: string
  title: string
  message: string
  timestamp: number
  viewed: boolean
}

// NotificationItem Component
const CommentNotificationItem = React.memo(
  ({ notification }: { notification: CommentNotification }) => {
    const formattedDate = useMemo(() => {
      return new Date(notification.timestamp as unknown as number).toLocaleString()
    }, [notification.timestamp])

    return (
      <div className="flex items-start p-4 hover:bg-muted/50 transition-colors">
        <MessageSquare className="w-6 h-6 text-blue-500 flex-shrink-0 mt-1" />
        <div className="ml-4 flex-1">
          <p className="text-sm">
            <span className="font-semibold">{notification.authorName}</span> mentioned you in a comment
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Task: {notification.task ? (
              <Link href={`/tasks/${notification.task.id}`} className="hover:underline text-primary">
                {notification.task.title}
              </Link>
            ) : 'Unknown Task'}
          </p>
          <p className="text-xs mt-1">{notification.content}</p>
          <p className="text-xs text-muted-foreground mt-1">{formattedDate}</p>
        </div>
      </div>
    )
  }
)

CommentNotificationItem.displayName = 'CommentNotificationItem'
const NotificationItem = React.memo(
  ({
    notification,
    onMarkAsViewed,
    onDelete,
  }: {
    notification: Notification
    onMarkAsViewed: (id: string) => void
    onDelete: (id: string) => void
  }) => {
    const formattedDate = useMemo(() => {
      return new Date(notification.timestamp).toLocaleString()
    }, [notification.timestamp])

    return (
      <div className="flex items-start p-4 hover:bg-muted/50 transition-colors">
        <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
        <div className="ml-4 flex-1">
          <p className="text-sm">
            <span className="font-semibold">{notification.title}</span> {notification.message}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{formattedDate}</p>
        </div>
        <div className="flex items-center ml-2 space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onMarkAsViewed(notification.id)}
                  className={notification.viewed ? 'text-muted-foreground' : 'text-primary'}
                  aria-label={notification.viewed ? 'Viewed' : 'Mark as viewed'}
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
                  onClick={() => onDelete(notification.id)}
                  className="text-red-500 hover:text-red-700"
                  aria-label="Delete notification"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete notification</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    )
  }
)

NotificationItem.displayName = 'NotificationItem'

// NotificationPanel Component
export function NotificationPanel() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [activeTab, setActiveTab] = useState<'inbox' | 'viewed' | 'comments'>('inbox')
  const [isOpen, setIsOpen] = useState(false)
  const { user } = useAuth()
  const [commentNotifications, setCommentNotifications] = useState<CommentNotification[]>([])
  // Fetch notifications from Firebase
  const fetchNotifications = useCallback(() => {
    if (user?.uid) {
      const db = getDatabase(app)
      const notificationsRef = ref(db, `notifications/${user.uid}`)

      const handleSnapshot = (snapshot: any) => {
        const data = snapshot.val()
        if (data) {
          const notificationList: Notification[] = Object.entries(data).map(
            ([id, notif]: [string, any]) => ({
              id,
              ...notif,
            })
          )
          setNotifications(notificationList)
        } else {
          setNotifications([])
        }
      }

      onValue(notificationsRef, handleSnapshot)

      return () => {
        off(notificationsRef, 'value', handleSnapshot)
      }
    }
  }, [user])

  useEffect(() => {
    const unsubscribe = fetchNotifications()
    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [fetchNotifications])
  const fetchCommentNotifications = useCallback(() => {
    console.log('fetchCommentNotifications')
    if (!user?.uid) return
    console.log('Fetching comment notifications for user:', user.uid)
    const db = getDatabase(app)
    const commentNotificationsRef = query(
      ref(db, `commentNotifications/${user.uid}`),
      orderByChild('timestamp'),
      limitToLast(50)
    )
    
    const handleSnapshot = (snapshot: any) => {
      const data = snapshot.val()
      if (data) {
        const notificationList: CommentNotification[] = Object.entries(data).map(
          ([id, notif]: [string, any]) => ({
            id,
            ...notif,
            timestamp: notif.timestamp || Date.now(),
          })
        ).sort((a, b) => b.timestamp - a.timestamp)
        console.log('Fetched comment notifications:', notificationList)
        setCommentNotifications(notificationList)
      } else {
        setCommentNotifications([])
      }
    }
    

    onValue(commentNotificationsRef, handleSnapshot)
    
    return () => {
      off(commentNotificationsRef, 'value', handleSnapshot)
    }
  }, [user])
  // Calculate unviewed notifications count
  useEffect(() => {
    const unsubscribe = fetchCommentNotifications()
    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [fetchCommentNotifications])
  const unviewedCount = useMemo(() => {
    return notifications.filter(n => !n.viewed).length
  }, [notifications])

  // Handler to mark a notification as viewed
  const markAsViewed = useCallback(async (notificationId: string) => {
    if (user?.uid) {
      const db = getDatabase(app)
      const notificationRef = ref(db, `notifications/${user.uid}/${notificationId}`)
      try {
        await update(notificationRef, { viewed: true })
      } catch (error) {
        console.error('Failed to mark as viewed:', error)
      }
    }
  }, [user])

  // Handler to delete a notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    if (user?.uid) {
      const db = getDatabase(app)
      const notificationRef = ref(db, `notifications/${user.uid}/${notificationId}`)
      try {
        await remove(notificationRef)
      } catch (error) {
        console.error('Failed to delete notification:', error)
      }
    }
  }, [user])

  // Filter notifications based on active tab
  const filteredNotifications = useMemo(() => {
    return notifications.filter(notification => {
      if (activeTab === 'inbox') return !notification.viewed
      if (activeTab === 'viewed') return notification.viewed
      return true // 'comments' tab shows all notifications
    })
  }, [notifications, activeTab])

  return (
    <TooltipProvider>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label="Open notifications"
          >
            <Bell className="h-5 w-5" />
            {unviewedCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {unviewedCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full max-w-md p-0">
          {/* Tabs */}
          <div className="flex border-b border-muted">
            <button
              className={`flex-1 py-2 text-center text-sm font-medium ${
                activeTab === 'inbox'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-primary'
              } transition-colors`}
              onClick={() => setActiveTab('inbox')}
              aria-label="Inbox notifications"
            >
              Inbox{" "}
              <Badge
                variant="secondary"
                className="ml-1 px-2 py-0.5 text-xs font-semibold"
              >
                {unviewedCount}
              </Badge>
            </button>
            <button
              className={`flex-1 py-2 text-center text-sm font-medium ${
                activeTab === 'viewed'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-primary'
              } transition-colors`}
              onClick={() => setActiveTab('viewed')}
              aria-label="Viewed notifications"
            >
              Viewed
            </button>
            <button
              className={`flex-1 py-2 text-center text-sm font-medium ${
                activeTab === 'comments'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-primary'
              } transition-colors`}
              onClick={() => setActiveTab('comments')}
              aria-label="Comments notifications"
            >
              Comments
            </button>
          </div>
          {/* Notification List */}
          <ScrollArea className="h-80">
            {activeTab === 'comments' ? (
              commentNotifications.length > 0 ? (
                <div className="divide-y divide-muted">
                  {commentNotifications.map(notification => (
                    <CommentNotificationItem
                      key={notification.commentId}
                      notification={notification}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full p-4">
                  <p className="text-muted-foreground">No comment notifications.</p>
                </div>
              )
            ) : filteredNotifications.length > 0 ? (
              <div className="divide-y divide-muted">
                {filteredNotifications.map(notification => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsViewed={markAsViewed}
                    onDelete={deleteNotification}
                  />
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full p-4">
                <p className="text-muted-foreground">No notifications in this category.</p>
              </div>
            )}
          </ScrollArea>

        </PopoverContent>
      </Popover>
    </TooltipProvider>
  )
}
