import ImagePicker from "@/components/ui/image-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ChangeEvent, useRef, useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

type Props = {
  onChange: (images: string[], files: File[]) => void;
  images: string[];
  max?: number;
};

function ImagesList({ onChange, images, max = 10 }: Props) {
  const [imagesList, setImagesList] = useState<string[]>(images);
  const [filesList, setFilesList] = useState<File[]>([]);
  const [openPopoverIndex, setOpenPopoverIndex] = useState<number | null>(null);
  const [mainImageIndex, setMainImageIndex] = useState<number | null>(null);

  const imagePickerRef = useRef<{ openFilePicker: () => void }>(null);

  useEffect(() => {
    setImagesList(images);
  }, [images]);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newImages = files.map((file) => URL.createObjectURL(file));

      if (!imagesList.length) {
        setMainImageIndex(0);
      }

      if (openPopoverIndex !== null) {
        const updatedImagesList = imagesList.map((image, index) => {
          if (index === openPopoverIndex) {
            return newImages[0];
          }
          return image;
        });
        const updatedFilesList = filesList.map((file, index) => {
          if (index === openPopoverIndex) {
            return files[0];
          }
          return file;
        });

        setImagesList(updatedImagesList);
        setFilesList(updatedFilesList);
        onChange(updatedImagesList, updatedFilesList);
      } else {
        const updatedImagesList = [...imagesList, ...newImages];
        const updatedFilesList = [...filesList, ...files];
        setImagesList(updatedImagesList);
        setFilesList(updatedFilesList);
        onChange(updatedImagesList, updatedFilesList);
      }
    }

    e.target.value = "";
    setOpenPopoverIndex(null);
  };

  const handleRemoveImage = (index: number) => {
    const updatedImagesList = imagesList.filter((_, i) => i !== index);
    const updatedFilesList = filesList.filter((_, i) => i !== index);
    setImagesList(updatedImagesList);
    setFilesList(updatedFilesList);
    onChange(updatedImagesList, updatedFilesList);
    setOpenPopoverIndex(null);

    if (index === mainImageIndex) {
      setMainImageIndex(null);
    }
  };

  const handleSetMainImage = (index: number) => {
    setMainImageIndex(index);
    setOpenPopoverIndex(null);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {imagesList?.map((image, index) => (
        <Popover
          key={index}
          open={openPopoverIndex === index}
          onOpenChange={(open) => setOpenPopoverIndex(open ? index : null)}
        >
          <PopoverTrigger asChild>
            <div
              className={cn(
                "relative w-20 h-20 rounded-md overflow-hidden",
                mainImageIndex === index ? "main-image" : "",
                openPopoverIndex === index ? "selected-image" : ""
              )}
            >
              <img
                src={image}
                alt="room"
                className="w-full h-full object-cover"
              />
            </div>
          </PopoverTrigger>

          <PopoverContent className="w-40">
            <ul className="flex flex-col gap-2">
              <li
                className="hover:underline hover:underline-offset-4 transition-all duration-300 hover:cursor-pointer"
                onClick={() => handleSetMainImage(index)}
              >
                <p>Set as Main</p>
              </li>
              <li
                className="hover:underline hover:underline-offset-4 transition-all duration-300 hover:cursor-pointer"
                onClick={() => imagePickerRef.current?.openFilePicker()}
              >
                <p>Change</p>
              </li>
              <li className="hover:underline hover:underline-offset-4 transition-all duration-300 hover:cursor-pointer">
                <Dialog>
                  <DialogTrigger>Preview</DialogTrigger>
                  <DialogContent className="sm:max-w-[90vw] h-[90vh] !p-0 !gap-0 border-none">
                    <img
                      src={image}
                      alt="room"
                      className="w-full h-full object-cover rounded-md"
                    />
                  </DialogContent>
                </Dialog>
              </li>
              <li
                className="hover:underline hover:underline-offset-4 transition-all duration-300 hover:cursor-pointer"
                onClick={() => handleRemoveImage(index)}
              >
                <p>Remove</p>
              </li>
            </ul>
          </PopoverContent>
        </Popover>
      ))}

      {max === imagesList.length ? null : (
        <ImagePicker onChange={handleImageChange} ref={imagePickerRef} />
      )}
    </div>
  );
}

export default ImagesList;
