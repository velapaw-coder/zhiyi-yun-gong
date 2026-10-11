"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { AppError, isZodIssueError } from "@/server/errors";
import { requireActor } from "@/server/session";
import * as repo from "@/server/repo";
import * as tasks from "@/server/tasks";
import * as billing from "@/server/billing";

export type ActionResult<T = undefined> =
  | { ok: true; data?: T; warning?: string }
  | { ok: false; error: string };

async function wrap<T>(work: () => Promise<T>): Promise<ActionResult<T extends void ? undefined : T>> {
  try {
    const data = await work();
    if (data === undefined) return { ok: true };
    return { ok: true, data: data as T extends void ? undefined : T };
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof AppError) {
      return { ok: false, error: error.message };
    }
    if (isZodIssueError(error)) {
      return { ok: false, error: error.issues[0]?.message ?? "输入不合法" };
    }
    console.error(error);
    return { ok: false, error: "系统异常，请稍后重试" };
  }
}

function str(form: FormData, key: string) {
  return String(form.get(key) ?? "");
}

function ids(form: FormData, key = "fileIds") {
  return form.getAll(key).map(String).filter(Boolean);
}

function refresh(...paths: string[]) {
  for (const path of paths) revalidatePath(path);
}

export async function createEnterpriseAction(form: FormData): Promise<ActionResult<{ id: string }>> {
  const actor = await requireActor();
  return wrap(async () => {
    const row = await repo.createEnterprise(actor, {
      code: str(form, "code"),
      name: str(form, "name"),
      industry: str(form, "industry"),
      scaleHeadcount: str(form, "scaleHeadcount"),
      contactName: str(form, "contactName"),
      contactPhone: str(form, "contactPhone"),
      contactEmail: str(form, "contactEmail"),
      status: str(form, "status"),
      remark: str(form, "remark"),
    });
    refresh("/enterprises");
    return { id: row.id };
  });
}

export async function updateEnterpriseAction(id: string, form: FormData): Promise<ActionResult> {
  const actor = await requireActor();
  return wrap(async () => {
    await repo.updateEnterprise(actor, id, {
      name: str(form, "name"),
      industry: str(form, "industry"),
      scaleHeadcount: str(form, "scaleHeadcount"),
      contactName: str(form, "contactName"),
      contactPhone: str(form, "contactPhone"),
      contactEmail: str(form, "contactEmail"),
      status: str(form, "status"),
      remark: str(form, "remark"),
    });
    refresh("/enterprises", `/enterprises/${id}`);
  });
}

export async function deleteEnterpriseAction(id: string): Promise<ActionResult> {
  const actor = await requireActor();
  return wrap(async () => {
    await repo.deleteEnterprise(actor, id);
    refresh("/enterprises");
  });
}

export async function createPlanAction(form: FormData): Promise<ActionResult<{ id: string }>> {
  const actor = await requireActor();
  return wrap(async () => {
    const row = await repo.createPlan(actor, {
      enterpriseId: str(form, "enterpriseId"),
      code: str(form, "code"),
      planVersion: str(form, "planVersion"),
      disabilityFundBase: str(form, "disabilityFundBase"),
      disabilityFundGap: str(form, "disabilityFundGap"),
      monthlyServiceFee: str(form, "monthlyServiceFee"),
      startDate: str(form, "startDate"),
      endDate: str(form, "endDate"),
      signStatus: str(form, "signStatus"),
      remark: str(form, "remark"),
    });
    refresh("/enterprises", `/enterprises/${row.enterpriseId}`, `/plans/${row.id}`);
    return { id: row.id };
  });
}

export async function updatePlanAction(id: string, form: FormData): Promise<ActionResult> {
  const actor = await requireActor();
  return wrap(async () => {
    const row = await repo.updatePlan(actor, id, {
      planVersion: str(form, "planVersion"),
      disabilityFundBase: str(form, "disabilityFundBase"),
      disabilityFundGap: str(form, "disabilityFundGap"),
      monthlyServiceFee: str(form, "monthlyServiceFee"),
      startDate: str(form, "startDate"),
      endDate: str(form, "endDate"),
      signStatus: str(form, "signStatus"),
      remark: str(form, "remark"),
    });
    refresh(`/plans/${id}`, `/enterprises/${row.enterpriseId}`);
  });
}

export async function deletePlanAction(id: string, enterpriseId: string): Promise<ActionResult> {
  const actor = await requireActor();
  return wrap(async () => {
    await repo.deletePlan(actor, id);
    refresh("/enterprises", `/enterprises/${enterpriseId}`);
  });
}

export async function attachPlanFilesAction(planId: string, form: FormData): Promise<ActionResult> {
  const actor = await requireActor();
  return wrap(async () => {
    await repo.attachPlanFiles(actor, planId, ids(form));
    refresh(`/plans/${planId}`);
  });
}

export async function createPositionAction(form: FormData): Promise<ActionResult<{ id: string }>> {
  const actor = await requireActor();
  return wrap(async () => {
    const row = await repo.createPosition(actor, {
      code: str(form, "code"),
      enterpriseId: str(form, "enterpriseId"),
      planId: str(form, "planId"),
      name: str(form, "name"),
      headcount: str(form, "headcount"),
      deliveryStandard: str(form, "deliveryStandard"),
      qaRules: str(form, "qaRules"),
      unitPrice: str(form, "unitPrice"),
      settlementCycle: str(form, "settlementCycle"),
      status: str(form, "status"),
    });
    refresh("/positions", `/positions/${row.id}`);
    return { id: row.id };
  });
}

export async function updatePositionAction(id: string, form: FormData): Promise<ActionResult<{ warning?: string }>> {
  const actor = await requireActor();
  return wrap(async () => {
    const result = await repo.updatePosition(actor, id, {
      name: str(form, "name"),
      headcount: str(form, "headcount"),
      deliveryStandard: str(form, "deliveryStandard"),
      qaRules: str(form, "qaRules"),
      unitPrice: str(form, "unitPrice"),
      settlementCycle: str(form, "settlementCycle"),
      status: str(form, "status"),
      planId: str(form, "planId"),
    });
    refresh("/positions", `/positions/${id}`);
    return { warning: result.warning };
  });
}

export async function deletePositionAction(id: string): Promise<ActionResult> {
  const actor = await requireActor();
  return wrap(async () => {
    await repo.deletePosition(actor, id);
    refresh("/positions");
  });
}

export async function createTalentAction(form: FormData): Promise<ActionResult<{ id: string }>> {
  const actor = await requireActor();
  return wrap(async () => {
    const row = await repo.createTalent(actor, {
      code: str(form, "code"),
      name: str(form, "name"),
      disabilityCertNo: str(form, "disabilityCertNo"),
      disabilityType: str(form, "disabilityType"),
      disabilityLevel: str(form, "disabilityLevel"),
      phone: str(form, "phone"),
      skillTags: str(form, "skillTags"),
      trainingProgress: str(form, "trainingProgress"),
      trainingPercent: str(form, "trainingPercent"),
      status: str(form, "status"),
    });
    refresh("/talents");
    return { id: row.id };
  });
}

export async function updateTalentAction(id: string, form: FormData): Promise<ActionResult> {
  const actor = await requireActor();
  return wrap(async () => {
    await repo.updateTalent(actor, id, {
      name: str(form, "name"),
      disabilityCertNo: str(form, "disabilityCertNo"),
      disabilityType: str(form, "disabilityType"),
      disabilityLevel: str(form, "disabilityLevel"),
      phone: str(form, "phone"),
      skillTags: str(form, "skillTags"),
      trainingProgress: str(form, "trainingProgress"),
      trainingPercent: str(form, "trainingPercent"),
      status: str(form, "status"),
    });
    refresh("/talents", `/talents/${id}`);
  });
}

export async function bindTalentAction(id: string, form: FormData): Promise<ActionResult<{ warning?: string }>> {
  const actor = await requireActor();
  return wrap(async () => {
    const result = await repo.bindTalent(actor, id, {
      positionId: str(form, "positionId"),
      force: form.get("force") === "on",
    });
    refresh("/talents", `/talents/${id}`);
    return { warning: result.warning };
  });
}

export async function unbindTalentAction(id: string): Promise<ActionResult> {
  const actor = await requireActor();
  return wrap(async () => {
    await repo.unbindTalent(actor, id);
    refresh("/talents", `/talents/${id}`);
  });
}

export async function deleteTalentAction(id: string): Promise<ActionResult> {
  const actor = await requireActor();
  return wrap(async () => {
    await repo.deleteTalent(actor, id);
    refresh("/talents");
  });
}

export async function createTaskAction(form: FormData): Promise<ActionResult<{ id: string }>> {
  const actor = await requireActor();
  return wrap(async () => {
    const row = await tasks.createTask(actor, {
      positionId: str(form, "positionId"),
      talentId: str(form, "talentId"),
      title: str(form, "title"),
      description: str(form, "description"),
      planStartAt: str(form, "planStartAt"),
      planEndAt: str(form, "planEndAt"),
      force: form.get("force") === "on",
    });
    refresh("/tasks", `/tasks/${row.id}`);
    return { id: row.id };
  });
}

export async function claimTaskAction(id: string): Promise<ActionResult> {
  const actor = await requireActor();
  return wrap(async () => {
    await tasks.claimTask(actor, id);
    refresh("/tasks", `/tasks/${id}`, "/");
  });
}

export async function submitTaskAction(id: string, form: FormData): Promise<ActionResult> {
  const actor = await requireActor();
  return wrap(async () => {
    await tasks.submitTask(actor, id, {
      summary: str(form, "summary"),
      links: str(form, "links"),
      fileIds: ids(form),
    });
    refresh("/tasks", `/tasks/${id}`, "/");
  });
}

export async function rejectTaskAction(id: string, form: FormData): Promise<ActionResult> {
  const actor = await requireActor();
  return wrap(async () => {
    await tasks.rejectTask(actor, id, {
      comment: str(form, "comment"),
      checked: form.getAll("checked").map(String),
    });
    refresh("/tasks", `/tasks/${id}`, "/");
  });
}

export async function acceptTaskAction(id: string, form: FormData): Promise<ActionResult> {
  const actor = await requireActor();
  return wrap(async () => {
    await tasks.acceptTask(actor, id, {
      comment: str(form, "comment"),
      checked: form.getAll("checked").map(String),
    });
    refresh("/tasks", `/tasks/${id}`, "/");
  });
}

export async function cancelTaskAction(id: string, form: FormData): Promise<ActionResult> {
  const actor = await requireActor();
  return wrap(async () => {
    await tasks.cancelTask(actor, id, str(form, "comment"));
    refresh("/tasks", `/tasks/${id}`);
  });
}

export async function reassignTaskAction(id: string, form: FormData): Promise<ActionResult> {
  const actor = await requireActor();
  return wrap(async () => {
    await tasks.reassignTask(actor, id, str(form, "talentId"), form.get("force") === "on");
    refresh("/tasks", `/tasks/${id}`);
  });
}

export async function editTaskAction(id: string, form: FormData): Promise<ActionResult> {
  const actor = await requireActor();
  return wrap(async () => {
    await tasks.editTask(actor, id, {
      title: str(form, "title"),
      description: str(form, "description"),
      planStartAt: str(form, "planStartAt"),
      planEndAt: str(form, "planEndAt"),
    });
    refresh("/tasks", `/tasks/${id}`);
  });
}

export async function copyTaskAction(id: string): Promise<ActionResult<{ id: string }>> {
  const actor = await requireActor();
  return wrap(async () => {
    const row = await tasks.copyTask(actor, id);
    refresh("/tasks", `/tasks/${row.id}`);
    return { id: row.id };
  });
}

export async function internalNoteAction(id: string, form: FormData): Promise<ActionResult> {
  const actor = await requireActor();
  return wrap(async () => {
    await tasks.addInternalNote(actor, id, str(form, "comment"));
    refresh(`/tasks/${id}`);
  });
}

export async function createLedgerAction(form: FormData): Promise<ActionResult<{ id: string }>> {
  const actor = await requireActor();
  return wrap(async () => {
    const row = await repo.createLedger(actor, {
      enterpriseId: str(form, "enterpriseId"),
      talentId: str(form, "talentId"),
      yearMonth: str(form, "yearMonth"),
    });
    refresh("/ledgers");
    return { id: row.id };
  });
}

export async function updateLedgerAction(id: string, form: FormData): Promise<ActionResult> {
  const actor = await requireActor();
  return wrap(async () => {
    await repo.updateLedger(actor, id, {
      checkStatus: str(form, "checkStatus"),
      anomalyNote: str(form, "anomalyNote"),
    });
    refresh("/ledgers", `/ledgers/${id}`);
  });
}

export async function attachLedgerFilesAction(id: string, slot: string, form: FormData): Promise<ActionResult> {
  const actor = await requireActor();
  return wrap(async () => {
    await repo.attachLedgerFiles(actor, id, slot, ids(form));
    refresh("/ledgers", `/ledgers/${id}`);
  });
}

export async function removeLedgerFileAction(ledgerId: string, fileId: string): Promise<ActionResult> {
  const actor = await requireActor();
  return wrap(async () => {
    await repo.removeLedgerFile(actor, ledgerId, fileId);
    refresh(`/ledgers/${ledgerId}`);
  });
}

export async function generateBillAction(form: FormData): Promise<ActionResult<{ id: string }>> {
  const actor = await requireActor();
  return wrap(async () => {
    const row = await billing.buildBillDraft(actor, str(form, "enterpriseId"), str(form, "yearMonth"));
    refresh("/bills", `/bills/${row.id}`);
    return { id: row.id };
  });
}

export async function addAdjustmentAction(id: string, form: FormData): Promise<ActionResult> {
  const actor = await requireActor();
  return wrap(async () => {
    await billing.addAdjustment(actor, id, {
      name: str(form, "name"),
      amount: str(form, "amount"),
      remark: str(form, "remark"),
    });
    refresh(`/bills/${id}`);
  });
}

export async function removeAdjustmentAction(id: string, index: number): Promise<ActionResult> {
  const actor = await requireActor();
  return wrap(async () => {
    await billing.removeAdjustment(actor, id, index);
    refresh(`/bills/${id}`);
  });
}

export async function issueBillAction(id: string): Promise<ActionResult> {
  const actor = await requireActor();
  return wrap(async () => {
    await billing.issueBill(actor, id);
    refresh("/bills", `/bills/${id}`);
  });
}

export async function confirmBillAction(id: string): Promise<ActionResult> {
  const actor = await requireActor();
  return wrap(async () => {
    await billing.confirmBill(actor, id);
    refresh("/bills", `/bills/${id}`);
  });
}

export async function voidBillAction(id: string, form: FormData): Promise<ActionResult> {
  const actor = await requireActor();
  return wrap(async () => {
    await billing.voidBill(actor, id, str(form, "remark"));
    refresh("/bills", `/bills/${id}`);
  });
}

export async function updateInvoiceAction(id: string, form: FormData): Promise<ActionResult> {
  const actor = await requireActor();
  return wrap(async () => {
    await billing.updateInvoice(actor, id, {
      invoiceStatus: str(form, "invoiceStatus"),
      invoiceNo: str(form, "invoiceNo"),
    });
    refresh(`/bills/${id}`);
  });
}

export async function updatePaymentAction(id: string, form: FormData): Promise<ActionResult> {
  const actor = await requireActor();
  return wrap(async () => {
    await billing.updatePayment(actor, id, {
      paymentStatus: str(form, "paymentStatus"),
      paidAmount: str(form, "paidAmount"),
    });
    refresh(`/bills/${id}`);
  });
}

export async function createUserAction(form: FormData): Promise<ActionResult> {
  const actor = await requireActor();
  return wrap(async () => {
    await repo.createUser(actor, {
      loginName: str(form, "loginName"),
      displayName: str(form, "displayName"),
      password: str(form, "password"),
      role: str(form, "role"),
      enterpriseId: str(form, "enterpriseId"),
      talentId: str(form, "talentId"),
    });
    refresh("/users");
  });
}

export async function resetPasswordAction(userId: string, form: FormData): Promise<ActionResult> {
  const actor = await requireActor();
  return wrap(async () => {
    await repo.resetPassword(actor, userId, str(form, "password"));
    refresh("/users");
  });
}

export async function setUserStatusAction(userId: string, status: "active" | "disabled"): Promise<ActionResult> {
  const actor = await requireActor();
  return wrap(async () => {
    await repo.setUserStatus(actor, userId, status);
    refresh("/users");
  });
}
