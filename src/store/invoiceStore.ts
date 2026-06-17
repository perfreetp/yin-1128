import { create } from 'zustand'
import type {
  InvoiceImage,
  ExtractedFields,
  DeclaredFields,
  FieldComparison,
  VerificationResult,
  ExceptionRecord,
  RuleConfig,
  ReturnTemplate,
  StatisticsData,
  DailyStats,
  InvoiceCategory,
  VerifyStatus,
  ExceptionType,
} from '@/types'
import {
  mockInvoices,
  mockExtractedFields,
  mockDeclaredFields,
  mockVerificationResults,
  mockExceptions,
  mockRuleConfig,
  mockReturnTemplates,
  mockStatistics,
  mockDailyStats,
} from '@/mock/data'

interface InvoiceStore {
  invoices: InvoiceImage[]
  extractedFields: Record<string, ExtractedFields>
  declaredFields: Record<string, DeclaredFields>
  verificationResults: Record<string, VerificationResult>
  exceptions: ExceptionRecord[]
  ruleConfig: RuleConfig
  returnTemplates: ReturnTemplate[]
  statistics: StatisticsData[]
  dailyStats: DailyStats[]
  selectedInvoiceId: string | null

  setSelectedInvoice: (id: string | null) => void
  addInvoices: (invoices: InvoiceImage[]) => void
  updateInvoiceCategory: (id: string, category: InvoiceCategory) => void
  updateInvoiceStatus: (id: string, status: InvoiceImage['status']) => void
  updateExtractedField: (invoiceId: string, field: keyof ExtractedFields, value: string | number) => void
  generateMockRecognitionForInvoice: (invoiceId: string) => void
  createExceptionFromVerification: (invoiceId: string) => void
  exportReviewResultsCSV: () => string
  runVerification: (invoiceId: string) => void
  batchVerify: (invoiceIds: string[]) => void
  addException: (exception: ExceptionRecord) => void
  updateException: (id: string, updates: Partial<ExceptionRecord>) => void
  addAuditEntry: (exceptionId: string, entry: ExceptionRecord['auditTrail'][0]) => void
  updateRuleConfig: (updates: Partial<RuleConfig>) => void
  addReturnTemplate: (template: ReturnTemplate) => void
  updateReturnTemplate: (id: string, updates: Partial<ReturnTemplate>) => void
  deleteReturnTemplate: (id: string) => void
  getFieldComparisons: (invoiceId: string) => FieldComparison[]
  getInvoicesByStatus: (status: string) => InvoiceImage[]
  getExceptionsByType: (type: ExceptionType) => ExceptionRecord[]
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const useInvoiceStore = create<InvoiceStore>((set, get) => ({
  invoices: mockInvoices,
  extractedFields: mockExtractedFields,
  declaredFields: mockDeclaredFields,
  verificationResults: mockVerificationResults,
  exceptions: mockExceptions,
  ruleConfig: mockRuleConfig,
  returnTemplates: mockReturnTemplates,
  statistics: mockStatistics,
  dailyStats: mockDailyStats,
  selectedInvoiceId: null,

  setSelectedInvoice: (id) => set({ selectedInvoiceId: id }),

  addInvoices: (invoices) => set((state) => ({ invoices: [...state.invoices, ...invoices] })),

  updateInvoiceCategory: (id, category) =>
    set((state) => ({
      invoices: state.invoices.map((inv) =>
        inv.id === id ? { ...inv, category } : inv
      ),
    })),

  updateInvoiceStatus: (id, status) =>
    set((state) => ({
      invoices: state.invoices.map((inv) =>
        inv.id === id ? { ...inv, status } : inv
      ),
    })),

  updateExtractedField: (invoiceId, field, value) => {
    const numericFields: (keyof ExtractedFields)[] = ['amount', 'taxAmount', 'totalAmount', 'confidence']
    const normalizedValue = numericFields.includes(field) ? Number(value) || 0 : value
    set((state) => {
      const base: ExtractedFields = state.extractedFields[invoiceId] ?? {
        invoiceNumber: '', amount: 0, taxAmount: 0, totalAmount: 0,
        date: '', buyerName: '', buyerTaxId: '', sellerName: '', sellerTaxId: '', confidence: 80,
      }
      return {
        extractedFields: {
          ...state.extractedFields,
          [invoiceId]: {
            ...base,
            [field]: normalizedValue,
          },
        },
      }
    })
  },

  generateMockRecognitionForInvoice: (invoiceId) => {
    const invoice = get().invoices.find((i) => i.id === invoiceId)
    if (!invoice) return

    const catsWithTax: InvoiceCategory[] = ['vat_invoice']
    const hasTax = catsWithTax.includes(invoice.category)
    const baseAmount = Math.floor(Math.random() * 9000 + 500)
    const tax = hasTax ? Math.round(baseAmount * 0.13 * 100) / 100 : 0
    const total = Math.round((baseAmount + tax) * 100) / 100
    const randomDay = Math.floor(Math.random() * 28 + 1).toString().padStart(2, '0')

    const sellerPool = [
      '上海办公用品有限公司', '京东商城', '深圳电子科技有限公司',
      '广州贸易公司', '中国铁路', '中国国际航空',
      '北京餐饮连锁有限公司', '杭州科技有限公司',
    ]
    const seller = sellerPool[Math.floor(Math.random() * sellerPool.length)]

    const extracted: ExtractedFields = {
      invoiceNumber: `${Math.floor(Math.random() * 9e7 + 1e7)}`,
      amount: baseAmount,
      taxAmount: tax,
      totalAmount: total,
      date: `2024-01-${randomDay}`,
      buyerName: '北京科技有限公司',
      buyerTaxId: hasTax ? '91110000MA01ABCDEF' : '',
      sellerName: seller,
      sellerTaxId: hasTax ? `91${Math.floor(Math.random() * 9e13 + 1e13)}` : '',
      confidence: Math.floor(Math.random() * 25 + 75),
    }

    const drift = Math.random()
    const declared: DeclaredFields = {
      invoiceNumber: drift > 0.8 ? `${Math.floor(Math.random() * 9e7 + 1e7)}` : extracted.invoiceNumber,
      amount: drift > 0.6 ? Math.round((baseAmount + (Math.random() * 600 - 300)) * 100) / 100 : baseAmount,
      taxAmount: hasTax && drift > 0.7 ? Math.round((tax + (Math.random() * 50 - 25)) * 100) / 100 : tax,
      totalAmount: 0,
      date: drift > 0.85 ? `2024-01-${(parseInt(randomDay) + (Math.random() > 0.5 ? 1 : -1)).toString().padStart(2, '0')}` : extracted.date,
      buyerName: extracted.buyerName,
      sellerName: drift > 0.9 ? sellerPool[(sellerPool.indexOf(seller) + 1) % sellerPool.length] : seller,
    }
    declared.totalAmount = Math.round((declared.amount + declared.taxAmount) * 100) / 100

    set((state) => ({
      extractedFields: { ...state.extractedFields, [invoiceId]: extracted },
      declaredFields: { ...state.declaredFields, [invoiceId]: declared },
      invoices: state.invoices.map((inv) =>
        inv.id === invoiceId ? { ...inv, status: 'recognized' } : inv
      ),
    }))
  },

  createExceptionFromVerification: (invoiceId) => {
    const state = get()
    const result = state.verificationResults[invoiceId]
    const invoice = state.invoices.find((i) => i.id === invoiceId)
    if (!invoice) return

    let exceptionType: ExceptionType = 'verify_failed'
    const reasons: string[] = []

    if (result) {
      if (result.duplicateCheck.isDuplicate) {
        exceptionType = 'duplicate'
        reasons.push(`重复报销（来源：${result.duplicateCheck.duplicateSource}）`)
      }
      result.warnings.forEach((w) => {
        if (w.type === 'tampering' && exceptionType !== 'duplicate') {
          exceptionType = 'tampering'
        }
        if (w.type === 'format_anomaly' && exceptionType !== 'duplicate' && exceptionType !== 'tampering') {
          exceptionType = 'format_anomaly'
        }
        reasons.push(w.message)
      })
      if (result.onlineVerify === 'failed' && reasons.length === 0) {
        reasons.push('在线验真未通过')
      }
      if (result.onlineVerify === 'suspected' && reasons.length === 0) {
        reasons.push('验真存疑，需人工复核')
      }
    }

    if (reasons.length === 0) reasons.push('验真异常，进入人工复核')
    const reasonText = reasons.join('；')
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)

    const exception: ExceptionRecord = {
      id: `EX-${Date.now()}`,
      invoiceId,
      exceptionType,
      reason: reasonText,
      operator: '录单员A',
      operateTime: now,
      status: 'pending',
      auditTrail: [
        {
          id: `A-${Date.now()}-0`,
          operator: '系统',
          action: '验真失败/预警触发',
          timestamp: result?.verifyTime || now,
          remark: reasonText,
        },
        {
          id: `A-${Date.now()}-1`,
          operator: '录单员A',
          action: '退回异常池',
          timestamp: now,
          remark: '验真未通过，转入异常池处理',
        },
      ],
    }

    set((cur) => ({
      exceptions: [...cur.exceptions, exception],
      invoices: cur.invoices.map((inv) =>
        inv.id === invoiceId ? { ...inv, status: 'error' } : inv
      ),
    }))
  },

  exportReviewResultsCSV: () => {
    const state = get()
    const headers = ['票据号', '票种', '金额', '价税合计', '验真状态', '异常原因', '所属部门', '批次号', '提交人']
    const CATEGORY_ZH: Record<InvoiceCategory, string> = {
      vat_invoice: '增值税发票', reimbursement: '报销单', receipt: '收据',
      travel_ticket: '行程票', unknown: '未识别',
    }
    const VERIFY_ZH: Record<VerifyStatus, string> = {
      passed: '验证通过', suspected: '存疑待查', failed: '验证失败', pending: '待验证',
    }
    const escape = (v: string | number) => {
      const s = String(v ?? '')
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`
      }
      return s
    }
    const rows: string[][] = [headers]
    state.invoices.forEach((inv) => {
      const fields = state.extractedFields[inv.id]
      const result = state.verificationResults[inv.id]
      const ex = state.exceptions.find((e) => e.invoiceId === inv.id)
      const reasons: string[] = []
      if (ex) reasons.push(ex.reason)
      else if (result) {
        if (result.duplicateCheck.isDuplicate) reasons.push(`重复：${result.duplicateCheck.duplicateSource}`)
        result.warnings.forEach((w) => reasons.push(w.message))
      }
      const verifyStatus: VerifyStatus = result?.onlineVerify || 'pending'
      rows.push([
        fields?.invoiceNumber || '-',
        CATEGORY_ZH[inv.category],
        fields?.amount.toFixed(2) ?? '-',
        fields?.totalAmount.toFixed(2) ?? '-',
        VERIFY_ZH[verifyStatus],
        reasons.join('；') || '-',
        inv.department,
        inv.batchNo,
        inv.submitter,
      ])
    })
    const csv = rows.map((r) => r.map(escape).join(',')).join('\r\n')
    return '\uFEFF' + csv
  },

  runVerification: (invoiceId) => {
    const state = get()
    const existing = state.verificationResults[invoiceId]
    if (existing && existing.onlineVerify !== 'pending') return

    const invoice = state.invoices.find((i) => i.id === invoiceId)
    if (!invoice) return

    const isDuplicate = invoiceId === 'INV010'
    const random = Math.random()
    let verifyStatus: VerifyStatus = 'passed'
    if (isDuplicate) verifyStatus = 'failed'
    else if (random > 0.7) verifyStatus = 'suspected'
    else if (random > 0.9) verifyStatus = 'failed'

    const result: VerificationResult = {
      invoiceId,
      duplicateCheck: isDuplicate
        ? { isDuplicate: true, duplicateSource: 'INV001（2024-01-15 已报销）' }
        : { isDuplicate: false },
      onlineVerify: verifyStatus,
      warnings: verifyStatus !== 'passed'
        ? [{ id: `W-${Date.now()}`, type: 'amount_anomaly', message: '金额存在异常偏差', severity: 'medium' }]
        : [],
      verifyTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
    }

    set((state) => ({
      verificationResults: { ...state.verificationResults, [invoiceId]: result },
      invoices: state.invoices.map((inv) =>
        inv.id === invoiceId ? { ...inv, status: 'verified' } : inv
      ),
    }))
  },

  batchVerify: (invoiceIds) => {
    invoiceIds.forEach((id) => get().runVerification(id))
  },

  addException: (exception) =>
    set((state) => ({ exceptions: [...state.exceptions, exception] })),

  updateException: (id, updates) =>
    set((state) => ({
      exceptions: state.exceptions.map((ex) =>
        ex.id === id ? { ...ex, ...updates } : ex
      ),
    })),

  addAuditEntry: (exceptionId, entry) =>
    set((state) => ({
      exceptions: state.exceptions.map((ex) =>
        ex.id === exceptionId
          ? { ...ex, auditTrail: [...ex.auditTrail, entry] }
          : ex
      ),
    })),

  updateRuleConfig: (updates) =>
    set((state) => ({ ruleConfig: { ...state.ruleConfig, ...updates } })),

  addReturnTemplate: (template) =>
    set((state) => ({ returnTemplates: [...state.returnTemplates, template] })),

  updateReturnTemplate: (id, updates) =>
    set((state) => ({
      returnTemplates: state.returnTemplates.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    })),

  deleteReturnTemplate: (id) =>
    set((state) => ({
      returnTemplates: state.returnTemplates.filter((t) => t.id !== id),
    })),

  getFieldComparisons: (invoiceId) => {
    const state = get()
    const extracted = state.extractedFields[invoiceId]
    const declared = state.declaredFields[invoiceId]
    if (!extracted || !declared) return []

    const toNum = (v: unknown): number => Number(v) || 0
    const fmt = (v: unknown): string => {
      const n = Number(v)
      if (!isNaN(n) && isFinite(n)) return n.toFixed(2)
      return String(v ?? '')
    }

    const comparisons: FieldComparison[] = [
      {
        field: 'invoiceNumber',
        label: '票号',
        extracted: String(extracted.invoiceNumber ?? ''),
        declared: String(declared.invoiceNumber ?? ''),
        match: String(extracted.invoiceNumber ?? '') === String(declared.invoiceNumber ?? ''),
      },
      {
        field: 'amount',
        label: '金额',
        extracted: fmt(extracted.amount),
        declared: fmt(declared.amount),
        match: Math.abs(toNum(extracted.amount) - toNum(declared.amount)) < 0.01,
      },
      {
        field: 'taxAmount',
        label: '税额',
        extracted: fmt(extracted.taxAmount),
        declared: fmt(declared.taxAmount),
        match: Math.abs(toNum(extracted.taxAmount) - toNum(declared.taxAmount)) < 0.01,
      },
      {
        field: 'totalAmount',
        label: '价税合计',
        extracted: fmt(extracted.totalAmount),
        declared: fmt(declared.totalAmount),
        match: Math.abs(toNum(extracted.totalAmount) - toNum(declared.totalAmount)) < 0.01,
      },
      {
        field: 'date',
        label: '日期',
        extracted: String(extracted.date ?? ''),
        declared: String(declared.date ?? ''),
        match: String(extracted.date ?? '') === String(declared.date ?? ''),
      },
      {
        field: 'buyerName',
        label: '购买方',
        extracted: String(extracted.buyerName ?? ''),
        declared: String(declared.buyerName ?? ''),
        match: String(extracted.buyerName ?? '') === String(declared.buyerName ?? ''),
      },
      {
        field: 'sellerName',
        label: '销售方',
        extracted: String(extracted.sellerName ?? ''),
        declared: String(declared.sellerName ?? ''),
        match: String(extracted.sellerName ?? '') === String(declared.sellerName ?? ''),
      },
    ]
    return comparisons
  },

  getInvoicesByStatus: (status) =>
    get().invoices.filter((inv) => inv.status === status),

  getExceptionsByType: (type) =>
    get().exceptions.filter((ex) => ex.exceptionType === type),
}))
