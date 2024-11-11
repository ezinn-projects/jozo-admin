import { PlusIcon } from "lucide-react";
import { ChangeEvent, forwardRef, useImperativeHandle, useRef } from "react";

type Props = {
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
};

const ImagePicker = forwardRef(({ onChange }: Props, ref) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    openFilePicker: () => inputRef.current?.click(),
  }));

  return (
    <div>
      <button
        className="w-20 h-20 rounded-md group bg-gray-200 flex items-center justify-center border border-dashed border-gray-300 hover:bg-gray-300/50 transition-colors"
        type="button"
        onClick={() => inputRef.current?.click()}
      >
        <PlusIcon className="w-4 h-4 group-hover:text-gray-500 transition-colors" />
      </button>

      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={inputRef}
        onChange={(e) => e.target.files && onChange(e)}
        onClick={(e) => ((e.target as HTMLInputElement).value = "")}
      />
    </div>
  );
});

export default ImagePicker;
