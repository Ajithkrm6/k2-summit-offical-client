export enum RoleTitleType {
  OWNER = 1,
  PARTNER = 2,
  CPA = 3,
}

export const ROLE_TITLE_LABELS: Record<RoleTitleType, string> = {
  [RoleTitleType.OWNER]: "Owner",
  [RoleTitleType.PARTNER]: "Partner",
  [RoleTitleType.CPA]: "CPA",
};

export const ROLE_TITLE_OPTIONS = (
  Object.entries(ROLE_TITLE_LABELS) as [string, string][]
).map(([value, label]) => ({ value: Number(value) as RoleTitleType, label }));

export const getRoleTitleLabel = (roleId: number | null | undefined) =>
  roleId == null
    ? "Not provided"
    : (ROLE_TITLE_LABELS[roleId as RoleTitleType] ?? `Role ${roleId}`);
