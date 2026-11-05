# Toast Styling Guide

Your application uses **@base-ui/react/toast** which provides full customization. Here's how to style toasts:

## Current Implementation

Toasts are created with `toast.add()` method:

```typescript
toast.add({
  title: "Tax firm deleted successfully",
  description: "Optional description here",
  type: "error" | "success" | "warning" | "info" | "loading",
});
```

## Toast Types & Icons

The `type` parameter automatically shows different icons:

- **`error`** → 🔴 Red octagon icon (OctagonXIcon)
- **`success`** → ✅ Green checkmark (CircleCheckIcon)
- **`warning`** → ⚠️ Yellow triangle (TriangleAlertIcon)
- **`info`** → ℹ️ Blue circle (InfoIcon)
- **`loading`** → ⏳ Spinning loader (Loader2Icon)

## Styling with Tailwind Classes

### Toast Component Structure

The toast component in `src/components/ui/toast.tsx` uses Tailwind classes. To customize styles, you can:

### 1. **Error Toast (Red)**

Currently styled with: `text-destructive` for the error icon

To make the entire error toast red:

```typescript
// In src/components/ui/toast.tsx, modify the Toast component:

function Toast({ className, ...props }: ToastPrimitive.Root.Props) {
  const toastItem = props.toast;

  return (
    <ToastPrimitive.Root
      data-slot="toast"
      className={cn(
        "group/toast pointer-events-auto absolute right-0 bottom-0 z-[calc(1000-var(--toast-index))] w-full origin-bottom rounded-2xl border bg-popover text-popover-foreground shadow-lg",
        // Add type-specific styling:
        toastItem?.type === "error" && "border-red-500 bg-red-50 dark:bg-red-950",
        toastItem?.type === "success" && "border-green-500 bg-green-50 dark:bg-green-950",
        toastItem?.type === "warning" && "border-yellow-500 bg-yellow-50 dark:bg-yellow-950",
        toastItem?.type === "info" && "border-blue-500 bg-blue-50 dark:bg-blue-950",
        className,
      )}
      {...props}
    />
  );
}
```

### 2. **Styled Title & Description**

```typescript
// Error title - red text
function ToastTitle({ className, ...props }: ToastPrimitive.Title.Props) {
  const { toasts } = useToastManager();
  const toastItem = toasts.find((t) => t.id === props["data-toast-id"]);

  return (
    <ToastPrimitive.Title
      data-slot="toast-title"
      className={cn(
        "text-sm font-medium",
        toastItem?.type === "error" && "text-red-900 dark:text-red-100",
        toastItem?.type === "success" && "text-green-900 dark:text-green-100",
        toastItem?.type === "warning" && "text-yellow-900 dark:text-yellow-100",
        toastItem?.type === "info" && "text-blue-900 dark:text-blue-100",
        className,
      )}
      {...props}
    />
  );
}

// Description with type-specific colors
function ToastDescription({
  className,
  ...props
}: ToastPrimitive.Description.Props) {
  const { toasts } = useToastManager();
  const toastItem = toasts.find((t) => t.id === props["data-toast-id"]);

  return (
    <ToastPrimitive.Description
      data-slot="toast-description"
      className={cn(
        "text-sm",
        toastItem?.type === "error" && "text-red-700 dark:text-red-200",
        toastItem?.type === "success" && "text-green-700 dark:text-green-200",
        toastItem?.type === "warning" && "text-yellow-700 dark:text-yellow-200",
        toastItem?.type === "info" && "text-blue-700 dark:text-blue-200",
        className,
      )}
      {...props}
    />
  );
}
```

## Usage Examples

### Error Toast (Red with Message & Description)

```typescript
toast.add({
  title: "Failed to delete tax firm",
  description:
    "You don't have permission to perform this action. Only administrators can perform this operation.",
  type: "error",
});
```

**Result:** Red-bordered box, red title text, red description text with error icon

### Success Toast (Green)

```typescript
toast.add({
  title: "Tax firm deleted successfully",
  description: "The firm has been removed from your list.",
  type: "success",
});
```

**Result:** Green-bordered box, green title text, green description text with checkmark icon

### Warning Toast (Yellow/Amber)

```typescript
toast.add({
  title: "This action cannot be undone",
  description: "You are about to delete this tax firm permanently.",
  type: "warning",
});
```

**Result:** Amber-bordered box, amber title text with warning icon

### Info Toast (Blue)

```typescript
toast.add({
  title: "Processing your request",
  description: "Please wait while we save your changes.",
  type: "info",
});
```

**Result:** Blue-bordered box, blue title text with info icon

### Loading Toast (Animated)

```typescript
const toastId = toast.add({
  title: "Uploading document",
  type: "loading",
});

// Later, replace with success/error
toast.update(toastId, {
  title: "Upload complete",
  type: "success",
});
```

## Color Scheme Mapping

| Type    | Border     | Background | Text       | Dark BG    | Dark Text  |
| ------- | ---------- | ---------- | ---------- | ---------- | ---------- |
| error   | red-500    | red-50     | red-900    | red-950    | red-100    |
| success | green-500  | green-50   | green-900  | green-950  | green-100  |
| warning | yellow-500 | yellow-50  | yellow-900 | yellow-950 | yellow-100 |
| info    | blue-500   | blue-50    | blue-900   | blue-950   | blue-100   |

## Current Usage in Your Hooks

All delete and add hooks use:

```typescript
toast.add({
  title: "Action message",
  description: "Detailed error or success message",
  type: "error" | "success" | "warning" | "info",
});
```

The type automatically determines:

- Border color
- Background color
- Icon displayed
- Text color (if styled as above)

## To Implement

1. Update `src/components/ui/toast.tsx` to add conditional styling based on `toastItem?.type`
2. Use the color scheme table above for Tailwind classes
3. All existing toast calls will automatically get the new styling!

No changes needed in the hooks—just update the component!
