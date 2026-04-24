import { Game, GameType } from "@/@types/Game";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useCreateGame, useUpdateGame } from "@/hooks/use-games";
import { GameFormValues, gameFormSchema } from "../types";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

interface UpsertGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItem?: Game | null;
  gameTypes: GameType[];
}

const defaultValues: GameFormValues = {
  typeId: "",
  name: "",
  slug: "",
  shortDescription: "",
  guideContent: "",
  minPlayers: 1,
  maxPlayers: 1,
  playTimeMinutes: 30,
  isActive: true,
};

const UpsertGameModal = ({
  isOpen,
  onClose,
  selectedItem,
  gameTypes,
}: UpsertGameModalProps) => {
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const { mutateAsync: createGame, isPending: isCreating } = useCreateGame();
  const { mutateAsync: updateGame, isPending: isUpdating } = useUpdateGame();
  const form = useForm<GameFormValues>({
    resolver: zodResolver(gameFormSchema),
    defaultValues,
  });

  const isSubmitting = isCreating || isUpdating;
  const isEdit = Boolean(selectedItem?._id);

  useEffect(() => {
    if (!isOpen) return;

    if (selectedItem) {
      form.reset({
        typeId: selectedItem.typeId || "",
        name: selectedItem.name || "",
        slug: selectedItem.slug || "",
        shortDescription: selectedItem.shortDescription || "",
        guideContent: selectedItem.guideContent || "",
        minPlayers: selectedItem.minPlayers ?? 1,
        maxPlayers: selectedItem.maxPlayers ?? 1,
        playTimeMinutes: selectedItem.playTimeMinutes ?? 30,
        isActive: selectedItem.isActive ?? true,
      });
      setImageFiles([]);
      return;
    }

    form.reset(defaultValues);
    setImageFiles([]);
  }, [form, isOpen, selectedItem]);

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const onSubmit = async (values: GameFormValues) => {
    const formData = new FormData();
    formData.append("typeId", values.typeId);
    formData.append("name", values.name);
    if (values.slug) formData.append("slug", values.slug);
    if (values.shortDescription) {
      formData.append("shortDescription", values.shortDescription);
    }
    formData.append("guideContent", values.guideContent);
    formData.append("minPlayers", String(values.minPlayers));
    formData.append("maxPlayers", String(values.maxPlayers));
    formData.append("playTimeMinutes", String(values.playTimeMinutes));
    formData.append("isActive", String(values.isActive));

    if (imageFiles.length > 0) {
      imageFiles.forEach((file) => formData.append("images", file));
    }

    if (isEdit && selectedItem?._id) {
      await updateGame({ id: selectedItem._id, formData });
      handleClose();
      return;
    }

    await createGame(formData);
    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[680px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Cập nhật game" : "Tạo game"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Cập nhật thông tin game hiện tại."
              : "Thêm game mới vào hệ thống."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="typeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loại game</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn loại game" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {gameTypes.map((item) => (
                        <SelectItem key={item._id} value={item._id}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên game</FormLabel>
                  <FormControl>
                    <Input placeholder="Ví dụ: Monopoly" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input placeholder="Ví dụ: monopoly" {...field} />
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
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="minPlayers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Số người chơi tối thiểu</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} step={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxPlayers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Số người chơi tối đa</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} step={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="playTimeMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Thời lượng chơi (phút)</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} step={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="shortDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mô tả ngắn</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Mô tả ngắn hiển thị ở danh sách"
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="guideContent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hướng dẫn chơi</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Nội dung hướng dẫn chơi chi tiết"
                      className="min-h-[140px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Ảnh game (có thể chọn nhiều)</FormLabel>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const files = e.target.files ? Array.from(e.target.files) : [];
                  setImageFiles(files);
                }}
              />
              {imageFiles.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {imageFiles.map((file) => (
                    <Badge key={`${file.name}-${file.size}`} variant="outline">
                      {file.name}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>

            {isEdit && selectedItem?.images?.length ? (
              <div className="space-y-2">
                <FormLabel>Ảnh hiện tại</FormLabel>
                <div className="flex flex-wrap gap-2">
                  {selectedItem.images.map((image) => (
                    <img
                      key={image}
                      src={image}
                      alt={selectedItem.name}
                      className="h-16 w-16 rounded-md border object-cover"
                    />
                  ))}
                </div>
              </div>
            ) : null}

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

export default UpsertGameModal;
