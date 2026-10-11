import { TaskCreateForm } from "@/components/task-forms";
import { PageHeader } from "@/components/page-header";
import { taskFormOptions } from "@/server/tasks";
import { expose } from "@/server/page";
import { requireActor } from "@/server/session";

export const metadata = { title: "派发任务" };

export default async function NewTaskPage() {
  const actor = await requireActor();
  const options = await expose(() => taskFormOptions(actor));
  return (
    <div>
      <PageHeader eyebrow="任务" title="派发任务" description="选择启用岗位和执行人，写清要求和截止时间。创建后状态为已派发。" />
      <TaskCreateForm enterprises={options.enterprises} talents={options.talents} />
    </div>
  );
}
