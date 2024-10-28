import { useEffect, useState } from "react";
import Tag from "./tag";
import Typography from "./typography";
import { Check } from "lucide-react";

type AutocompleteTagsProps = {
  suggestions: { value: string; label: string }[];
  placeholder?: string;
};

const AutocompleteTags = (props: AutocompleteTagsProps) => {
  const { suggestions, placeholder } = props;
  const [inputValue, setInputValue] = useState<string>("");
  const [tags, setTags] = useState<{ value: string; label: string }[]>([]);
  const [isFocused, setIsFocused] = useState<boolean>(false);

  useEffect(() => {
    const handleBackspace = (event: KeyboardEvent) => {
      if (event.key === "Backspace" && inputValue === "") {
        setTags((prevTag) => prevTag.slice(0, -1));
      }
    };
    document.addEventListener("keydown", handleBackspace);

    return () => document.removeEventListener("keydown", handleBackspace);
  }, [inputValue]);

  const addTag = (tag: { value: string; label: string }) => {
    setTags([...tags, tag]);
    setInputValue("");
  };

  const removeTag = (tagToRemove: { value: string }) => {
    setTags(tags.filter((tag) => tag.value !== tagToRemove.value));
  };

  const filteredSuggestions = suggestions.filter((suggestion) =>
    suggestion.label.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <>
      <div
        className={`relative w-full text-sm outline-none rounded-md shadow-sm flex flex-wrap gap-x-1 items-center px-3 ${
          isFocused ? "border-black border" : "border"
        }`}
      >
        {tags.map((tag, index) => (
          <Tag key={index} label={tag.label} onRemove={() => removeTag(tag)} />
        ))}

        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="py-2 text-sm outline-none rounded-md flex-grow"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={tags.length ? "" : placeholder}
        />
      </div>

      {!!inputValue && filteredSuggestions.length > 0 && (
        <div className="bg-white w-full rounded shadow-md max-h-32 overflow-y-auto p-2 flex flex-col z-10 absolute">
          {filteredSuggestions.map((suggestion, index) => {
            const isSelected = tags.includes(suggestion);

            return (
              <button
                type="button"
                key={index}
                onMouseDown={(e) => {
                  e.preventDefault(); // Ngăn `onBlur` của input
                  isSelected ? removeTag(suggestion.value) : addTag(suggestion);
                }}
                className={`px-2 py-1 hover:bg-gray-100 cursor-pointer text-left rounded-sm w-full flex items-center justify-between ${
                  isSelected ? "bg-gray-100" : ""
                }`}
              >
                <Typography className="text-left w-full" variant="span">
                  {suggestion.label}
                </Typography>

                {isSelected && <Check width={14} height={14} />}
              </button>
            );
          })}
        </div>
      )}
    </>
  );
};

export default AutocompleteTags;
