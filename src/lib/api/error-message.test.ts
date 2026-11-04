import { AxiosError, AxiosHeaders } from "axios";
import { describe, expect, it } from "vitest";
import { getApiErrorMessage, normalizeApiError } from "./error-message";

describe("getApiErrorMessage", () => {
  it.each([
    [
      { title: "Firm already exists", message: "Legacy message" },
      "Firm already exists",
    ],
    [{ title: null, message: "Legacy message" }, "Legacy message"],
    [{ title: " ", message: "Legacy message" }, "Legacy message"],
    [
      { title: 400, message: {}, error: { message: "Nested message" } },
      "Nested message",
    ],
    [
      {
        title: "Failure",
        errors: {
          "AppUser.InvalidCredentials": ["Password does not matched"],
        },
      },
      "Password does not matched",
    ],
    [
      {
        title: "Failure",
        errors: {
          "AppUser.InvalidCredentials": ["   ", "Password does not matched"],
        },
      },
      "Password does not matched",
    ],
    [null, "Network unavailable"],
    ["Bad gateway", "Network unavailable"],
    [{ status: 500 }, "Network unavailable"],
  ])("chooses a usable message from %j", (data, expected) => {
    expect(
      getApiErrorMessage({
        response: { data },
        message: "Network unavailable",
      }),
    ).toBe(expected);
  });

  it.each([undefined, null, "", {}, { message: " " }])(
    "uses the supplied fallback for %j",
    (error) => {
      expect(getApiErrorMessage(error, "Failed to save")).toBe(
        "Failed to save",
      );
    },
  );

  it("preserves plain Error messages", () => {
    expect(getApiErrorMessage(new Error("Network unavailable"))).toBe(
      "Network unavailable",
    );
  });

  it("normalizes Axios errors without replacing them or altering metadata", () => {
    const error = new AxiosError(
      "Request failed with status code 409",
      "ERR_BAD_REQUEST",
    );
    const data = { title: "Firm already exists", status: 409 };
    error.response = {
      data,
      status: 409,
      statusText: "Conflict",
      headers: {},
      config: { headers: new AxiosHeaders() },
    };
    expect(normalizeApiError(error)).toBe(error);
    expect(error.message).toBe(data.title);
    expect(error.code).toBe("ERR_BAD_REQUEST");
    expect(error.response.status).toBe(409);
    expect(error.response.data).toBe(data);
  });

  it("does not alter non-Axios failures", () => {
    const error = new Error("Unexpected failure");
    expect(normalizeApiError(error)).toBe(error);
    expect(error.message).toBe("Unexpected failure");
  });
});
