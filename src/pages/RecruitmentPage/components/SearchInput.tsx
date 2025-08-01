import React from "react";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = "Tìm kiếm theo tên, email, số điện thoại...",
}) => {
  const [localValue, setLocalValue] = React.useState(value);
  const debouncedValue = useDebounce(localValue, 500);

  // Sync local value với prop value
  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Gọi onChange khi debounced value thay đổi
  React.useEffect(() => {
    onChange(debouncedValue);
  }, [debouncedValue, onChange]);

  return (
    <Input
      placeholder={placeholder}
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
    />
  );
};

export default SearchInput;
