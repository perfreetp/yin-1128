import { useState } from 'react'
import { useInvoiceStore } from '@/store/invoiceStore'
import type { RuleConfig, ReturnTemplate } from '@/types'
import { EXCEPTION_TYPE_LABELS } from '@/types'
import { cn } from '@/lib/utils'
import {
  Settings,
  Plus,
  Edit3,
  Trash2,
  Save,
  ToggleLeft,
  ToggleRight,
  Hash,
  Building2,
  DollarSign,
  Timer,
  RefreshCw,
  FileText,
  ChevronDown,
  X,
} from 'lucide-react'

type TabKey = 'warning' | 'return' | 'verify'

const tabs: { key: TabKey; label: string; icon: typeof Settings }[] = [
  { key: 'warning', label: '预警规则', icon: Hash },
  { key: 'return', label: '退回原因模板', icon: FileText },
  { key: 'verify', label: '验真策略', icon: RefreshCw },
]

export default function RulesPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('warning')
  const { ruleConfig, returnTemplates, updateRuleConfig, addReturnTemplate, updateReturnTemplate, deleteReturnTemplate } = useInvoiceStore()

  const [warningForm, setWarningForm] = useState<RuleConfig>(ruleConfig)
  const [verifyForm, setVerifyForm] = useState<RuleConfig>(ruleConfig)

  const [showAddTemplate, setShowAddTemplate] = useState(false)
  const [newTemplate, setNewTemplate] = useState({ name: '', category: '', content: '' })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', category: '', content: '' })

  const handleSaveWarning = () => {
    updateRuleConfig({
      consecutiveThreshold: warningForm.consecutiveThreshold,
      sameMerchantThreshold: warningForm.sameMerchantThreshold,
      amountAnomalyThreshold: warningForm.amountAnomalyThreshold,
    })
  }

  const handleSaveVerify = () => {
    updateRuleConfig({
      verifyTimeout: verifyForm.verifyTimeout,
      autoVerify: verifyForm.autoVerify,
      maxRetryCount: verifyForm.maxRetryCount,
    })
  }

  const handleAddTemplate = () => {
    if (!newTemplate.name || !newTemplate.category || !newTemplate.content) return
    const template: ReturnTemplate = {
      id: `RT-${Date.now()}`,
      ...newTemplate,
    }
    addReturnTemplate(template)
    setNewTemplate({ name: '', category: '', content: '' })
    setShowAddTemplate(false)
  }

  const handleStartEdit = (t: ReturnTemplate) => {
    setEditingId(t.id)
    setEditForm({ name: t.name, category: t.category, content: t.content })
  }

  const handleSaveEdit = (id: string) => {
    updateReturnTemplate(id, editForm)
    setEditingId(null)
  }

  return (
    <div className="flex h-full flex-col gap-5">
      <div className="flex items-center gap-2.5">
        <Settings className="h-5 w-5 text-navy-200" />
        <h2 className="text-lg font-semibold text-white">规则配置</h2>
      </div>

      <div className="flex gap-1 rounded-lg bg-navy-900/60 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all',
              activeTab === tab.key
                ? 'bg-navy-500/50 text-white shadow-sm'
                : 'text-navy-300 hover:text-white'
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'warning' && (
        <div className="rounded-xl border border-navy-500/20 bg-navy-900/40 p-5">
          <h3 className="mb-4 text-sm font-medium text-navy-100">预警阈值设置</h3>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Hash className="h-4 w-4 text-navy-300" />
              <label className="w-40 shrink-0 text-sm text-navy-200">连号票检测阈值</label>
              <input
                type="number"
                value={warningForm.consecutiveThreshold}
                onChange={(e) => setWarningForm({ ...warningForm, consecutiveThreshold: Number(e.target.value) })}
                className="w-28 rounded-lg border border-navy-500/30 bg-navy-800 px-3 py-2 text-sm text-white outline-none focus:border-status-pass"
              />
              <span className="text-xs text-navy-300">次</span>
            </div>
            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4 text-navy-300" />
              <label className="w-40 shrink-0 text-sm text-navy-200">同商户集中报销阈值</label>
              <input
                type="number"
                value={warningForm.sameMerchantThreshold}
                onChange={(e) => setWarningForm({ ...warningForm, sameMerchantThreshold: Number(e.target.value) })}
                className="w-28 rounded-lg border border-navy-500/30 bg-navy-800 px-3 py-2 text-sm text-white outline-none focus:border-status-pass"
              />
              <span className="text-xs text-navy-300">次/周</span>
            </div>
            <div className="flex items-center gap-3">
              <DollarSign className="h-4 w-4 text-navy-300" />
              <label className="w-40 shrink-0 text-sm text-navy-200">金额异常阈值</label>
              <input
                type="number"
                value={warningForm.amountAnomalyThreshold}
                onChange={(e) => setWarningForm({ ...warningForm, amountAnomalyThreshold: Number(e.target.value) })}
                className="w-28 rounded-lg border border-navy-500/30 bg-navy-800 px-3 py-2 text-sm text-white outline-none focus:border-status-pass"
              />
              <span className="text-xs text-navy-300">元</span>
            </div>
          </div>
          <div className="mt-5 flex justify-end">
            <button
              onClick={handleSaveWarning}
              className="flex items-center gap-2 rounded-lg bg-status-pass/90 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-status-pass"
            >
              <Save className="h-4 w-4" />
              保存
            </button>
          </div>
        </div>
      )}

      {activeTab === 'return' && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowAddTemplate(!showAddTemplate)}
              className="flex items-center gap-1.5 rounded-lg bg-status-pass/90 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-status-pass"
            >
              <Plus className="h-4 w-4" />
              新增模板
            </button>
          </div>

          {showAddTemplate && (
            <div className="rounded-xl border border-status-pass/30 bg-navy-900/60 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-navy-100">新增退回原因模板</span>
                <button onClick={() => setShowAddTemplate(false)} className="text-navy-300 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-col gap-3">
                <input
                  placeholder="模板名称"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  className="rounded-lg border border-navy-500/30 bg-navy-800 px-3 py-2 text-sm text-white outline-none placeholder:text-navy-400 focus:border-status-pass"
                />
                <div className="relative">
                  <select
                    value={newTemplate.category}
                    onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value })}
                    className="w-full appearance-none rounded-lg border border-navy-500/30 bg-navy-800 px-3 py-2 pr-8 text-sm text-white outline-none focus:border-status-pass"
                  >
                    <option value="">选择异常类型</option>
                    {Object.entries(EXCEPTION_TYPE_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 text-navy-300" />
                </div>
                <textarea
                  placeholder="模板内容"
                  value={newTemplate.content}
                  onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                  rows={3}
                  className="rounded-lg border border-navy-500/30 bg-navy-800 px-3 py-2 text-sm text-white outline-none placeholder:text-navy-400 focus:border-status-pass resize-none"
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleAddTemplate}
                    className="rounded-lg bg-status-pass/90 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-status-pass"
                  >
                    确认添加
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {returnTemplates.map((t) => (
              <div
                key={t.id}
                className="rounded-xl border border-navy-500/20 bg-navy-900/40 p-4 transition-colors hover:border-navy-500/40"
              >
                {editingId === t.id ? (
                  <div className="flex flex-col gap-3">
                    <input
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="rounded-lg border border-navy-500/30 bg-navy-800 px-3 py-1.5 text-sm text-white outline-none focus:border-status-pass"
                    />
                    <div className="relative">
                      <select
                        value={editForm.category}
                        onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                        className="w-full appearance-none rounded-lg border border-navy-500/30 bg-navy-800 px-3 py-1.5 pr-8 text-sm text-white outline-none focus:border-status-pass"
                      >
                        {Object.entries(EXCEPTION_TYPE_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2.5 top-2 h-4 w-4 text-navy-300" />
                    </div>
                    <textarea
                      value={editForm.content}
                      onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                      rows={2}
                      className="rounded-lg border border-navy-500/30 bg-navy-800 px-3 py-1.5 text-sm text-white outline-none resize-none focus:border-status-pass"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingId(null)}
                        className="rounded-lg px-3 py-1 text-xs text-navy-300 hover:text-white"
                      >
                        取消
                      </button>
                      <button
                        onClick={() => handleSaveEdit(t.id)}
                        className="rounded-lg bg-status-pass/90 px-3 py-1 text-xs font-medium text-white hover:bg-status-pass"
                      >
                        保存
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mb-2 flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-white">{t.name}</h4>
                        <span className="mt-0.5 inline-block rounded bg-navy-500/40 px-2 py-0.5 text-[10px] text-navy-200">
                          {(EXCEPTION_TYPE_LABELS as Record<string, string>)[t.category] || t.category}
                        </span>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleStartEdit(t)}
                          className="rounded p-1.5 text-navy-300 transition-colors hover:bg-navy-700/50 hover:text-white"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => deleteReturnTemplate(t.id)}
                          className="rounded p-1.5 text-navy-300 transition-colors hover:bg-red-500/20 hover:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="line-clamp-2 text-xs leading-relaxed text-navy-300">
                      {t.content}
                    </p>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'verify' && (
        <div className="rounded-xl border border-navy-500/20 bg-navy-900/40 p-5">
          <h3 className="mb-4 text-sm font-medium text-navy-100">验真策略设置</h3>
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <Timer className="h-4 w-4 text-navy-300" />
              <label className="w-40 shrink-0 text-sm text-navy-200">验真超时时间</label>
              <input
                type="number"
                value={verifyForm.verifyTimeout}
                onChange={(e) => setVerifyForm({ ...verifyForm, verifyTimeout: Number(e.target.value) })}
                className="w-28 rounded-lg border border-navy-500/30 bg-navy-800 px-3 py-2 text-sm text-white outline-none focus:border-status-pass"
              />
              <span className="text-xs text-navy-300">秒</span>
            </div>
            <div className="flex items-center gap-3">
              <RefreshCw className="h-4 w-4 text-navy-300" />
              <label className="w-40 shrink-0 text-sm text-navy-200">自动验真</label>
              <button
                onClick={() => setVerifyForm({ ...verifyForm, autoVerify: !verifyForm.autoVerify })}
                className="flex items-center"
              >
                {verifyForm.autoVerify ? (
                  <ToggleRight className="h-7 w-7 text-status-pass" />
                ) : (
                  <ToggleLeft className="h-7 w-7 text-navy-400" />
                )}
              </button>
              <span className={cn('text-xs', verifyForm.autoVerify ? 'text-status-pass' : 'text-navy-400')}>
                {verifyForm.autoVerify ? '已开启' : '已关闭'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <RefreshCw className="h-4 w-4 text-navy-300" />
              <label className="w-40 shrink-0 text-sm text-navy-200">失败重试次数</label>
              <input
                type="number"
                value={verifyForm.maxRetryCount}
                onChange={(e) => setVerifyForm({ ...verifyForm, maxRetryCount: Number(e.target.value) })}
                className="w-28 rounded-lg border border-navy-500/30 bg-navy-800 px-3 py-2 text-sm text-white outline-none focus:border-status-pass"
              />
              <span className="text-xs text-navy-300">次</span>
            </div>
          </div>
          <div className="mt-5 flex justify-end">
            <button
              onClick={handleSaveVerify}
              className="flex items-center gap-2 rounded-lg bg-status-pass/90 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-status-pass"
            >
              <Save className="h-4 w-4" />
              保存
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
