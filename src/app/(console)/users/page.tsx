import { PasswordResetForm, UserCreateForm, UserStatusButton } from "@/components/record-forms";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { formatDateTime } from "@/lib/format";
import { ROLE_LABEL, USER_STATUS } from "@/lib/labels";
import { listUsers, userFormOptions } from "@/server/repo";
import { expose } from "@/server/page";
import { requireActor } from "@/server/session";

export const metadata = { title: "账号" };

export default async function UsersPage() {
  const actor = await requireActor();
  const [users, options] = await Promise.all([
    expose(() => listUsers(actor)),
    expose(() => userFormOptions(actor)),
  ]);
  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <UserCreateForm enterprises={options.enterprises} talents={options.talents} />
      <div>
        <PageHeader eyebrow="权限" title="账号" description="运营可以重置密码和停用账号。企业侧本期不分财务和 HR。" />
        <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-foreground/10">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-muted/70 text-left text-muted-foreground">
              <tr>
                {["登录名", "角色", "绑定", "最近登录", "状态", "操作"].map((head) => (
                  <th key={head} className="px-3 py-2 font-medium">
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-border align-top">
                  <td className="px-3 py-3">
                    {user.displayName}
                    <span className="block font-mono text-xs text-muted-foreground">{user.loginName}</span>
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge map={ROLE_LABEL} value={user.role} />
                  </td>
                  <td className="px-3 py-3 text-xs">
                    {user.enterprise ? user.enterprise.name : user.talent ? user.talent.name : "—"}
                  </td>
                  <td className="px-3 py-3 text-xs">{formatDateTime(user.lastLoginAt)}</td>
                  <td className="px-3 py-3">
                    <StatusBadge map={USER_STATUS} value={user.status} />
                  </td>
                  <td className="px-3 py-3">
                    <PasswordResetForm userId={user.id} />
                    <div className="mt-2">
                      <UserStatusButton userId={user.id} status={user.status} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
