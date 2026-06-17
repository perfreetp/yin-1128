import { useState, useMemo, useRef, useEffect } from 'react'
import { useInvoiceStore } from '@/store/invoiceStore'
import type { StatisticsData, DailyStats } from '@/types'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line,
} from 'recharts'
import { BarChart3, TrendingUp, Download, FileSpreadsheet, Calendar, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type TabKey = 'department' | 'batch'

interface AggregatedRow {
  name: string
  total: number
  passed: number
  failed: number
  pending: number
  passRate: number
}

function aggregateBy(statistics: StatisticsData[], key: 'department' | 'batchNo'): AggregatedRow[] {
  const map = new Map<string, AggregatedRow>()
  for (const s of statistics) {
    const k = s[key]
    const existing = map.get(k)
    if (existing) {
      existing.total += s.total
      existing.passed += s.passed
      existing.failed += s.failed
      existing.pending += s.pending
    } else {
      map.set(k, { name: k, total: s.total, passed: s.passed, failed: s.failed, pending: s.pending, passRate: 0 })
    }
  }
  for (const row of map.values()) {
    row.passRate = row.total > 0 ? Math.round((row.passed / row.total) * 1000) / 10 : 0
  }
  return Array.from(map.values())
}

export default function StatisticsPage() {
  const { statistics, dailyStats } = useInvoiceStore()
  const [tab, setTab] = useState<TabKey>('department')
  const [exportOpen, setExportOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setExportOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const kpiData = useMemo(() => {
    const totalAll = statistics.reduce((s, d) => s + d.total, 0)
    const passedAll = statistics.reduce((s, d) => s + d.passed, 0)
    const failedAll = statistics.reduce((s, d) => s + d.failed, 0)
    const avgTime = dailyStats.length > 0
      ? Math.round((dailyStats.reduce((s, d) => s + d.avgProcessTime, 0) / dailyStats.length) * 10) / 10
      : 0
    const passRate = totalAll > 0 ? Math.round((passedAll / totalAll) * 1000) / 10 : 0
    const errorRate = totalAll > 0 ? Math.round((failedAll / totalAll) * 1000) / 10 : 0
    return { totalAll, passRate, avgTime, errorRate }
  }, [statistics, dailyStats])

  const chartData = useMemo(() => aggregateBy(statistics, tab === 'department' ? 'department' : 'batchNo'), [statistics, tab])

  const kpiCards = [
    { icon: BarChart3, label: '总处理量', value: kpiData.totalAll, unit: '张', color: 'text-blue-400' },
    { icon: TrendingUp, label: '通过率', value: kpiData.passRate, unit: '%', color: 'text-emerald-400' },
    { icon: Calendar, label: '平均处理时长', value: kpiData.avgTime, unit: 's', color: 'text-amber-400' },
    { icon: Building2, label: '异常率', value: kpiData.errorRate, unit: '%', color: 'text-red-400' },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">数据统计</h2>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setExportOpen(!exportOpen)}
            className="flex items-center gap-2 rounded-lg bg-navy-500/40 px-4 py-2 text-sm text-navy-100 transition-colors hover:bg-navy-500/60"
          >
            <Download className="h-4 w-4" />
            导出复核结果
          </button>
          {exportOpen && (
            <div className="absolute right-0 top-full z-10 mt-1 w-36 overflow-hidden rounded-lg border border-navy-500/30 bg-navy-800 shadow-xl">
              <button
                onClick={() => setExportOpen(false)}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-navy-100 hover:bg-navy-500/30"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
                Excel 格式
              </button>
              <button
                onClick={() => setExportOpen(false)}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-navy-100 hover:bg-navy-500/30"
              >
                <FileSpreadsheet className="h-4 w-4 text-blue-400" />
                CSV 格式
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {kpiCards.map((card) => (
          <div key={card.label} className="rounded-xl border border-navy-500/20 bg-navy-800/60 p-4">
            <div className="mb-2 flex items-center gap-2">
              <card.icon className={cn('h-5 w-5', card.color)} />
              <span className="text-xs text-navy-300">{card.label}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className={cn('text-2xl font-bold', card.color)}>{card.value}</span>
              <span className="text-xs text-navy-400">{card.unit}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-navy-500/20 bg-navy-800/60 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex gap-1 rounded-lg bg-navy-700/50 p-1">
            <button
              onClick={() => setTab('department')}
              className={cn(
                'rounded-md px-4 py-1.5 text-sm transition-colors',
                tab === 'department' ? 'bg-navy-500/60 text-white' : 'text-navy-300 hover:text-white'
              )}
            >
              按部门
            </button>
            <button
              onClick={() => setTab('batch')}
              className={cn(
                'rounded-md px-4 py-1.5 text-sm transition-colors',
                tab === 'batch' ? 'bg-navy-500/60 text-white' : 'text-navy-300 hover:text-white'
              )}
            >
              按批次
            </button>
          </div>
          <span className="text-xs text-navy-400">
            {tab === 'department' ? '部门' : '批次'}处理统计
          </span>
        </div>

        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,78,130,0.2)" />
            <XAxis dataKey="name" tick={{ fill: '#8B9DC3', fontSize: 12 }} axisLine={{ stroke: 'rgba(59,78,130,0.3)' }} />
            <YAxis tick={{ fill: '#8B9DC3', fontSize: 12 }} axisLine={{ stroke: 'rgba(59,78,130,0.3)' }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#152240', border: '1px solid rgba(59,78,130,0.3)', borderRadius: 8, color: '#E2E8F0' }}
              labelStyle={{ color: '#8B9DC3' }}
            />
            <Legend wrapperStyle={{ color: '#8B9DC3' }} />
            <Bar dataKey="passed" name="通过" stackId="a" fill="#10B981" radius={[0, 0, 0, 0]} />
            <Bar dataKey="failed" name="失败" stackId="a" fill="#EF4444" radius={[0, 0, 0, 0]} />
            <Bar dataKey="pending" name="待处理" stackId="a" fill="#F59E0B" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-500/20">
                <th className="px-3 py-2.5 text-left text-xs font-medium text-navy-300">{tab === 'department' ? '部门' : '批次'}</th>
                <th className="px-3 py-2.5 text-right text-xs font-medium text-navy-300">总数</th>
                <th className="px-3 py-2.5 text-right text-xs font-medium text-navy-300">通过</th>
                <th className="px-3 py-2.5 text-right text-xs font-medium text-navy-300">失败</th>
                <th className="px-3 py-2.5 text-right text-xs font-medium text-navy-300">待处理</th>
                <th className="px-3 py-2.5 text-right text-xs font-medium text-navy-300">通过率</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((row) => (
                <tr key={row.name} className="border-b border-navy-500/10 hover:bg-navy-500/10">
                  <td className="px-3 py-2.5 text-white">{row.name}</td>
                  <td className="px-3 py-2.5 text-right text-navy-100">{row.total}</td>
                  <td className="px-3 py-2.5 text-right text-emerald-400">{row.passed}</td>
                  <td className="px-3 py-2.5 text-right text-red-400">{row.failed}</td>
                  <td className="px-3 py-2.5 text-right text-amber-400">{row.pending}</td>
                  <td className="px-3 py-2.5 text-right">
                    <span className={cn(
                      'inline-block rounded px-2 py-0.5 text-xs font-medium',
                      row.passRate >= 90 ? 'bg-emerald-500/20 text-emerald-400' :
                      row.passRate >= 80 ? 'bg-amber-500/20 text-amber-400' :
                      'bg-red-500/20 text-red-400'
                    )}>
                      {row.passRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-navy-500/20 bg-navy-800/60 p-5">
        <h3 className="mb-4 text-sm font-semibold text-white">处理效率趋势</h3>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={dailyStats}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,78,130,0.2)" />
            <XAxis dataKey="date" tick={{ fill: '#8B9DC3', fontSize: 12 }} axisLine={{ stroke: 'rgba(59,78,130,0.3)' }} />
            <YAxis yAxisId="left" tick={{ fill: '#8B9DC3', fontSize: 12 }} axisLine={{ stroke: 'rgba(59,78,130,0.3)' }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: '#8B9DC3', fontSize: 12 }} axisLine={{ stroke: 'rgba(59,78,130,0.3)' }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#152240', border: '1px solid rgba(59,78,130,0.3)', borderRadius: 8, color: '#E2E8F0' }}
              labelStyle={{ color: '#8B9DC3' }}
            />
            <Legend wrapperStyle={{ color: '#8B9DC3' }} />
            <Line yAxisId="left" type="monotone" dataKey="total" name="处理总量" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3, fill: '#3B82F6' }} />
            <Line yAxisId="right" type="monotone" dataKey="avgProcessTime" name="平均处理时长(s)" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3, fill: '#F59E0B' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
