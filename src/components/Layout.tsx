import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import {
  Upload,
  ScanSearch,
  ShieldCheck,
  AlertTriangle,
  Settings,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  FileCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/upload', icon: Upload, label: '上传台' },
  { to: '/recognize', icon: ScanSearch, label: '识别校对' },
  { to: '/verify', icon: ShieldCheck, label: '验真台' },
  { to: '/exceptions', icon: AlertTriangle, label: '异常池' },
  { to: '/rules', icon: Settings, label: '规则配置' },
  { to: '/statistics', icon: BarChart3, label: '统计页' },
]

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-navy-800">
      <aside
        className={cn(
          'flex flex-col border-r border-navy-500/20 bg-navy-900 transition-all duration-300',
          collapsed ? 'w-16' : 'w-52'
        )}
      >
        <div className={cn('flex h-14 items-center border-b border-navy-500/20 px-4', collapsed ? 'justify-center' : 'gap-3')}>
          <FileCheck className="h-6 w-6 shrink-0 text-status-pass" />
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="truncate text-sm font-bold text-white tracking-wide">票据验真工作台</h1>
              <p className="truncate text-[10px] text-navy-300">识别·验真·分流</p>
            </div>
          )}
        </div>

        <nav className="flex-1 py-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'mx-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200',
                  isActive
                    ? 'bg-navy-500/40 text-white shadow-sm shadow-navy-500/20'
                    : 'text-navy-200 hover:bg-navy-700/50 hover:text-white',
                  collapsed && 'justify-center px-2'
                )
              }
            >
              <item.icon className="h-4.5 w-4.5 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="mx-2 mb-3 flex items-center justify-center rounded-lg py-2 text-navy-300 transition-colors hover:bg-navy-700/50 hover:text-white"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </aside>

      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-navy-500/20 bg-navy-800/80 px-6 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-status-pass animate-pulse" />
            <span className="text-xs text-navy-200">系统运行中</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-navy-300">录单员A</span>
            <div className="h-7 w-7 rounded-full bg-navy-500/60 flex items-center justify-center text-xs font-medium text-white">
              A
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-5">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
