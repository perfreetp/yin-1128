export type InvoiceCategory = 'vat_invoice' | 'reimbursement' | 'receipt' | 'travel_ticket' | 'unknown'
export type InvoiceFileType = 'pdf' | 'jpg' | 'png' | 'bmp'
export type InvoiceStatus = 'pending' | 'processing' | 'classified' | 'recognized' | 'verified' | 'error'
export type VerifyStatus = 'passed' | 'suspected' | 'failed' | 'pending'
export type WarningType = 'consecutive' | 'same_merchant' | 'amount_anomaly' | 'format_anomaly' | 'tampering'
export type SeverityLevel = 'low' | 'medium' | 'high'
export type ExceptionType = 'duplicate' | 'verify_failed' | 'format_anomaly' | 'tampering' | 'field_mismatch'

export const CATEGORY_LABELS: Record<InvoiceCategory, string> = {
  vat_invoice: '增值税发票',
  reimbursement: '报销单',
  receipt: '收据',
  travel_ticket: '行程票',
  unknown: '未识别',
}

export const CATEGORY_COLORS: Record<InvoiceCategory, string> = {
  vat_invoice: 'bg-blue-500',
  reimbursement: 'bg-emerald-500',
  receipt: 'bg-amber-500',
  travel_ticket: 'bg-purple-500',
  unknown: 'bg-gray-500',
}

export const VERIFY_STATUS_LABELS: Record<VerifyStatus, string> = {
  passed: '验证通过',
  suspected: '存疑待查',
  failed: '验证失败',
  pending: '待验证',
}

export const EXCEPTION_TYPE_LABELS: Record<ExceptionType, string> = {
  duplicate: '重复报销',
  verify_failed: '验真失败',
  format_anomaly: '版式异常',
  tampering: '涂改痕迹',
  field_mismatch: '字段不匹配',
}

export interface InvoiceImage {
  id: string
  fileName: string
  fileUrl: string
  fileType: InvoiceFileType
  uploadTime: string
  status: InvoiceStatus
  category: InvoiceCategory
  croppedUrl?: string
  department: string
  batchNo: string
  submitter: string
}

export interface ExtractedFields {
  invoiceNumber: string
  amount: number
  taxAmount: number
  totalAmount: number
  date: string
  buyerName: string
  buyerTaxId: string
  sellerName: string
  sellerTaxId: string
  confidence: number
}

export interface DeclaredFields {
  invoiceNumber: string
  amount: number
  taxAmount: number
  totalAmount: number
  date: string
  buyerName: string
  sellerName: string
}

export interface FieldComparison {
  field: string
  label: string
  extracted: string
  declared: string
  match: boolean
}

export interface Warning {
  id: string
  type: WarningType
  message: string
  severity: SeverityLevel
}

export interface VerificationResult {
  invoiceId: string
  duplicateCheck: { isDuplicate: boolean; duplicateSource?: string }
  onlineVerify: VerifyStatus
  warnings: Warning[]
  verifyTime: string
}

export interface AuditEntry {
  id: string
  operator: string
  action: string
  timestamp: string
  remark: string
}

export interface ExceptionRecord {
  id: string
  invoiceId: string
  exceptionType: ExceptionType
  reason: string
  returnTemplateId?: string
  operator: string
  operateTime: string
  status: 'pending' | 'returned' | 'resolved'
  auditTrail: AuditEntry[]
}

export interface RuleConfig {
  consecutiveThreshold: number
  sameMerchantThreshold: number
  amountAnomalyThreshold: number
  verifyTimeout: number
  autoVerify: boolean
  maxRetryCount: number
}

export interface ReturnTemplate {
  id: string
  name: string
  category: string
  content: string
}

export interface StatisticsData {
  department: string
  batchNo: string
  total: number
  passed: number
  failed: number
  pending: number
  passRate: number
  category: InvoiceCategory
}

export interface DailyStats {
  date: string
  total: number
  passed: number
  failed: number
  avgProcessTime: number
}
