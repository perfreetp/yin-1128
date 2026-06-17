import { useState } from 'react'
import { useInvoiceStore } from '@/store/invoiceStore'
import { ExceptionType, EXCEPTION_TYPE_LABELS, ExceptionRecord } from '@/types'
import { cn } from '@/lib/utils'
import {
  AlertTriangle,
  ArrowLeft,
  Send,
  CheckCircle,
  Clock,
  User,
  MessageSquare,
  Filter,
  FileWarning,
  ShieldAlert,
  Copy,
} from 'lucide-react'

const exceptionIcons: Record<ExceptionType, React.ReactNode> = {
  duplicate: <Copy className="h-4 w-4" />,
  verify_failed: <ShieldAlert className="h-4 w-4" />,
  format_anomaly: <FileWarning className="h-4 w-4" />,
  tampering: <AlertTriangle className="h-4 w-4" />,
  field_mismatch: <Filter className="h-4 w-4" />,
}

const statusConfig = {
  pending: { label: '待处理', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  returned: { label: '已退回', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  resolved: { label: '已解决', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
}

export default function ExceptionsPage() {
  const { exceptions, returnTemplates, updateException, addAuditEntry } = useInvoiceStore()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<ExceptionType | ''>('')
  const [statusFilter, setStatusFilter] = useState<ExceptionRecord['status'] | ''>('')
  const [searchText, setSearchText] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [suppText, setSuppText] = useState('')

  const filtered = exceptions.filter((ex) => {
    if (typeFilter && ex.exceptionType !== typeFilter) return false
    if (statusFilter && ex.status !== statusFilter) return false
    if (searchText && !ex.reason.includes(searchText) && !ex.invoiceId.includes(searchText)) return false
    return true
  })

  const selected = exceptions.find((ex) => ex.id === selectedId) ?? null

  const handleReturn = () => {
    if (!selected) return
    updateException(selected.id, { status: 'returned', returnTemplateId: selectedTemplateId || undefined })
    addAuditEntry(selected.id, {
      id: `A-${Date.now()}`,
      operator: '录单员A',
      action: '退回提交人',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      remark: suppText,
    })
    setSuppText('')
    setSelectedTemplateId('')
  }

  const handleResolve = () => {
    if (!selected) return
    updateException(selected.id, { status: 'resolved' })
    addAuditEntry(selected.id, {
      id: `A-${Date.now()}`,
      operator: '录单员A',
      action: '标记已解决',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      remark: suppText,
    })
    setSuppText('')
  }

  return (
    <div className="flex h-full gap-4">
      <div className={cn('flex flex-col gap-4', selected ? 'w-[420px] shrink-0' : 'flex-1')}>
        <div className="flex items-center gap-3 rounded-lg border border-navy-500/20 bg-navy-700/40 px-4 py-3">
          <Filter className="h-4 w-4 shrink-0 text-navy-300" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as ExceptionType | '')}
            className="rounded-md border border-navy-500/30 bg-navy-800 px-2 py-1.5 text-xs text-navy-100 outline-none focus:border-navy-400"
          >
            <option value="">全部类型</option>
            {Object.entries(EXCEPTION_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ExceptionRecord['status'] | '')}
            className="rounded-md border border-navy-500/30 bg-navy-800 px-2 py-1.5 text-xs text-navy-100 outline-none focus:border-navy-400"
          >
            <option value="">全部状态</option>
            <option value="pending">待处理</option>
            <option value="returned">已退回</option>
            <option value="resolved">已解决</option>
          </select>
          <input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="搜索原因/票号..."
            className="flex-1 rounded-md border border-navy-500/30 bg-navy-800 px-3 py-1.5 text-xs text-navy-100 placeholder:text-navy-400 outline-none focus:border-navy-400"
          />
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto">
          {filtered.map((ex) => (
            <button
              key={ex.id}
              onClick={() => setSelectedId(ex.id === selectedId ? null : ex.id)}
              className={cn(
                'w-full rounded-lg border p-3 text-left transition-all duration-200',
                ex.id === selectedId
                  ? 'border-navy-400 bg-navy-600/60 shadow-md shadow-navy-500/10'
                  : 'border-navy-500/20 bg-navy-700/30 hover:border-navy-500/40 hover:bg-navy-700/50'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-red-500/15 text-red-400">
                    {exceptionIcons[ex.exceptionType]}
                  </span>
                  <span className="text-xs font-medium text-navy-100">
                    {EXCEPTION_TYPE_LABELS[ex.exceptionType]}
                  </span>
                </div>
                <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-medium', statusConfig[ex.status].className)}>
                  {statusConfig[ex.status].label}
                </span>
              </div>
              <p className="mt-2 truncate text-xs text-navy-200">{ex.reason}</p>
              <div className="mt-2 flex items-center gap-3 text-[10px] text-navy-400">
                <span className="flex items-center gap-1"><User className="h-3 w-3" />{ex.operator}</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{ex.operateTime}</span>
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-navy-400">
              <AlertTriangle className="mb-2 h-8 w-8" />
              <span className="text-sm">暂无异常记录</span>
            </div>
          )}
        </div>
      </div>

      {selected && (
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto">
          <div className="flex items-center gap-2">
            <button onClick={() => setSelectedId(null)} className="text-navy-300 hover:text-white">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h2 className="text-sm font-semibold text-white">异常详情</h2>
          </div>

          <div className="rounded-lg border border-navy-500/20 bg-navy-700/40 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/15 text-red-400">
                {exceptionIcons[selected.exceptionType]}
              </span>
              <span className="text-sm font-medium text-white">
                {EXCEPTION_TYPE_LABELS[selected.exceptionType]}
              </span>
              <span className={cn('ml-auto rounded-full border px-2.5 py-0.5 text-[10px] font-medium', statusConfig[selected.status].className)}>
                {statusConfig[selected.status].label}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
              <div><span className="text-navy-400">关联票据</span><p className="mt-0.5 text-navy-100">{selected.invoiceId}</p></div>
              <div><span className="text-navy-400">操作人</span><p className="mt-0.5 text-navy-100">{selected.operator}</p></div>
              <div className="col-span-2"><span className="text-navy-400">异常原因</span><p className="mt-0.5 text-navy-100">{selected.reason}</p></div>
              <div><span className="text-navy-400">操作时间</span><p className="mt-0.5 text-navy-100">{selected.operateTime}</p></div>
            </div>
          </div>

          {selected.status !== 'resolved' && (
            <div className="rounded-lg border border-navy-500/20 bg-navy-700/40 p-4">
              <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold text-white">
                <Send className="h-3.5 w-3.5 text-navy-300" />退回操作
              </h3>
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="mb-2 w-full rounded-md border border-navy-500/30 bg-navy-800 px-3 py-2 text-xs text-navy-100 outline-none focus:border-navy-400"
              >
                <option value="">选择退回模板</option>
                {returnTemplates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              {selectedTemplateId && (
                <p className="mb-2 rounded-md bg-navy-800/60 px-3 py-2 text-[10px] leading-relaxed text-navy-300">
                  {returnTemplates.find((t) => t.id === selectedTemplateId)?.content}
                </p>
              )}
              <textarea
                value={suppText}
                onChange={(e) => setSuppText(e.target.value)}
                placeholder="补充说明（选填）"
                rows={2}
                className="mb-3 w-full resize-none rounded-md border border-navy-500/30 bg-navy-800 px-3 py-2 text-xs text-navy-100 placeholder:text-navy-400 outline-none focus:border-navy-400"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleReturn}
                  disabled={selected.status === 'returned'}
                  className="flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send className="h-3 w-3" />退回
                </button>
                <button
                  onClick={handleResolve}
                  className="flex items-center gap-1.5 rounded-md bg-emerald-600 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-500"
                >
                  <CheckCircle className="h-3 w-3" />解决
                </button>
              </div>
            </div>
          )}

          <div className="rounded-lg border border-navy-500/20 bg-navy-700/40 p-4">
            <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold text-white">
              <MessageSquare className="h-3.5 w-3.5 text-navy-300" />审核轨迹
            </h3>
            <div className="relative ml-3 border-l-2 border-navy-500/30 pl-5">
              {selected.auditTrail.map((entry, i) => (
                <div key={entry.id} className={cn('relative pb-4', i === selected.auditTrail.length - 1 && 'pb-0')}>
                  <div className="absolute -left-[1.55rem] top-0.5 h-3 w-3 rounded-full border-2 border-navy-400 bg-navy-800" />
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-navy-500/50 text-[9px] font-bold text-navy-100">
                      {entry.operator.charAt(0)}
                    </span>
                    <span className="text-xs font-medium text-navy-100">{entry.operator}</span>
                    <span className="text-[10px] text-navy-400">{entry.action}</span>
                  </div>
                  <p className="text-[10px] text-navy-400">{entry.timestamp}</p>
                  {entry.remark && (
                    <p className="mt-1 rounded bg-navy-800/50 px-2 py-1 text-[10px] text-navy-300">{entry.remark}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
