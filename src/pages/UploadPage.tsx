import { useState, useRef, useCallback } from 'react'
import { useInvoiceStore } from '@/store/invoiceStore'
import { InvoiceCategory, CATEGORY_LABELS, CATEGORY_COLORS, type InvoiceImage } from '@/types'
import { cn } from '@/lib/utils'
import { Upload, FileImage, CheckCircle, XCircle, Loader2, FolderOpen, RefreshCw, ChevronDown } from 'lucide-react'

const STATUS_ICON = {
  pending: <Loader2 className="w-3.5 h-3.5 text-gray-400" />,
  processing: <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />,
  classified: <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />,
  recognized: <CheckCircle className="w-3.5 h-3.5 text-blue-400" />,
  verified: <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />,
  error: <XCircle className="w-3.5 h-3.5 text-red-400" />,
}

const STATUS_LABEL: Record<InvoiceImage['status'], string> = {
  pending: '待处理',
  processing: '处理中',
  classified: '已分类',
  recognized: '已识别',
  verified: '已验证',
  error: '异常',
}

const ACCEPTED = ['.jpg', '.jpeg', '.png', '.pdf', '.bmp']
const MAX_FILES = 50

export default function UploadPage() {
  const { invoices, selectedInvoiceId, setSelectedInvoice, addInvoices, updateInvoiceCategory, updateInvoiceStatus, generateMockRecognitionForInvoice } = useInvoiceStore()
  const [isDragOver, setIsDragOver] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [catDropdownOpen, setCatDropdownOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const selectedInvoice = invoices.find((i) => i.id === selectedInvoiceId) ?? null

  const totalCount = invoices.length
  const classifiedCount = invoices.filter((i) => ['classified', 'recognized', 'verified'].includes(i.status)).length
  const errorCount = invoices.filter((i) => i.status === 'error').length

  const handleFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files).filter((f) => {
      const ext = '.' + f.name.split('.').pop()?.toLowerCase()
      return ACCEPTED.includes(ext)
    }).slice(0, MAX_FILES)

    if (arr.length === 0) return

    const newInvoices: InvoiceImage[] = arr.map((f, idx) => ({
      id: `UP-${Date.now()}-${idx}`,
      fileName: f.name,
      fileUrl: URL.createObjectURL(f),
      fileType: (f.name.split('.').pop()?.toLowerCase() as InvoiceImage['fileType']) ?? 'jpg',
      uploadTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
      status: 'pending',
      category: 'unknown' as InvoiceCategory,
      department: '待分配',
      batchNo: `B${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-NEW`,
      submitter: '当前用户',
    }))

    addInvoices(newInvoices)
  }, [addInvoices])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const simulateProcess = async () => {
    setProcessing(true)
    const pending = invoices.filter((i) => i.status === 'pending')
    for (let i = 0; i < pending.length; i++) {
      await new Promise((r) => setTimeout(r, 300))
      updateInvoiceStatus(pending[i].id, 'processing')
      await new Promise((r) => setTimeout(r, 500))
      const cats: InvoiceCategory[] = ['vat_invoice', 'reimbursement', 'receipt', 'travel_ticket']
      updateInvoiceCategory(pending[i].id, cats[Math.floor(Math.random() * cats.length)])
      updateInvoiceStatus(pending[i].id, 'classified')
      await new Promise((r) => setTimeout(r, 300))
      generateMockRecognitionForInvoice(pending[i].id)
    }
    setProcessing(false)
  }

  return (
    <div className="h-full flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between bg-navy-800 rounded-lg px-4 py-3 border border-navy-500/20">
        <div className="flex items-center gap-6 text-sm">
          <span className="text-navy-200">文件总数：<span className="text-white font-semibold">{totalCount}</span></span>
          <span className="text-navy-200">已分类：<span className="text-emerald-400 font-semibold">{classifiedCount}</span></span>
          <span className="text-navy-200">异常：<span className="text-red-400 font-semibold">{errorCount}</span></span>
        </div>
        <button
          onClick={simulateProcess}
          disabled={processing || invoices.filter((i) => i.status === 'pending').length === 0}
          className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded-md transition-colors"
        >
          {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          模拟处理
        </button>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'flex flex-col items-center justify-center gap-2 py-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors',
          isDragOver ? 'border-blue-400 bg-blue-400/5' : 'border-navy-500/30 bg-navy-800/50 hover:border-navy-400'
        )}
      >
        <Upload className={cn('w-8 h-8', isDragOver ? 'text-blue-400' : 'text-navy-300')} />
        <p className="text-sm text-navy-200">拖拽文件至此处，或<span className="text-blue-400">点击上传</span></p>
        <p className="text-xs text-navy-300">支持 JPG / PNG / PDF / BMP，单次最多 {MAX_FILES} 个文件</p>
        <input ref={fileInputRef} type="file" multiple accept={ACCEPTED.join(',')} className="hidden" onChange={(e) => e.target.files && handleFiles(e.target.files)} />
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        <div className="flex-1 min-w-0 overflow-auto">
          {invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-navy-400 gap-2">
              <FolderOpen className="w-12 h-12" />
              <p className="text-sm">暂无发票文件，请上传</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {invoices.map((inv) => (
                <div
                  key={inv.id}
                  onClick={() => setSelectedInvoice(inv.id === selectedInvoiceId ? null : inv.id)}
                  className={cn(
                    'relative flex rounded-lg overflow-hidden cursor-pointer border transition-all hover:ring-1 hover:ring-blue-400/50',
                    selectedInvoiceId === inv.id ? 'border-blue-400 ring-1 ring-blue-400/30' : 'border-navy-500/20'
                  )}
                >
                  <div className={cn('w-1.5 shrink-0', CATEGORY_COLORS[inv.category])} />
                  <div className="flex-1 bg-navy-800 p-2 flex flex-col gap-1.5 min-w-0">
                    <div className="w-full h-20 rounded bg-navy-700 flex items-center justify-center overflow-hidden">
                      {inv.fileType === 'pdf' ? (
                        <FileImage className="w-8 h-8 text-navy-400" />
                      ) : (
                        <img src={inv.fileUrl} alt={inv.fileName} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <p className="text-xs text-navy-200 truncate">{inv.fileName}</p>
                    <div className="flex items-center justify-between">
                      <span className={cn('text-[10px] px-1.5 py-0.5 rounded text-white', CATEGORY_COLORS[inv.category])}>
                        {CATEGORY_LABELS[inv.category]}
                      </span>
                      {STATUS_ICON[inv.status]}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedInvoice && (
          <div className="w-80 shrink-0 bg-navy-800 rounded-lg border border-navy-500/20 flex flex-col overflow-hidden">
            <div className="flex-1 p-3 flex items-center justify-center bg-navy-700/50">
              {selectedInvoice.fileType === 'pdf' ? (
                <FileImage className="w-16 h-16 text-navy-400" />
              ) : (
                <img src={selectedInvoice.fileUrl} alt={selectedInvoice.fileName} className="max-w-full max-h-full object-contain rounded" />
              )}
            </div>
            <div className="p-3 flex flex-col gap-3 border-t border-navy-500/20">
              <div className="relative">
                <button
                  onClick={() => setCatDropdownOpen(!catDropdownOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-navy-700 border border-navy-500/20 rounded-md text-sm text-white hover:border-navy-400 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <span className={cn('w-2.5 h-2.5 rounded-full', CATEGORY_COLORS[selectedInvoice.category])} />
                    {CATEGORY_LABELS[selectedInvoice.category]}
                  </span>
                  <ChevronDown className="w-4 h-4 text-navy-300" />
                </button>
                {catDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-navy-700 border border-navy-500/20 rounded-md shadow-lg z-10 overflow-hidden">
                    {(Object.entries(CATEGORY_LABELS) as [InvoiceCategory, string][]).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => { updateInvoiceCategory(selectedInvoice.id, key); setCatDropdownOpen(false) }}
                        className={cn(
                          'w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-navy-600 transition-colors',
                          selectedInvoice.category === key ? 'text-white bg-navy-600/50' : 'text-navy-200'
                        )}
                      >
                        <span className={cn('w-2.5 h-2.5 rounded-full', CATEGORY_COLORS[key])} />
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-navy-300">文件名</span><span className="text-navy-100 truncate ml-2 max-w-[160px]">{selectedInvoice.fileName}</span></div>
                <div className="flex justify-between"><span className="text-navy-300">文件类型</span><span className="text-navy-100">{selectedInvoice.fileType.toUpperCase()}</span></div>
                <div className="flex justify-between"><span className="text-navy-300">上传时间</span><span className="text-navy-100">{selectedInvoice.uploadTime}</span></div>
                <div className="flex justify-between"><span className="text-navy-300">所属部门</span><span className="text-navy-100">{selectedInvoice.department}</span></div>
                <div className="flex justify-between"><span className="text-navy-300">批次号</span><span className="text-navy-100">{selectedInvoice.batchNo}</span></div>
                <div className="flex justify-between"><span className="text-navy-300">状态</span><span className="text-navy-100">{STATUS_LABEL[selectedInvoice.status]}</span></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
