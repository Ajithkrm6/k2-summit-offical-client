"use client";

import {
  useCallback,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type InputHTMLAttributes,
} from "react";

export interface FileWithId {
  id: string;
  file: File;
}

export interface UseFileUploadOptions {
  maxFiles?: number;
  /** Max size per file in bytes. */
  maxSize?: number;
  /** Same format as the input `accept` attribute, e.g. ".pdf,image/*". */
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  onFilesChange?: (files: FileWithId[]) => void;
}

export interface FileUploadState {
  files: FileWithId[];
  isDragging: boolean;
  errors: string[];
}

export interface FileUploadActions {
  addFiles: (fileList: FileList | File[]) => void;
  removeFile: (id: string) => void;
  clearFiles: () => void;
  clearErrors: () => void;
  handleDragEnter: (e: DragEvent<HTMLElement>) => void;
  handleDragLeave: (e: DragEvent<HTMLElement>) => void;
  handleDragOver: (e: DragEvent<HTMLElement>) => void;
  handleDrop: (e: DragEvent<HTMLElement>) => void;
  openFileDialog: () => void;
  getInputProps: (
    props?: InputHTMLAttributes<HTMLInputElement>,
  ) => InputHTMLAttributes<HTMLInputElement> & {
    ref: React.Ref<HTMLInputElement>;
  };
}

export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(decimals))} ${sizes[i]}`;
};

const matchesAccept = (file: File, accept: string): boolean => {
  if (!accept || accept === "*") return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return accept
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .some((t) => {
      if (t.startsWith(".")) return name.endsWith(t);
      if (t.endsWith("/*")) return type.startsWith(t.slice(0, -1));
      return type === t;
    });
};

const fileKey = (file: File) =>
  `${file.name}-${file.size}-${file.lastModified}`;

export function useFileUpload({
  maxFiles = Infinity,
  maxSize = Infinity,
  accept = "*",
  multiple = true,
  disabled = false,
  onFilesChange,
}: UseFileUploadOptions = {}): [FileUploadState, FileUploadActions] {
  const [files, setFiles] = useState<FileWithId[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const updateFiles = useCallback(
    (next: FileWithId[]) => {
      setFiles(next);
      onFilesChange?.(next);
    },
    [onFilesChange],
  );

  const addFiles = useCallback(
    (fileList: FileList | File[]) => {
      const incoming = Array.from(fileList);
      if (incoming.length === 0) return;

      const newErrors: string[] = [];
      const base = multiple ? files : [];
      const existing = new Set(base.map((f) => fileKey(f.file)));
      const accepted: FileWithId[] = [];

      for (const file of incoming) {
        if (!matchesAccept(file, accept)) {
          newErrors.push(`${file.name} is not a supported file type.`);
          continue;
        }
        if (file.size > maxSize) {
          newErrors.push(
            `${file.name} exceeds the maximum size of ${formatBytes(maxSize)}.`,
          );
          continue;
        }
        const key = fileKey(file);
        if (existing.has(key)) continue;
        existing.add(key);
        accepted.push({ id: `${key}-${crypto.randomUUID()}`, file });
      }

      let next = multiple ? [...base, ...accepted] : accepted.slice(0, 1);
      if (next.length > maxFiles) {
        newErrors.push(`You can upload a maximum of ${maxFiles} files.`);
        next = next.slice(0, maxFiles);
      }

      setErrors(newErrors);
      if (accepted.length > 0) updateFiles(next);
      // Allow selecting the same file again after removing it.
      if (inputRef.current) inputRef.current.value = "";
    },
    [accept, files, maxFiles, maxSize, multiple, updateFiles],
  );

  const removeFile = useCallback(
    (id: string) => {
      updateFiles(files.filter((f) => f.id !== id));
      setErrors([]);
    },
    [files, updateFiles],
  );

  const clearFiles = useCallback(() => {
    updateFiles([]);
    setErrors([]);
    if (inputRef.current) inputRef.current.value = "";
  }, [updateFiles]);

  const clearErrors = useCallback(() => setErrors([]), []);

  const handleDragEnter = useCallback(
    (e: DragEvent<HTMLElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) setIsDragging(true);
    },
    [disabled],
  );

  // preventDefault on dragover is what makes an element a valid drop target;
  // without it the browser opens the file in the tab.
  const handleDragOver = useCallback(
    (e: DragEvent<HTMLElement>) => {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = disabled ? "none" : "copy";
    },
    [disabled],
  );

  const handleDragLeave = useCallback((e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Ignore leave events fired when moving between child elements.
    if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (disabled) return;
      if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
    },
    [addFiles, disabled],
  );

  const openFileDialog = useCallback(() => {
    if (!disabled) inputRef.current?.click();
  }, [disabled]);

  const getInputProps = useCallback(
    (props: InputHTMLAttributes<HTMLInputElement> = {}) => ({
      ...props,
      type: "file",
      accept,
      multiple,
      disabled,
      ref: inputRef,
      onChange: (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) addFiles(e.target.files);
        props.onChange?.(e);
      },
    }),
    [accept, addFiles, disabled, multiple],
  );

  return [
    { files, isDragging, errors },
    {
      addFiles,
      removeFile,
      clearFiles,
      clearErrors,
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      getInputProps,
    },
  ];
}
