import { GameType } from "@/@types/Game";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ImagePicker from "@/components/ui/image-picker";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateGameType,
  useUpdateGameType,
} from "@/hooks/use-games";
import { GameTypeFormValues, gameTypeFormSchema } from "../types";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

interface UpsertGameTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItem?: GameType | null;
}

const defaultValues: GameTypeFormValues = {
  name: "",
  slug: "",
  description: "",
  isActive: true,
};

const UpsertGameTypeModal = ({
  isOpen,
  onClose,
  selectedItem,
}: UpsertGameTypeModalProps) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState("");
  const { mutateAsync: createGameType, isPending: isCreating } = useCreateGameType();
  const { mutateAsync: updateGameType, isPending: isUpdating } = useUpdateGameType();

  const form = useForm<GameTypeFormValues>({
    resolver: zodResolver(gameTypeFormSchema),
    defaultValues,
  });

  const isSubmitting = isCreating || isUpdating;
  const isEdit = Boolean(selectedItem?._id);

  useEffect(() => {
    if (!isOpen) return;

    if (selectedItem) {
      form.reset({
        name: selectedItem.name || "",
        slug: selectedItem.slug || "",
        description: selectedItem.description || "",
        isActive: selectedItem.isActive ?? true,
      });
      setPreviewImage(selectedItem.image || "");
      setImageFile(null);
      return;
    }

    form.reset(defaultValues);
    setPreviewImage("");
    setImageFile(null);
  }, [form, isOpen, selectedItem]);

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const onSubmit = async (values: GameTypeFormValues) => {
    const formData = new FormData();
    formData.append("name", values.name);
    if (values.slug) formData.append("slug", values.slug);
    if (values.description) formData.append("description", values.description);
    formData.append("isActive", String(values.isActive));
    if (imageFile) {
      formData.append("image", imageFile);
    }

    if (isEdit && selectedItem?._id) {
      await updateGameType({ id: selectedItem._id, formData });
      handleClose();
      return;
    }

    await createGameType(formData);
    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Cập nhật loại game" : "Tạo loại game"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Cập nhật thông tin loại game."
              : "Tạo mới loại game để gán cho từng game cụ thể."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <FormLabel>Ảnh đại diện</FormLabel>
              <ImagePicker
                currentImage={previewImage}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setImageFile(file);
                  setPreviewImage(URL.createObjectURL(file));
                }}
                onRemove={() => {
                  setImageFile(null);
                  setPreviewImage("");
                }}
              />
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên loại game</FormLabel>
                  <FormControl>
                    <Input placeholder="Ví dụ: Board Game" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input placeholder="Ví dụ: board-game" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mô tả</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Mô tả ngắn cho loại game" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border p-3">
                  <FormLabel className="mb-0">Trạng thái kích hoạt</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Đang lưu..." : isEdit ? "Cập nhật" : "Tạo mới"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default UpsertGameTypeModal;
