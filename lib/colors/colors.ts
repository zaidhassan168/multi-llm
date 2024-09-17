import { Task } from "@/models/task";

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

export { getStatusColor, getStatusColorMuted, getPriorityColor };