import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("dashboard firm edit field parity", () => {
  it("contains exactly the same editable fields as the add-firm form in the same order", () => {
    const addForm = readFileSync(
      "src\\modules\\crm\\components\\AddFirmCRM.tsx",
      "utf8",
    );
    const dashboard = readFileSync(
      "app\\(protected)\\dashboard\\page.tsx",
      "utf8",
    );
    const addFields = [...addForm.matchAll(/<Label htmlFor="([^"]+)"/g)].map(
      (match) => match[1],
    );
    const editFieldsSection = dashboard
      .split("const editFirmFields:")[1]
      .split("const numericEditFirmFields")[0];
    const editFields = [...editFieldsSection.matchAll(/name: "([^"]+)"/g)].map(
      (match) => match[1],
    );
    expect(addFields).toHaveLength(18);
    expect(editFields).toEqual(addFields);
  });
});
