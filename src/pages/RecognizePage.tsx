import { useState } from 'react'
import { useInvoiceStore } from '@/store/invoiceStore'
import { InvoiceCategory, CATEGORY_LABELS, CATEGORY_COLORS, type ExtractedFields } from '@/types'
import { cn } from '@/lib/utils'
import { ScanSearch, Edit3, Check, X, AlertCircle, ChevronRight, Eye } from 'lucide-react'

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  pending: { label: '待处理', cls: 'bg-gray-500/30 text-gray-300' },
  processing: { label: '处理中', cls: 'bg-blue-500/30 text-blue-300' },
  classified: { label: '已分类', cls: 'bg-indigo-500/30 text-indigo-300' },
  recognized: { label: '已识别', cls: 'bg-emerald-500/30 text-emerald-300' },
  verified: { label: '已验证', cls: 'bg-green-500/30 text-green-300' },
  error: { label: '异常', cls: 'bg-red-500/30 text-red-300' },
}

const FILTER_TABS: { key: InvoiceCategory | 'all'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'vat_invoice', label: '增值税发票' },
  { key: 'reimbursement', label: '报销单' },
  { key: 'receipt', label: '收据' },
  { key: 'travel_ticket', label: '行程票' },
]

const FIELD_ITEMS: { key: keyof ExtractedFields; label: string }[] = [
  { key: 'invoiceNumber', label: '发票号码' },
  { key: 'amount', label: '金额' },
  { key: 'taxAmount', label: '税额' },
  { key: 'totalAmount', label: '价税合计' },
  { key: 'date', label: '日期' },
  { key: 'buyerName', label: '购买方名称' },
  { key: 'buyerTaxId', label: '购买方税号' },
  { key: 'sellerName', label: '销售方名称' },
  { key: 'sellerTaxId', label: '销售方税号' },
]

export default function RecognizePage() {
  const [filter, setFilter] = useState<InvoiceCategory | 'all'>('all')
  const {
    invoices, extractedFields, selectedInvoiceId,
    setSelectedInvoice, updateExtractedField, updateInvoiceStatus, getFieldComparisons,
  } = useInvoiceStore()

  const filtered = filter === 'all' ? invoices : invoices.filter((i) => i.category === filter)
  const selected = invoices.find((i) => i.id === selectedInvoiceId)
  const extracted = selectedInvoiceId ? extractedFields[selectedInvoiceId] : null
  const comparisons = selectedInvoiceId ? getFieldComparisons(selectedInvoiceId) : []

  return (
    <div className="flex h-full flex-col bg-navy-900 text-white">
      <div className="flex flex-1 overflow-hidden">
        <div className="flex w-72 flex-col border-r border-navy-600 bg-navy-800">
          <div className="flex items-center gap-2 border-b border-navy-600 px-4 py-3">
            <ScanSearch className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-semibold">识别校对台</span>
          </div>
          <div className="flex gap-1 border-b border-navy-600 px-3 py-2">
            {FILTER_TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setFilter(t.key)}
                className={cn(
                  'rounded px-2 py-1 text-xs transition-colors',
                  filter === t.key ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-navy-700 hover:text-gray-200',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.map((inv) => {
              const st = STATUS_MAP[inv.status] ?? STATUS_MAP.pending
              return (
                <button
                  key={inv.id}
                  onClick={() => setSelectedInvoice(inv.id)}
                  className={cn(
                    'flex w-full items-center gap-3 border-b border-navy-700/50 px-3 py-2 text-left transition-colors',
                    selectedInvoiceId === inv.id ? 'bg-navy-600' : 'hover:bg-navy-700/50',
                  )}
                >
                  <div className="h-12 w-9 shrink-0 overflow-hidden rounded bg-navy-700">
                    <img src={inv.fileUrl} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className={cn('h-10 w-1 shrink-0 rounded-full', CATEGORY_COLORS[inv.category])} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">{inv.id}</p>
                    <p className="truncate text-[11px] text-gray-500">{CATEGORY_LABELS[inv.category]}</p>
                  </div>
                  <span className={cn('shrink-0 rounded px-1.5 py-0.5 text-[10px]', st.cls)}>
                    {st.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto">
          {!selected || !extracted ? (
            <div className="flex flex-1 items-center justify-center text-gray-500">
              <div className="text-center">
                <Eye className="mx-auto mb-2 h-10 w-10 opacity-40" />
                <p className="text-sm">请从左侧选择发票进行校对</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 p-5">
              <div className="overflow-hidden rounded-lg border border-navy-600 bg-navy-800">
                <img src={selected.fileUrl} alt="" className="h-56 w-full object-contain bg-navy-900" />
              </div>

              <div className="rounded-lg border border-navy-600 bg-navy-800 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Edit3 className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm font-semibold">识别字段</span>
                  <span className="ml-auto text-xs text-gray-400">
                    置信度: {extracted.confidence}%
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {FIELD_ITEMS.map(({ key, label }) => (
                    <div key={key}>
                      <label className="mb-1 block text-[11px] text-gray-400">{label}</label>
                      <input
                        value={String(extracted[key] ?? '')}
                        onChange={(e) => updateExtractedField(selected.id, key, e.target.value)}
                        className="w-full rounded border border-navy-600 bg-navy-700 px-2 py-1.5 text-xs text-white outline-none focus:border-blue-500"
                      />
                      {key !== 'confidence' && (
                        <div className="mt-1 h-1 overflow-hidden rounded-full bg-navy-700">
                          <div
                            className={cn(
                              'h-full rounded-full',
                              extracted.confidence >= 90 ? 'bg-emerald-500' : extracted.confidence >= 70 ? 'bg-amber-500' : 'bg-red-500',
                            )}
                            style={{ width: `${extracted.confidence}%` }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {comparisons.length > 0 && (
                <div className="rounded-lg border border-navy-600 bg-navy-800 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-400" />
                    <span className="text-sm font-semibold">字段比对</span>
                  </div>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-navy-600 text-gray-400">
                        <th className="py-2 text-left font-normal">字段</th>
                        <th className="py-2 text-left font-normal">识别值</th>
                        <th className="py-2 text-left font-normal">申报值</th>
                        <th className="py-2 text-center font-normal">状态</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisons.map((c) => (
                        <tr key={c.field} className={cn('border-b border-navy-700/50', !c.match && 'bg-red-900/30')}>
                          <td className="py-2 text-gray-300">{c.label}</td>
                          <td className="py-2 font-mono">{c.extracted}</td>
                          <td className="py-2 font-mono">{c.declared}</td>
                          <td className="py-2 text-center">
                            {c.match ? (
                              <Check className="mx-auto h-3.5 w-3.5 text-emerald-400" />
                            ) : (
                              <X className="mx-auto h-3.5 w-3.5 text-red-400" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 border-t border-navy-600 bg-navy-800 px-5 py-3">
        <button
          onClick={() => invoices.forEach((i) => updateInvoiceStatus(i.id, 'verified'))}
          className="flex items-center gap-1.5 rounded bg-emerald-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-emerald-500"
        >
          <Check className="h-3.5 w-3.5" />
          批量确认通过
        </button>
        <button
          onClick={() => invoices.forEach((i) => updateInvoiceStatus(i.id, 'error'))}
          className="flex items-center gap-1.5 rounded bg-red-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-red-500"
        >
          <X className="h-3.5 w-3.5" />
          批量退回
        </button>
        <button
          onClick={() => invoices.forEach((i) => updateInvoiceStatus(i.id, 'pending'))}
          className="flex items-center gap-1.5 rounded bg-amber-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-amber-500"
        >
          <AlertCircle className="h-3.5 w-3.5" />
          标记待复核
        </button>
        <span className="ml-auto text-xs text-gray-500">共 {filtered.length} 张发票</span>
      </div>
    </div>
  )
}
