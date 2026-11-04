export enum RoleTitleType {
  SALES_REPRESENTATIVE = 1,
  ADMIN = 2,
  SUPER_ADMIN = 3,
}

export const ROLE_TITLE_LABELS: Record<RoleTitleType, string> = {
  [RoleTitleType.SALES_REPRESENTATIVE]: "Sales Representative",
  [RoleTitleType.ADMIN]: "Admin",
  [RoleTitleType.SUPER_ADMIN]: "Super Admin",
};

export const ROLE_TITLE_OPTIONS = (
  Object.entries(ROLE_TITLE_LABELS) as [string, string][]
).map(([value, label]) => ({ value: Number(value) as RoleTitleType, label }));

export const getRoleTitleLabel = (roleId: number | null | undefined) =>
  roleId == null
    ? "Not provided"
    : (ROLE_TITLE_LABELS[roleId as RoleTitleType] ?? `Role ${roleId}`);
