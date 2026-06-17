import { useInvoiceStore } from '@/store/invoiceStore'
import type { VerifyStatus, WarningType } from '@/types'
import { VERIFY_STATUS_LABELS, CATEGORY_LABELS } from '@/types'
import { cn } from '@/lib/utils'
import { ShieldCheck, AlertTriangle, CheckCircle2, XCircle, HelpCircle, Search, Zap, ArrowRight, Shield } from 'lucide-react'

const STATUS_CFG: Record<VerifyStatus, { bg: string; text: string; dot: string; icon: typeof CheckCircle2 }> = {
  passed: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400', icon: CheckCircle2 },
  suspected: { bg: 'bg-amber-500/15', text: 'text-amber-400', dot: 'bg-amber-400', icon: AlertTriangle },
  failed: { bg: 'bg-red-500/15', text: 'text-red-400', dot: 'bg-red-400', icon: XCircle },
  pending: { bg: 'bg-gray-500/15', text: 'text-gray-400', dot: 'bg-gray-400', icon: HelpCircle },
}

const WARNING_CHIP: Record<WarningType, string> = {
  consecutive: 'bg-blue-500/20 text-blue-300',
  same_merchant: 'bg-orange-500/20 text-orange-300',
  amount_anomaly: 'bg-red-500/20 text-red-300',
  format_anomaly: 'bg-purple-500/20 text-purple-300',
  tampering: 'bg-red-500/20 text-red-300',
}

const SEVERITY_DOT: Record<string, string> = {
  low: 'bg-blue-400',
  medium: 'bg-amber-400',
  high: 'bg-red-400',
}

const SEVERITY_LABEL: Record<string, string> = {
  low: '低',
  medium: '中',
  high: '高',
}

export default function VerifyPage() {
  const {
    invoices, verificationResults, extractedFields,
    selectedInvoiceId, setSelectedInvoice,
    runVerification, batchVerify, createExceptionFromVerification,
  } = useInvoiceStore()

  const countBy = (s: VerifyStatus) =>
    invoices.filter(i => (verificationResults[i.id]?.onlineVerify ?? 'pending') === s).length

  const pendingIds = invoices
    .filter(i => (verificationResults[i.id]?.onlineVerify ?? 'pending') === 'pending')
    .map(i => i.id)

  const selected = invoices.find(i => i.id === selectedInvoiceId)
  const selectedResult = selectedInvoiceId ? verificationResults[selectedInvoiceId] : null

  const summaryCards: { label: string; count: number; color: string; bg: string; border: string; icon: typeof CheckCircle2 }[] = [
    { label: '验证通过', count: countBy('passed'), color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: CheckCircle2 },
    { label: '存疑待查', count: countBy('suspected'), color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: AlertTriangle },
    { label: '验证失败', count: countBy('failed'), color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: XCircle },
    { label: '待验证', count: countBy('pending'), color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/20', icon: HelpCircle },
  ]

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="flex items-center gap-3 mb-6">
        <ShieldCheck className="w-7 h-7 text-blue-400" />
        <h1 className="text-2xl font-bold">验真台</h1>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {summaryCards.map(c => (
          <div key={c.label} className={cn('rounded-xl border p-4', c.bg, c.border)}>
            <c.icon className={cn('w-5 h-5 mb-2', c.color)} />
            <div className={cn('text-2xl font-bold', c.color)}>{c.count}</div>
            <div className="text-sm text-slate-400 mt-1">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-400">共 {invoices.length} 条记录</span>
            </div>
            <button onClick={() => batchVerify(pendingIds)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm text-white">
              <Zap className="w-4 h-4" />批量验真
            </button>
          </div>

          <div className="rounded-xl border border-slate-700/50 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-800/60 text-slate-400">
                  <th className="text-left px-4 py-3 font-medium">票号</th>
                  <th className="text-left px-4 py-3 font-medium">票种</th>
                  <th className="text-right px-4 py-3 font-medium">金额</th>
                  <th className="text-center px-4 py-3 font-medium">验真状态</th>
                  <th className="text-center px-4 py-3 font-medium">查重结果</th>
                  <th className="text-left px-4 py-3 font-medium">预警信息</th>
                  <th className="text-center px-4 py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => {
                  const result = verificationResults[inv.id]
                  const status: VerifyStatus = result?.onlineVerify ?? 'pending'
                  const fields = extractedFields[inv.id]
                  const isDup = result?.duplicateCheck.isDuplicate ?? false
                  const cfg = STATUS_CFG[status]

                  return (
                    <tr
                      key={inv.id}
                      onClick={() => setSelectedInvoice(selectedInvoiceId === inv.id ? null : inv.id)}
                      className={cn(
                        'border-t border-slate-700/40 cursor-pointer hover:bg-slate-800/40 transition-colors',
                        isDup && 'border-l-4 border-l-red-500',
                        selectedInvoiceId === inv.id && 'bg-slate-800/60',
                      )}
                    >
                      <td className="px-4 py-3 font-mono text-slate-200">{fields?.invoiceNumber ?? '-'}</td>
                      <td className="px-4 py-3">{CATEGORY_LABELS[inv.category] ?? inv.category}</td>
                      <td className="px-4 py-3 text-right font-mono">{fields ? `¥${fields.totalAmount.toFixed(2)}` : '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', cfg.bg, cfg.text)}>
                          <cfg.icon className="w-3 h-3" />{VERIFY_STATUS_LABELS[status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isDup ? (
                          <span className="text-red-400 text-xs">重复 <span className="underline cursor-pointer">{result!.duplicateCheck.duplicateSource}</span></span>
                        ) : result ? (
                          <span className="text-emerald-400 text-xs">无重复</span>
                        ) : (
                          <span className="text-slate-500 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(result?.warnings ?? []).map(w => (
                            <span key={w.id} className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs', WARNING_CHIP[w.type])}>
                              <span className={cn('w-1.5 h-1.5 rounded-full', SEVERITY_DOT[w.severity])} />
                              {w.message}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={e => { e.stopPropagation(); runVerification(inv.id) }}
                          className="px-2 py-1 rounded text-xs bg-blue-600/80 hover:bg-blue-500 text-white"
                        >单票验真</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {selected && selectedResult && (
          <div className="w-80 shrink-0 rounded-xl border border-slate-700/50 bg-slate-900/80 p-4 space-y-4 self-start">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-200">验真详情</h3>
              <button onClick={() => setSelectedInvoice(null)} className="text-slate-500 hover:text-slate-300 text-xs">关闭</button>
            </div>

            <div className="space-y-2">
              <div className="text-xs text-slate-500 flex items-center gap-1"><Shield className="w-3 h-3" />验证时间线</div>
              <div className="space-y-1.5 pl-1">
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  <span className="text-slate-300">提交验真</span>
                </div>
                <div className="flex items-center gap-2 text-xs pl-0.5">
                  <ArrowRight className="w-3 h-3 text-slate-600" />
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className={cn('w-2 h-2 rounded-full', STATUS_CFG[selectedResult.onlineVerify].dot)} />
                  <span className="text-slate-300">{VERIFY_STATUS_LABELS[selectedResult.onlineVerify]}</span>
                </div>
              </div>
              <div className="text-xs text-slate-600">{selectedResult.verifyTime}</div>
            </div>

            {selectedResult.duplicateCheck.isDuplicate && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-300">
                查重发现重复来源：{selectedResult.duplicateCheck.duplicateSource}
              </div>
            )}

            {selectedResult.warnings.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs text-slate-500">预警信息</div>
                {selectedResult.warnings.map(w => (
                  <div key={w.id} className="rounded-lg border border-slate-700/40 p-3 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className={cn('w-2 h-2 rounded-full', SEVERITY_DOT[w.severity])} />
                      <span className={cn('text-xs font-medium', WARNING_CHIP[w.type].split(' ')[1])}>{w.message}</span>
                    </div>
                    <div className="text-xs text-slate-500">严重程度：{SEVERITY_LABEL[w.severity]}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2 pt-3 border-t border-slate-700/40">
              <button
                onClick={() => { setSelectedInvoice(null) }}
                className="w-full px-3 py-2 rounded-lg bg-emerald-600/80 hover:bg-emerald-500 text-sm text-white transition-colors"
              >强制通过</button>
              <button
                onClick={() => { createExceptionFromVerification(selected.id); setSelectedInvoice(null) }}
                className="w-full px-3 py-2 rounded-lg bg-red-600/80 hover:bg-red-500 text-sm text-white transition-colors"
              >退回异常池</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
