import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Role } from "@/constants/enum";
import { useDebounce } from "@/hooks/use-debounce";
import { useUsers } from "@/hooks/use-users";
import { Loader2, Search, X } from "lucide-react";
import React, { useEffect, useId, useRef, useState } from "react";
import {
  isPhoneLikeInput,
  isValidMemberPhone,
  sanitizePhoneInput,
} from "../utils/memberPhone";

export interface MemberPhoneComboboxProps {
  phone: string;
  onPhoneChange: (phone: string) => void;
  id?: string;
  label?: string;
  disabled?: boolean;
  enabled?: boolean;
  canClear?: boolean;
  onClear?: () => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  className?: string;
  inputClassName?: string;
  trailing?: React.ReactNode;
  helperText?: React.ReactNode;
  errorText?: React.ReactNode;
  /** true khi đang gõ tên (chưa chọn) — parent nên ẩn card lookup SĐT cũ */
  onNameSearchActiveChange?: (active: boolean) => void;
}

/**
 * Một ô: nhập SĐT (auto-lookup) hoặc tìm member theo tên → chọn để đổ SĐT.
 */
const MemberPhoneCombobox: React.FC<MemberPhoneComboboxProps> = ({
  phone,
  onPhoneChange,
  id,
  label = "Thành viên (SĐT hoặc tên)",
  disabled = false,
  enabled = true,
  canClear = false,
  onClear,
  onKeyDown,
  className,
  inputClassName,
  trailing,
  helperText,
  errorText,
  onNameSearchActiveChange,
}) => {
  const autoId = useId();
  const inputId = id ?? autoId;
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState(phone);
  const [isOpen, setIsOpen] = useState(false);

  // Đồng bộ khi phone đổi từ ngoài (chọn member / clear / mở modal)
  useEffect(() => {
    setQuery((prev) => {
      if (!isPhoneLikeInput(prev) && prev.trim().length > 0) return prev;
      return phone;
    });
  }, [phone]);

  const isNameMode = !isPhoneLikeInput(query);

  useEffect(() => {
    onNameSearchActiveChange?.(isNameMode && query.trim().length > 0);
  }, [isNameMode, query, onNameSearchActiveChange]);

  const searchTerm = (() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return "";
    if (isNameMode) return trimmed;
    // Gợi ý theo prefix SĐT khi chưa đủ số hợp lệ
    if (!isValidMemberPhone(phone)) return sanitizePhoneInput(trimmed);
    return "";
  })();

  const debouncedSearch = useDebounce(searchTerm, 350);
  const {
    users: results,
    isLoadingUsers: isSearching,
    isFetchingUsers: isFetching,
  } = useUsers({
    page: 1,
    limit: 8,
    search: debouncedSearch,
    role: Role.Member,
    enabled: enabled && debouncedSearch.length >= 2,
  });

  const showDropdown = isOpen && debouncedSearch.length >= 2;

  const handleQueryChange = (raw: string) => {
    setIsOpen(true);
    if (isPhoneLikeInput(raw)) {
      const sanitized = sanitizePhoneInput(raw);
      setQuery(sanitized);
      onPhoneChange(sanitized);
      return;
    }
    setQuery(raw);
  };

  const handleSelect = (selectedPhone: string | undefined) => {
    const next = sanitizePhoneInput(selectedPhone ?? "");
    if (!next) return;
    setQuery(next);
    onPhoneChange(next);
    setIsOpen(false);
  };

  const handleBlur = () => {
    // Cho phép click chọn item trước khi đóng
    window.setTimeout(() => {
      if (!containerRef.current?.contains(document.activeElement)) {
        setIsOpen(false);
        if (!isPhoneLikeInput(query)) {
          setQuery(phone);
        }
      }
    }, 120);
  };

  const handleClear = () => {
    setQuery("");
    onClear?.();
    setIsOpen(false);
  };

  return (
    <div className={cn("space-y-2", className)} ref={containerRef}>
      {label ? (
        <Label htmlFor={inputId} className="text-sm font-medium">
          {label}
        </Label>
      ) : null}
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="flex-1 space-y-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              id={inputId}
              type="text"
              inputMode={isNameMode ? "text" : "tel"}
              autoComplete="off"
              placeholder="SĐT hoặc tên member..."
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onFocus={() => setIsOpen(true)}
              onBlur={handleBlur}
              onKeyDown={onKeyDown}
              disabled={disabled}
              className={cn(
                "h-11 pl-9 text-base sm:text-lg tracking-wide",
                canClear && "pr-10",
                errorText && "border-red-500 focus-visible:ring-red-500",
                inputClassName,
              )}
            />
            {canClear && (
              <button
                type="button"
                onClick={handleClear}
                disabled={disabled}
                aria-label="Bỏ thành viên"
                title="Bỏ thành viên"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {(isSearching || isFetching) && debouncedSearch.length >= 2 && (
              <Loader2
                className={cn(
                  "absolute top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-blue-500",
                  canClear ? "right-10" : "right-3",
                )}
              />
            )}
          </div>

          {showDropdown && !isSearching && !isFetching && (
            <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
              {results.length > 0 ? (
                results.map((result) => (
                  <button
                    type="button"
                    key={result._id}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect(result.phone_number)}
                    disabled={!result.phone_number?.trim()}
                    className="w-full px-3 py-2.5 text-left hover:bg-blue-50 border-b last:border-b-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="font-medium text-gray-900">
                      {result.name ||
                        result.full_name ||
                        result.username ||
                        "Member"}
                    </div>
                    <div className="text-xs text-gray-500">
                      SĐT: {result.phone_number || "Chưa có SĐT"}
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-3 py-2.5 text-sm text-gray-500">
                  Không tìm thấy member
                </div>
              )}
            </div>
          )}

          {errorText ? (
            <p className="text-xs text-red-600">{errorText}</p>
          ) : helperText ? (
            <div className="text-xs text-muted-foreground">{helperText}</div>
          ) : null}
        </div>
        {trailing}
      </div>
    </div>
  );
};

export default MemberPhoneCombobox;
