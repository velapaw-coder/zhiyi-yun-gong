"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormError, FormNote, selectClass } from "@/components/field";
import { FilePicker } from "@/components/file-picker";
import { useSubmit } from "@/components/use-submit";
import {
  acceptTaskAction,
  cancelTaskAction,
  claimTaskAction,
  copyTaskAction,
  createTaskAction,
  editTaskAction,
  internalNoteAction,
  reassignTaskAction,
  rejectTaskAction,
  submitTaskAction,
} from "@/server/actions";
import { toDatetimeLocalValue } from "@/lib/format";

export function TaskCreateForm({
  enterprises,
  talents,
}: {
  enterprises: { id: string; name: string; code: string; positions: { id: string; name: string; code: string }[] }[];
  talents: { id: string; name: string; code: string; status: string; currentPositionId: string | null }[];
}) {
  const router = useRouter();
  const { error, pending, submit } = useSubmit();
  const [enterpriseId, setEnterpriseId] = useState(enterprises[0]?.id ?? "");
  const [positionId, setPositionId] = useState(enterprises[0]?.positions[0]?.id ?? "");
  const positions = enterprises.find((item) => item.id === enterpriseId)?.positions ?? [];
  const suggested = talents.filter((talent) => talent.currentPositionId === positionId);
  const [start] = useState(() => toDatetimeLocalValue(new Date()));
  const [end] = useState(() => toDatetimeLocalValue(new Date(Date.now() + 5 * 24 * 3600 * 1000)));

  return (
    <form
      className="grid gap-4 rounded-xl bg-card p-4 ring-1 ring-zy-line shadow-zy"
      onSubmit={(event) => {
        event.preventDefault();
        void submit(
          () => createTaskAction(new FormData(event.currentTarget)),
          (data) => {
            if (data?.id) router.push(`/tasks/${data.id}`);
          },
        );
      }}
    >
      <FormError message={error} />
      <p className="text-xs leading-5 text-muted-foreground">
        默认只能派给「在岗且培训已结业、并绑定该岗位」的执行人。例外情况勾选强制派发，原因写入仅运营可见的内部备注。
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="企业" required>
          <select
            className={selectClass}
            value={enterpriseId}
            onChange={(event) => {
              const next = event.target.value;
              setEnterpriseId(next);
              const first = enterprises.find((item) => item.id === next)?.positions[0]?.id ?? "";
              setPositionId(first);
            }}
          >
            {enterprises.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="岗位" required hint="只列出启用岗位。">
          <select
            name="positionId"
            className={selectClass}
            value={positionId}
            onChange={(event) => setPositionId(event.target.value)}
          >
            {positions.map((position) => (
              <option key={position.id} value={position.id}>
                {position.name}（{position.code}）
              </option>
            ))}
          </select>
        </Field>
        <Field label="执行人" required hint={suggested.length ? `该岗位在岗 ${suggested.length} 人，优先选择他们。` : "该岗位当前没有在岗人员，需要强制派发。"}>
          <select name="talentId" className={selectClass} required defaultValue={suggested[0]?.id}>
            {talents.map((talent) => (
              <option key={talent.id} value={talent.id}>
                {talent.name}（{talent.code}）{talent.currentPositionId === positionId ? " · 本岗在岗" : ""}
              </option>
            ))}
          </select>
        </Field>
        <Field label="任务标题" required>
          <Input name="title" required placeholder="秋季工装系列 8 条详情页文案" />
        </Field>
        <Field label="计划开始" required>
          <Input name="planStartAt" type="datetime-local" required defaultValue={start} />
        </Field>
        <Field label="计划截止" required>
          <Input name="planEndAt" type="datetime-local" required defaultValue={end} />
        </Field>
      </div>
      <Field label="任务要求" required>
        <Textarea name="description" required rows={5} placeholder="写清条数、字段、品牌调性和交付位置。" />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="force" />
        强制派发（培训未结业或未绑定本岗时）
      </label>
      <Button type="submit" disabled={pending || !positionId}>
        {pending ? "派发中…" : "派发任务"}
      </Button>
    </form>
  );
}

export function TaskActions({
  task,
  talents,
  qaItems,
  role,
}: {
  task: {
    id: string;
    status: string;
    title: string;
    description: string;
    planStartAt: string;
    planEndAt: string;
  };
  talents: { id: string; name: string; code: string }[];
  qaItems: string[];
  role: "ops" | "worker";
}) {
  const router = useRouter();
  const { error, pending, saved, submit } = useSubmit();
  const [panel, setPanel] = useState<string | null>(null);
  const ops = role === "ops";
  const buttons = useMemo(() => {
    const list: { key: string; label: string; variant?: "default" | "outline" | "destructive" | "secondary" }[] = [];
    if (task.status === "assigned") list.push({ key: "claim", label: ops ? "代领取" : "领取" });
    if (task.status === "in_progress" || task.status === "rework") {
      list.push({ key: "submit", label: ops ? "代提交交付" : "提交交付" });
    }
    if (ops && task.status === "submitted") {
      list.push({ key: "accept", label: "质检并验收" });
      list.push({ key: "reject", label: "质检不通过", variant: "destructive" });
    }
    if (ops && task.status !== "accepted" && task.status !== "cancelled") {
      list.push({ key: "edit", label: "编辑", variant: "outline" });
      list.push({ key: "reassign", label: "改派", variant: "outline" });
      list.push({ key: "cancel", label: "取消", variant: "outline" });
    }
    if (ops && (task.status === "accepted" || task.status === "cancelled")) {
      list.push({ key: "copy", label: "复制为新任务", variant: "secondary" });
    }
    if (ops) list.push({ key: "note", label: "内部备注", variant: "outline" });
    return list;
  }, [ops, task.status]);

  // 执行端在已验收/已取消的任务上没有可做的操作，不渲染空白卡片。
  if (buttons.length === 0 && !error && !saved) return null;

  return (
    <div className="mb-6 rounded-xl bg-card p-4 ring-1 ring-zy-line shadow-zy">
      <div className="flex flex-wrap gap-2 max-sm:[&>button]:h-11 max-sm:[&>button]:flex-1">
        {buttons.map((button) => (
          <Button
            key={button.key}
            type="button"
            variant={button.variant ?? "default"}
            disabled={pending}
            onClick={() => {
              if (button.key === "claim") {
                void submit(() => claimTaskAction(task.id));
                return;
              }
              if (button.key === "copy") {
                void submit(() => copyTaskAction(task.id), (data) => {
                  if (data?.id) router.push(`/tasks/${data.id}`);
                });
                return;
              }
              setPanel((current) => (current === button.key ? null : button.key));
            }}
          >
            {button.label}
          </Button>
        ))}
      </div>
      <div className="mt-3">
        <FormError message={error} />
        <FormNote message={saved && !panel ? "已记录" : null} />
      </div>
      {panel === "submit" ? (
        <form
          className="mt-4 grid gap-3 border-t border-border pt-4"
          onSubmit={(event) => {
            event.preventDefault();
            void submit(() => submitTaskAction(task.id, new FormData(event.currentTarget)), () => setPanel(null));
          }}
        >
          <h2 className="font-medium">{ops ? "代提交交付" : "提交交付"}</h2>
          {ops ? <p className="text-xs text-muted-foreground">日志会标记【代提交】，操作者角色为运营。</p> : null}
          {task.status === "rework" ? <p className="text-sm">请根据质检意见提交新版本，旧版本会保留。</p> : null}
          <Field label="做了什么" required hint="20 到 5000 字。">
            <Textarea name="summary" required minLength={20} rows={6} />
          </Field>
          <Field label="链接" hint="每行一个 http(s) 地址。链接和附件至少填一类。">
            <Textarea name="links" rows={3} placeholder="https://" />
          </Field>
          <FilePicker />
          <Button type="submit" disabled={pending} className="max-sm:h-11">
            提交这一版
          </Button>
        </form>
      ) : null}
      {panel === "reject" || panel === "accept" ? (
        <form
          className="mt-4 grid gap-3 border-t border-border pt-4"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            void submit(
              () => (panel === "reject" ? rejectTaskAction(task.id, form) : acceptTaskAction(task.id, form)),
              () => setPanel(null),
            );
          }}
        >
          <h2 className="font-medium">{panel === "reject" ? "质检不通过，退回返工" : "质检并验收"}</h2>
          <p className="text-xs leading-5 text-muted-foreground">
            本期质检与终验合并为一步。通过时日志会拆成「质检通过」和「验收」两条。不通过时意见必填。
          </p>
          {qaItems.length > 0 ? (
            <fieldset className="grid gap-2">
              <legend className="text-sm font-medium">质检清单</legend>
              {qaItems.map((item) => (
                <label key={item} className="flex items-start gap-2 text-sm">
                  <input type="checkbox" name="checked" value={item} className="mt-1" />
                  <span>{item}</span>
                </label>
              ))}
            </fieldset>
          ) : null}
          <Field label="质检意见" required={panel === "reject"}>
            <Textarea name="comment" rows={4} required={panel === "reject"} />
          </Field>
          <Button type="submit" variant={panel === "reject" ? "destructive" : "default"} disabled={pending}>
            {panel === "reject" ? "退回返工" : "通过并验收"}
          </Button>
        </form>
      ) : null}
      {panel === "cancel" ? (
        <form
          className="mt-4 grid gap-3 border-t border-border pt-4"
          onSubmit={(event) => {
            event.preventDefault();
            void submit(() => cancelTaskAction(task.id, new FormData(event.currentTarget)), () => setPanel(null));
          }}
        >
          <Field label="取消原因" required>
            <Textarea name="comment" required rows={3} />
          </Field>
          <Button type="submit" variant="destructive" disabled={pending}>
            确认取消
          </Button>
        </form>
      ) : null}
      {panel === "edit" ? (
        <form
          className="mt-4 grid gap-3 border-t border-border pt-4 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            void submit(() => editTaskAction(task.id, new FormData(event.currentTarget)), () => setPanel(null));
          }}
        >
          <Field label="标题" required className="md:col-span-2">
            <Input name="title" required defaultValue={task.title} />
          </Field>
          <Field label="计划开始" required>
            <Input name="planStartAt" type="datetime-local" required defaultValue={toDatetimeLocalValue(new Date(task.planStartAt))} />
          </Field>
          <Field label="计划截止" required>
            <Input name="planEndAt" type="datetime-local" required defaultValue={toDatetimeLocalValue(new Date(task.planEndAt))} />
          </Field>
          <Field label="要求" required className="md:col-span-2">
            <Textarea name="description" required rows={4} defaultValue={task.description} />
          </Field>
          <div className="md:col-span-2">
            <Button type="submit" disabled={pending}>
              保存修改
            </Button>
          </div>
        </form>
      ) : null}
      {panel === "reassign" ? (
        <form
          className="mt-4 grid gap-3 border-t border-border pt-4"
          onSubmit={(event) => {
            event.preventDefault();
            void submit(() => reassignTaskAction(task.id, new FormData(event.currentTarget)), () => setPanel(null));
          }}
        >
          <Field label="新执行人" required>
            <select name="talentId" className={selectClass} required>
              {talents.map((talent) => (
                <option key={talent.id} value={talent.id}>
                  {talent.name}（{talent.code}）
                </option>
              ))}
            </select>
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="force" />
            强制改派
          </label>
          <Button type="submit" disabled={pending}>
            确认改派
          </Button>
        </form>
      ) : null}
      {panel === "note" ? (
        <form
          className="mt-4 grid gap-3 border-t border-border pt-4"
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            void submit(() => internalNoteAction(task.id, new FormData(form)), () => {
              form.reset();
              setPanel(null);
            });
          }}
        >
          <Field label="内部备注" required hint="企业客户和执行端看不到这条。">
            <Textarea name="comment" required rows={3} />
          </Field>
          <Button type="submit" variant="secondary" disabled={pending}>
            写入内部备注
          </Button>
        </form>
      ) : null}
    </div>
  );
}
