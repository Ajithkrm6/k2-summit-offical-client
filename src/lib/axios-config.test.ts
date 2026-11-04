import { AxiosError, isAxiosError } from "axios";
import { describe, expect, it, vi } from "vitest";
import axios from "./axios-config";
import { apiClient } from "./api-client";

describe.each([
  ["global Axios used by generated endpoints", axios],
  ["API client instance", apiClient],
] as const)("%s error responses", (_name, client) => {
  it.each(["get", "post"] as const)(
    "exposes the backend title for %s while retaining the rejected Axios error",
    async (method) => {
      const log = vi.spyOn(console, "log").mockImplementation(() => {});
      let failure: AxiosError | undefined;
      try {
        await expect(
          client.request({
            url: "/api/test",
            method,
            adapter: async (config) => {
              failure = new AxiosError(
                "Request failed with status code 400",
                "ERR_BAD_REQUEST",
                config,
                undefined,
                {
                  config,
                  data: {
                    title: "A primary contact already exists",
                    message: "Other message",
                  },
                  status: 400,
                  statusText: "Bad Request",
                  headers: {},
                },
              );
              throw failure;
            },
          }),
        ).rejects.toMatchObject({
          message: "A primary contact already exists",
          code: "ERR_BAD_REQUEST",
          response: { status: 400 },
        });
        expect(isAxiosError(failure)).toBe(true);
        expect(failure?.response?.data).toEqual({
          title: "A primary contact already exists",
          message: "Other message",
        });
      } finally {
        log.mockRestore();
      }
    },
  );

  it("retains network error messages with no response", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const failure = new AxiosError("Network Error", "ERR_NETWORK");
    try {
      await expect(
        client.get("/api/test", {
          adapter: async () => {
            throw failure;
          },
        }),
      ).rejects.toBe(failure);
      expect(failure.message).toBe("Network Error");
    } finally {
      log.mockRestore();
    }
  });

  it("preserves the existing login redirect on a 401 response", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const location = { origin: "http://localhost:3000", href: "" };
    vi.stubGlobal("window", { location });
    try {
      await expect(
        client.get("/api/test", {
          adapter: async (config) => {
            throw new AxiosError(
              "Request failed with status code 401",
              "ERR_BAD_REQUEST",
              config,
              undefined,
              {
                config,
                data: { title: "Authentication required" },
                status: 401,
                statusText: "Unauthorized",
                headers: {},
              },
            );
          },
        }),
      ).rejects.toMatchObject({ message: "Authentication required" });
      expect(location.href).toBe(
        client === axios
          ? "http://localhost:3000/login"
          : "http://localhost:3000/auth/login",
      );
    } finally {
      vi.unstubAllGlobals();
      log.mockRestore();
    }
  });

  it("leaves successful HTTP business error responses untouched", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const data = { isError: true, firstError: { description: "Not allowed" } };
    try {
      const response = await client.get("/api/test", {
        adapter: async (config) => ({
          config,
          data,
          status: 200,
          statusText: "OK",
          headers: {},
        }),
      });
      expect(response.data).toBe(data);
      expect(response.status).toBe(200);
    } finally {
      log.mockRestore();
    }
  });
});
