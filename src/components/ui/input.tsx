import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";
import { cn } from "cn";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "./button";

function Input({
  className,
  type,
  onChange,
  onFocus,
  onBlur,
  lettersOnly = false,
  numbersOnly = false,
  ssnFormat = false,
  showPasswordToggle = false,
  alphanumericOnly = false,
  ...props
}: React.ComponentProps<"input"> & {
  lettersOnly?: boolean;
  numbersOnly?: boolean;
  ssnFormat?: boolean;
  showPasswordToggle?: boolean;
  alphanumericOnly?: boolean;
}) {
  const [showPassword, setShowPassword] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Determine input type based on password visibility
  const isPasswordField = type === "password" && showPasswordToggle;
  const inputType = isPasswordField
    ? showPassword
      ? "text"
      : "password"
    : type;

  return (
    <div className="relative">
      <InputPrimitive
        ref={inputRef}
        type={inputType}
        inputMode={
          type === "tel"
            ? "tel"
            : numbersOnly || ssnFormat
              ? "numeric"
              : undefined
        }
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
          if (lettersOnly) {
            event.currentTarget.value = event.currentTarget.value.replace(
              /[^A-Za-z ]/g,
              "",
            );
          }
          if (alphanumericOnly) {
            event.currentTarget.value = event.currentTarget.value.replace(
              /[^A-Za-z0-9 ]/g,
              "",
            );
          }
          if (numbersOnly && !ssnFormat) {
            event.currentTarget.value = event.currentTarget.value.replace(
              /[^0-9]/g,
              "",
            );
          }
          if (ssnFormat) {
            // Allow only numbers
            let value = event.currentTarget.value.replace(/[^0-9]/g, "");
            // Format as XXX-XX-XXXX
            if (value.length > 3) {
              value = value.slice(0, 3) + "-" + value.slice(3);
            }
            if (value.length > 6) {
              value = value.slice(0, 6) + "-" + value.slice(6);
            }
            // Limit to XXX-XX-XXXX (11 chars total with dashes)
            value = value.slice(0, 11);
            event.currentTarget.value = value;
          }
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
          showPasswordToggle && type === "password" ? "pr-10" : "",
          className,
        )}
        {...props}
      />
      {showPasswordToggle && type === "password" && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-8 p-1 hover:bg-transparent focus:bg-transparent"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowPassword((prev) => !prev);
          }}
          aria-label={showPassword ? "Hide password" : "Show password"}
          tabIndex={-1}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Eye className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      )}
    </div>
  );
}

export { Input };
