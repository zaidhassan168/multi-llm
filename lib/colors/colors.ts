import { Task } from "@/models/task";
import { Risk } from "@/models/risk";
const getStatusColor = (status: Task["status"]) => {
    switch (status) {
        case "done":
            return "bg-green-500";
        case "inProgress":
            return "bg-yellow-500";
        case "todo":
            return "bg-blue-500";
        case "backlog":
            return "bg-gray-500";
        default:
            return "bg-gray-500";
    }
};

const getStatusColorMuted = (status: string) => {
    switch (status) {
        case "done":
            return "bg-green-100 text-green-800 hover:bg-green-200";
        case "inProgress":
            return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
        case "todo":
            return "bg-blue-100 text-blue-800 hover:bg-blue-200";
        case "backlog":
            return "bg-gray-100 text-gray-800 hover:bg-gray-200";
        default:
            return "";
    }
};

const getPriorityColor = (priority: Task["priority"]) => {
    switch (priority) {
        case "critical":
            return "bg-red-500";
        case "high":
            return "bg-orange-500";
        case "medium":
            return "bg-yellow-500";
        case "low":
            return "bg-green-500";
        default:
            return "bg-gray-500";
    }
};



const getSeverityColor = (severity: Risk['severity']) => {
    switch (severity) {
      case 'High': return 'bg-red-100 text-red-800'
      case 'Medium': return 'bg-yellow-100 text-yellow-800'
      case 'Low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }
  
  const getAvailabilityColor = (availability: number) => {
    if (availability >= 75) return 'text-green-600'
    if (availability >= 25) return 'text-yellow-600'
    return 'text-red-600'
  }
  
  const getTrackStatusColor = (onTrack: boolean) => {
    return onTrack ? 'text-green-600' : 'text-red-600'
  }
  

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'backend': return 'bg-purple-200 text-purple-800'
      case 'frontend': return 'bg-pink-200 text-pink-800'
      case 'backend + frontend': return 'bg-indigo-200 text-indigo-800'
      default: return 'bg-gray-200 text-gray-800'
    }
  }

  
  const getPriorityBorderColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'border-l-green-500'
      case 'medium': return 'border-l-yellow-500'
      case 'high': return 'border-l-red-500'
      case 'urgent': return 'border-l-red-500'
      case 'critical': return 'border-l-red-500'
      default: return 'border-l-gray-400'
    }
  }
  export const getPriorityColorMuted = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      case 'muted':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }
export { getStatusColor, getStatusColorMuted, getPriorityColor, getSeverityColor, getAvailabilityColor, getTrackStatusColor, getEffortColor, getPriorityBorderColor };