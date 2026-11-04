import { describe, expect, it, vi } from "vitest";
import { Input } from "./input";

describe("Input phone entry", () => {
  it.each([
    ["John123@!", "John"],
    ["Mary Jane", "Mary Jane"],
    ["ABCxyz", "ABCxyz"],
    ["123!@#$", ""],
    ["Jane\tDoe\n", "JaneDoe"],
  ])("filters name input %j before notifying the form", (value, expected) => {
    const onChange = vi.fn();
    const input = Input({ lettersOnly: true, onChange });
    const target = { value };
    const event = { currentTarget: target, target };

    input.props.onChange(event);

    expect(target.value).toBe(expected);
    expect(onChange).toHaveBeenCalledExactlyOnceWith(event);
    expect(input.props.lettersOnly).toBeUndefined();
  });

  it.each([
    ["abc", ""],
    ["+1555abc1234567", "+15551234567"],
    ["+1 (555) 123-4567", "+15551234567"],
    ["+1+5551234567", "+15551234567"],
    ["+15551234567", "+15551234567"],
    ["5551234567", "+15551234567"],
    ["1234567890", "+11234567890"],
    ["+1555123456789", "+15551234567"],
    ["555123456789", "+15551234567"],
    ["+1555", "+1555"],
    ["+1", ""],
    ["", ""],
  ])("filters %j before notifying the form", (value, expected) => {
    const onChange = vi.fn();
    const input = Input({ type: "tel", onChange });
    const target = { value };
    const event = { currentTarget: target, target };

    input.props.onChange(event);

    expect(target.value).toBe(expected);
    expect(onChange).toHaveBeenCalledExactlyOnceWith(event);
  });

  it("adds the prefix on focus and clears an untouched prefix on blur", () => {
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    const input = Input({ type: "tel", onFocus, onBlur });
    const target = { value: "" };
    const event = { currentTarget: target, target };

    input.props.onFocus(event);
    expect(target.value).toBe("+1");
    expect(onFocus).toHaveBeenCalledWith(event);
    input.props.onBlur(event);
    expect(target.value).toBe("");
    expect(onBlur).toHaveBeenCalledWith(event);
  });

  it("preserves letters and punctuation in non-phone inputs", () => {
    const onChange = vi.fn();
    const input = Input({ type: "text", onChange });
    const target = { value: "Example Firm (US)" };

    input.props.onChange({ currentTarget: target, target });

    expect(target.value).toBe("Example Firm (US)");
    expect(onChange).toHaveBeenCalledOnce();
  });
});
