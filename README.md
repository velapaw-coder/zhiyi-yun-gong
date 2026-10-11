# 智翼云工 · AI 助残增长服务平台（MVP）

合规交付最小闭环：能签单、能派活、能交活、能对账，四流能留痕。任务完成后可以沿时间线追查交付正文、附件、质检意见和操作记录。

本期只做一条可量化的数字岗位：**AI 内容编排（AI_CONTENT_OPS）**。产品需求原文在 [docs/PRD.md](docs/PRD.md)。

## 本地运行

需要 Node.js 20+。

```bash
npm install
npm run db:setup
npm run dev
```

浏览器打开 [http://127.0.0.1:4721](http://127.0.0.1:4721) 先看产品介绍。点击「进入控制台 / 登录」后进入工作台；已登录用户的工作台地址是 [http://127.0.0.1:4721/workbench](http://127.0.0.1:4721/workbench)。

`db:setup` 会在没有 `.env` 时从 `.env.example` 复制一份，然后把 SQLite 库建在 `prisma/dev.db` 并写入演示数据。附件落在 `data/uploads/`（已忽略，不进 git）。`npm run dev` 不走 Cloudflare，仍然读写这个文件库和磁盘目录。

领域回归（独立库 `prisma/verify.db`，不覆盖演示数据）：

```bash
npm run verify
```

## 部署到 Cloudflare Workers

运行时是 [OpenNext for Cloudflare](https://opennext.js.org/cloudflare)（`@opennextjs/cloudflare`），部署目标是 Workers，不是 Pages。配置在 `wrangler.toml`、`open-next.config.ts`。

| 环境 | 数据库 | 附件 |
| --- | --- | --- |
| 本地 `npm run dev` | `prisma/dev.db`（`DATABASE_URL`） | `data/uploads/` |
| Workers | D1 绑定 `DB`，Prisma 使用 `@prisma/adapter-d1` | R2 绑定 `UPLOADS` |

Workers 上不会往本机磁盘写附件。没有 R2 绑定时上传会直接失败。请求仍经过 Worker，单个附件上限保持 50MB，并受 Cloudflare 请求体大小限制。

D1 目前没有真正的交互式事务。Prisma 的 `$transaction` 在 D1 适配器里会被拆成一条条查询执行，原子性没有保证。本地 SQLite 的事务行为不变。出账、派发这类多表写入在 D1 上有中途失败后留下半成品的可能，这是 MVP 的已知限制。

仓库里还没有在任何 Cloudflare 账号上执行过部署。下面的命令需要你自己的账号登录后运行。

### 1. 登录并创建资源

```bash
npx wrangler login
npx wrangler whoami
npx wrangler d1 create zhiyi-yun-gong
npx wrangler r2 bucket create zhiyi-yun-gong-uploads
```

`whoami` 能看到 Account ID。如果登录了多个账号，把 `account_id = "..."` 写进 `wrangler.toml`。

`d1 create` 会打印 `database_id`。用它替换 `wrangler.toml` 里的 `00000000-0000-0000-0000-000000000000`。全零 ID 不能远程部署。

会话密钥不要写进 toml：

```bash
npx wrangler secret put SESSION_SECRET
```

本地预览把 `.dev.vars.example` 复制为 `.dev.vars`（已忽略）。

### 2. 建表并灌入演示数据

表结构由 Prisma schema 导出，文件是 `prisma/d1/migrations/0001_init.sql`。schema 有变更时重新生成：

```bash
npm run cf:schema
```

演示数据不进迁移目录，避免重复执行时再插入一遍。在已经 `npm run db:setup` 的机器上导出：

```bash
npm run cf:seed-sql
```

这会覆盖 `prisma/d1/seed.sql`（脚本是 `scripts/export-d1-seed.mjs`）。然后：

```bash
# 远程
npx wrangler d1 execute zhiyi-yun-gong --remote --file=prisma/d1/migrations/0001_init.sql
npx wrangler d1 execute zhiyi-yun-gong --remote --file=prisma/d1/seed.sql

# 只想在本机 wrangler 状态里试
npx wrangler d1 execute zhiyi-yun-gong --local --file=prisma/d1/migrations/0001_init.sql
npx wrangler d1 execute zhiyi-yun-gong --local --file=prisma/d1/seed.sql
```

也可以用迁移命令只建表（`migrations_dir` 里目前只有 `0001_init.sql`）：

```bash
npx wrangler d1 migrations apply zhiyi-yun-gong --remote
```

空库上生产环境可以只跑建表，不跑 `seed.sql`。

### 3. 把演示附件放进 R2

`seed.sql` 只有 `FileAsset.storageKey`，没有文件内容。种子附件在本地 `data/uploads/`。

```bash
npm run cf:push-uploads -- --remote
npm run cf:push-uploads -- --local
```

对象键与数据库里的 `storageKey` 一致。用户在页面上新上传的文件会直接写入 R2，不必再跑这个脚本。

### 4. 预览和部署

```bash
npm run cf:preview
npm run cf:deploy
```

`cf:deploy` 会先做 OpenNext 构建，再 `wrangler deploy`。部署成功后的 `*.workers.dev` 地址以命令输出为准。绑定类型有变化时可以再跑 `npm run cf:typegen`。

Next.js 16 的 `src/proxy.ts` 在 OpenNext 里按 Node middleware 打包。构建可以通过，但 OpenNext 标明这块支持仍是实验性的。登录跳转若在 Workers 上异常，先看 Worker 日志里的 proxy。

## 演示账号

密码都是 `Zhiyi#2026`。登录页可以点账号卡片自动填入。

| 登录名 | 角色 | 能看到什么 |
| --- | --- | --- |
| `yunying` | 运营 · 陈运营 | 六个模块的增删改查、质检验收、出账、审计 |
| `qiye.zhizao` | 企业客户 · 王敏 | 只读「样例制造 A」的方案、岗位、任务、台账和已出账账单 |
| `qiye.kuajing` | 企业客户 · 李航 | 只读「瀚海跨境」，用来对照隔离 |
| `lin.xiao` | 执行端 · 林晓 | 只看自己的任务，可领取、提交 |
| `zhao.min` | 执行端 · 赵敏 | 只看自己的任务 |
| `chen.yuan` | 执行端 · 陈远 | 瀚海跨境岗位上的执行人 |

周宁在人才库里，培训未结业、没有登录账号，用来演示强制派发。

建议先看任务 `RW-1001`：领取 → 提交 → 质检退回 → 再提交 → 质检并验收，两版交付都挂了附件。

## 六个模块

企业与方案、岗位配置、人才与培训、任务与交付（含追溯时间线）、合规台账四流、对账结算。

角色边界在服务端执行：企业只能读本企业；执行端只能读自己的任务。草稿和作废账单对企业返回「不存在」。强制派发原因写在仅运营可见的内部备注里。

## 尚未拍板的口径（按 PRD 待确认项做了可运行默认）

这些默认写在代码注释和界面说明里，不是额外发明的业务规则。

1. 岗位类型只开放内容编排。
2. 「质检并验收」是一次操作，日志拆成质检通过和验收两条。
3. 按件：账单月内验收完成的任务数 × 单价。按人月：生成账单时的在岗人数 × 单价，不回溯月中入离职。按周：账单月重叠的 ISO 周数 × 当时在岗人数 × 单价。平台服务费取覆盖该月、状态为已签约或执行中的方案，多条时优先执行中。
4. 企业只看执行人姓名，不看证件号。
5. 一个人同时只有一个在岗岗位；历史任务保留。
6. 合同与四流材料是扫描件或 PDF 上传，没有电子签。
7. 待办在工作台，不发短信。
8. 方案只记录备注和可选附件，不做自动成本测算。
9. 留存常量按 24 个月记，本期不跑清理任务。
10. 运营代提交会在日志里标明【代提交】。

金额在库里以分为单位。
