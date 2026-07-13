import {
  LayoutDashboard,
  GitBranch,
  Sparkles,
  Terminal,
  History,
  Bot,
  RefreshCw,
  Activity,
  Folder,
  AlertCircle,
  Star,
  Box,
  ArrowRight,
  LogOut,
  Menu,
  X,
  type LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  account_tree: GitBranch,
  auto_awesome: Sparkles,
  terminal: Terminal,
  history: History,
  smart_toy: Bot,
  sync: RefreshCw,
  monitoring: Activity,
  folder_zip: Folder,
  error_outline: AlertCircle,
  grade: Star,
  deployed_code: Box,
  arrow_forward: ArrowRight,
  logout: LogOut,
  menu: Menu,
  cancel: X,
};

interface DashIconProps {
  name: string;
  className?: string;
  filled?: boolean;
}

export function DashIcon({ name, className = 'w-5 h-5', filled }: DashIconProps) {
  const Icon = iconMap[name] ?? Box;
  return (
    <Icon
      className={className}
      strokeWidth={filled ? 2.5 : 1.75}
      fill={filled ? 'currentColor' : 'none'}
    />
  );
}
