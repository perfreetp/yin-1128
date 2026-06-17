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

  updateExtractedField: (invoiceId, field, value) =>
    set((state) => ({
      extractedFields: {
        ...state.extractedFields,
        [invoiceId]: {
          ...state.extractedFields[invoiceId],
          [field]: value,
        },
      },
    })),

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

    const comparisons: FieldComparison[] = [
      {
        field: 'invoiceNumber',
        label: '票号',
        extracted: extracted.invoiceNumber,
        declared: declared.invoiceNumber,
        match: extracted.invoiceNumber === declared.invoiceNumber,
      },
      {
        field: 'amount',
        label: '金额',
        extracted: extracted.amount.toFixed(2),
        declared: declared.amount.toFixed(2),
        match: extracted.amount === declared.amount,
      },
      {
        field: 'taxAmount',
        label: '税额',
        extracted: extracted.taxAmount.toFixed(2),
        declared: declared.taxAmount.toFixed(2),
        match: extracted.taxAmount === declared.taxAmount,
      },
      {
        field: 'totalAmount',
        label: '价税合计',
        extracted: extracted.totalAmount.toFixed(2),
        declared: declared.totalAmount.toFixed(2),
        match: extracted.totalAmount === declared.totalAmount,
      },
      {
        field: 'date',
        label: '日期',
        extracted: extracted.date,
        declared: declared.date,
        match: extracted.date === declared.date,
      },
      {
        field: 'buyerName',
        label: '购买方',
        extracted: extracted.buyerName,
        declared: declared.buyerName,
        match: extracted.buyerName === declared.buyerName,
      },
      {
        field: 'sellerName',
        label: '销售方',
        extracted: extracted.sellerName,
        declared: declared.sellerName,
        match: extracted.sellerName === declared.sellerName,
      },
    ]
    return comparisons
  },

  getInvoicesByStatus: (status) =>
    get().invoices.filter((inv) => inv.status === status),

  getExceptionsByType: (type) =>
    get().exceptions.filter((ex) => ex.exceptionType === type),
}))
