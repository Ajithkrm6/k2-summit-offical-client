import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";
import { cn } from "cn";

function Input({
  className,
  type,
  onChange,
  onFocus,
  onBlur,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      inputMode={type === "tel" ? "tel" : undefined}
      onFocus={(event) => {
        if (type === "tel" && !event.currentTarget.value) {
          event.currentTarget.value = "+1";
        }
        onFocus?.(event);
      }}
      onBlur={(event) => {
        if (type === "tel" && event.currentTarget.value === "+1") {
          event.currentTarget.value = "";
        }
        onBlur?.(event);
      }}
      onChange={(event) => {
        if (type === "tel") {
          const value = event.currentTarget.value;
          const digits = (value.startsWith("+1") ? value.slice(2) : value)
            .replace(/[^0-9]/g, "")
            .slice(0, 10);
          event.currentTarget.value = digits ? `+1${digits}` : "";
        }
        onChange?.(event);
      }}
      data-slot="input"
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
