export type Role = "ops" | "enterprise" | "worker";

export type Actor = {
  id: string;
  loginName: string;
  displayName: string;
  role: Role;
  enterpriseId: string | null;
  talentId: string | null;
};

export type ChangedField = { field: string; old: string; new: string };

export type Adjustment = { name: string; amount: number; remark: string };
