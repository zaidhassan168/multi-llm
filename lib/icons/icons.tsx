import {
    SearchIcon,
    ClockIcon,
    UserIcon,
    TagIcon,
    SendIcon,
    Loader2Icon,
    SmileIcon,
    FlagIcon,
    AlertCircleIcon,
    AlertTriangleIcon,
    AlertOctagonIcon,
    BellIcon,
    HelpCircleIcon,
    BugIcon,
    LightbulbIcon,
    FileTextIcon,
    CheckSquareIcon,
    RefreshCcwIcon,
  } from 'lucide-react'

const priorityIcons: Record<string, { icon: React.ComponentType<any>; color: string }> = {
    low: { icon: FlagIcon, color: "text-green-500" },
    medium: { icon: AlertCircleIcon, color: "text-yellow-500" },
    high: { icon: AlertTriangleIcon, color: "text-orange-500" },
    urgent: { icon: AlertOctagonIcon, color: "text-red-500" },
    critical: { icon: BellIcon, color: "text-purple-500" },
    null: { icon: HelpCircleIcon, color: "text-gray-500" },
  };
  
  const taskTypeIcons: Record<string, { icon: React.ComponentType<any>; color: string }> = {
    bug: { icon: BugIcon, color: "text-red-500" },
    feature: { icon: LightbulbIcon, color: "text-yellow-500" },
    documentation: { icon: FileTextIcon, color: "text-blue-500" },
    task: { icon: CheckSquareIcon, color: "text-green-500" },
    changeRequest: { icon: RefreshCcwIcon, color: "text-purple-500" },
    other: { icon: HelpCircleIcon, color: "text-gray-500" },
  };

  export { priorityIcons, taskTypeIcons };