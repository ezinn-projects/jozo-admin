import { PlusIcon, X } from "lucide-react";
import { ChangeEvent, forwardRef, useImperativeHandle, useRef } from "react";

type Props = {
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  currentImage?: string;
  onRemove?: () => void;
};

const ImagePicker = forwardRef(
  ({ onChange, currentImage, onRemove }: Props, ref) => {
    const inputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({
      openFilePicker: () => inputRef.current?.click(),
    }));

    return (
      <div className="relative">
        <div
          className="w-20 h-20 rounded-md group bg-gray-200 flex items-center justify-center border border-dashed border-gray-300 hover:bg-gray-300/50 transition-colors cursor-pointer overflow-hidden"
          onClick={() => inputRef.current?.click()}
        >
          {currentImage ? (
            <div className="relative w-full h-full">
              <img
                src={currentImage}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              {onRemove && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove();
                  }}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ) : (
            <PlusIcon className="w-4 h-4 group-hover:text-gray-500 transition-colors" />
          )}
        </div>

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
  }
);

ImagePicker.displayName = "ImagePicker";

export default ImagePicker;
