export const POSITION_TYPE = "AI_CONTENT_OPS" as const;

export const ROLE_LABEL: Record<string, string> = {
  ops: "运营",
  enterprise: "企业客户",
  worker: "执行端",
};

export const ENTERPRISE_STATUS: Record<string, string> = {
  potential: "潜在",
  signed: "已签约",
  paused: "暂停",
  terminated: "终止",
};

export const SIGN_STATUS: Record<string, string> = {
  draft: "草稿",
  pending: "待签",
  signed: "已签约",
  executing: "执行中",
  ended: "已结束",
  voided: "已作废",
};

export const POSITION_STATUS: Record<string, string> = {
  draft: "草稿",
  active: "启用",
  inactive: "停用",
};

export const SETTLEMENT_CYCLE: Record<string, string> = {
  per_headcount_month: "按人月",
  per_piece: "按件",
  per_week: "按周",
};

export const TALENT_STATUS: Record<string, string> = {
  candidate: "候选",
  training: "培训中",
  eligible: "可上岗",
  on_duty: "在岗",
  inactive: "停用",
};

export const TRAINING_PROGRESS: Record<string, string> = {
  not_started: "未开始",
  in_progress: "进行中",
  graduated: "已结业",
};

export const DISABILITY_TYPES = ["视力", "听力", "言语", "肢体", "智力", "精神", "多重"] as const;

export const DISABILITY_LEVELS = ["一级", "二级", "三级", "四级"] as const;

export const INDUSTRIES = ["制造", "电商外贸", "品牌连锁", "服务", "其他"] as const;

export const TASK_STATUS: Record<string, string> = {
  assigned: "已派发",
  in_progress: "进行中",
  submitted: "已提交",
  rework: "返工中",
  accepted: "已验收",
  cancelled: "已取消",
};

export const TASK_COLUMNS = [
  "assigned",
  "in_progress",
  "submitted",
  "rework",
  "accepted",
  "cancelled",
] as const;

export const OPEN_TASK_STATUSES = ["assigned", "in_progress", "submitted", "rework"] as const;

export const TASK_ACTION: Record<string, string> = {
  create: "创建",
  dispatch: "派发",
  claim: "领取",
  submit: "提交",
  qa_fail: "质检不通过",
  qa_pass: "质检通过",
  accept: "验收",
  cancel: "取消",
  reassign: "改派",
  edit: "编辑",
  internal_note: "内部备注",
  copy: "复制",
};

export const QA_RESULT: Record<string, string> = {
  pending: "待质检",
  passed: "通过",
  failed: "不通过",
};

export const LEDGER_STATUS: Record<string, string> = {
  incomplete: "未齐",
  pending_review: "待核",
  checked: "已核",
  anomaly: "异常",
};

export const LEDGER_SLOT: Record<string, string> = {
  contract: "合同",
  social_security: "社保",
  payroll: "发薪",
  tax_invoice: "个税/发票",
};

export const LEDGER_SLOTS = ["contract", "social_security", "payroll", "tax_invoice"] as const;

export const BILL_STATUS: Record<string, string> = {
  draft: "草稿",
  issued: "已出账",
  confirmed: "已确认",
  voided: "作废",
};

export const INVOICE_STATUS: Record<string, string> = {
  none: "未开票",
  issued: "已开票",
  partial: "部分开票",
};

export const PAYMENT_STATUS: Record<string, string> = {
  unpaid: "未回款",
  partial: "部分回款",
  paid: "已回款",
};

export const USER_STATUS: Record<string, string> = {
  active: "启用",
  disabled: "停用",
};

export const PRODUCT_LINE_LABEL = "合规交付 + 单岗位";

export const AUDIT_ACTION: Record<string, string> = {
  create: "创建",
  update: "更新",
  delete: "删除",
  bind: "上岗",
  unbind: "离岗",
  reset_password: "重置密码",
  disable: "停用",
  enable: "启用",
  generate: "生成账单",
  issue: "出账",
  confirm: "确认账单",
  void: "作废",
  invoice: "更新开票",
  payment: "更新回款",
  adjustment: "增减项",
  upload: "上传附件",
  remove_file: "移除附件",
  check: "核对台账",
};

export function labelOf(map: Record<string, string>, key: string | null | undefined) {
  if (!key) return "—";
  return map[key] ?? key;
}
