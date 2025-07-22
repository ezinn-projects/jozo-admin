import fnbMenuApis from "@/apis/fnbMenu.apis";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { FnBCategory } from "@/constants/enum";
import { FnBMenuItem } from "@/hooks/use-menu-items";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusCircle, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import * as z from "zod";

interface UpsertMenuItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item?: FnBMenuItem | null; // null = create, object = edit
  onSuccess?: () => void;
}

// Schema validation
const variantSchema = z.object({
  _id: z.string().optional(), // ID của variant khi edit
  name: z.string().min(1, "Tên variant là bắt buộc"),
  price: z.number().min(0, "Giá phải lớn hơn hoặc bằng 0"),
  image: z.string().optional().nullable(),
  inventory: z
    .object({
      quantity: z
        .number()
        .min(0, "Số lượng phải lớn hơn hoặc bằng 0")
        .optional(),
      minStock: z
        .number()
        .min(0, "Tồn kho tối thiểu phải lớn hơn hoặc bằng 0")
        .optional(),
      maxStock: z
        .number()
        .min(0, "Tồn kho tối đa phải lớn hơn hoặc bằng 0")
        .optional(),
    })
    .optional(),
});

const formSchema = z.object({
  name: z.string().min(1, "Tên sản phẩm là bắt buộc"),
  category: z.nativeEnum(FnBCategory, {
    required_error: "Danh mục là bắt buộc",
  }),
  parentId: z.string().optional().nullable(),
  hasVariant: z.boolean(),
  price: z.number().min(0, "Giá phải lớn hơn hoặc bằng 0"),
  image: z.string().optional().nullable(),
  inventory: z
    .object({
      quantity: z
        .number()
        .min(0, "Số lượng phải lớn hơn hoặc bằng 0")
        .optional(),
    })
    .optional(),
  variants: z.array(variantSchema).optional(),
});

type FormData = z.infer<typeof formSchema>;

const UpsertMenuItemModal: React.FC<UpsertMenuItemModalProps> = ({
  isOpen,
  onClose,
  item,
  onSuccess,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [variantFiles, setVariantFiles] = useState<{ [key: number]: File }>({});
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);

  const isEdit = !!item?._id;

  // Query để lấy chi tiết item khi edit
  const {
    data: itemDetail,
    isLoading: isLoadingDetail,
    error: detailError,
  } = useQuery({
    queryKey: ["menuItem", item?._id],
    queryFn: () => fnbMenuApis.getMenuItemById(item?._id || ""),
    enabled: isEdit && !!item?._id && isOpen,
    staleTime: 5 * 60 * 1000, // 5 phút
    gcTime: 10 * 60 * 1000, // 10 phút
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      category: FnBCategory.SNACK,
      parentId: null,
      hasVariant: false,
      price: 0,
      image: "",
      inventory: {
        quantity: 0,
      },
      variants: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "variants",
  });

  // Cập nhật form khi có dữ liệu chi tiết
  useEffect(() => {
    if (itemDetail?.data?.result && isEdit) {
      const detail = itemDetail.data.result;
      console.log("Item detail from API:", detail);

      // Xử lý variants để phù hợp với schema
      const processedVariants =
        detail.variants?.map((variant) => ({
          _id: variant._id || "", // Thêm ID của variant
          name: variant.name || "",
          price: variant.price || 0,
          image: variant.image || "",
          inventory: {
            quantity: variant.inventory?.quantity || 0,
            minStock: variant.inventory?.minStock || 0,
            maxStock: variant.inventory?.maxStock || 0,
          },
        })) || [];

      form.reset({
        name: detail.name || "",
        category: detail.category || FnBCategory.SNACK,
        parentId: detail.parentId || null,
        hasVariant: detail.hasVariant || false,
        price: detail.price || 0,
        image: detail.image || "",
        inventory: {
          quantity: detail.inventory?.quantity || 0,
        },
        variants: processedVariants,
      });
    } else if (!item) {
      // Reset form khi tạo mới
      form.reset({
        name: "",
        category: FnBCategory.SNACK,
        parentId: null,
        hasVariant: false,
        price: 0,
        image: "",
        inventory: {
          quantity: 0,
        },
        variants: [],
      });
    }
    // Reset files
    setMainImageFile(null);
    setVariantFiles({});
  }, [itemDetail, item, isEdit, form]);

  // Hiển thị lỗi nếu có
  useEffect(() => {
    if (detailError) {
      toast({
        title: "Lỗi",
        description: "Không thể tải thông tin chi tiết menu item",
        variant: "destructive",
      });
    }
  }, [detailError, toast]);

  // Hàm format currency
  const formatCurrency = (value: number): string => {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const addVariant = () => {
    append({
      _id: "", // Không có ID khi tạo mới
      name: "",
      price: form.getValues("price") || 0,
      image: "",
      inventory: {
        quantity: 0,
        minStock: 0,
        maxStock: 0,
      },
    });
  };

  const removeVariant = (index: number) => {
    remove(index);
    setVariantFiles((prev) => {
      const newFiles = { ...prev };
      delete newFiles[index];
      return newFiles;
    });
  };

  const handleVariantImagesChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setVariantFiles((prev) => ({
        ...prev,
        [index]: file,
      }));
      form.setValue(`variants.${index}.image`, URL.createObjectURL(file));
    }
  };

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMainImageFile(file);
      form.setValue("image", URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: FormData) => {
    // Kiểm tra variants nếu có
    if (data.hasVariant && (!data.variants || data.variants.length === 0)) {
      toast({
        title: "Lỗi",
        description: "Vui lòng thêm ít nhất một variant",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const submitFormData = new FormData();

      // Các trường text bắt buộc
      submitFormData.append("name", data.name);
      submitFormData.append("category", data.category);
      submitFormData.append("price", data.price.toString());
      submitFormData.append(
        "hasVariant",
        data.hasVariant?.toString() || "false"
      );
      submitFormData.append(
        "quantity",
        data.inventory?.quantity?.toString() || "0"
      );

      // Trường optional
      if (data.parentId) {
        submitFormData.append("parentId", data.parentId);
      } else {
        submitFormData.append("parentId", "");
      }

      // File ảnh chính (optional)
      if (data.image) {
        if (data.image.startsWith("http")) {
          submitFormData.append("existingImage", data.image);
        } else if (mainImageFile) {
          submitFormData.append("file", mainImageFile);
        }
      }

      // Xử lý variants nếu có
      if (data.hasVariant && data.variants) {
        const processedVariants = await Promise.all(
          data.variants.map(async (variant, index) => {
            // Handle variant image
            let variantImage = variant.image || "";
            if (
              variant.image &&
              !variant.image.startsWith("http") &&
              variantFiles[index]
            ) {
              submitFormData.append(
                `variantFile_${index}`,
                variantFiles[index]
              );
              variantImage = `variantFile_${index}`;
            }

            return {
              _id: variant._id || "", // Thêm ID của variant để backend có thể cập nhật
              name: variant.name,
              price: variant.price,
              image: variantImage,
              inventory: {
                ...variant.inventory,
              },
            };
          })
        );

        submitFormData.append("variants", JSON.stringify(processedVariants));
      }

      if (isEdit && item?._id) {
        await fnbMenuApis.updateMenuItem(item._id, submitFormData);
      } else {
        await fnbMenuApis.createMenuItem(submitFormData);
      }

      toast({
        title: "Thành công",
        description: isEdit
          ? "Cập nhật menu item thành công"
          : "Tạo menu item thành công",
      });

      // Invalidate queries để refetch danh sách
      await queryClient.invalidateQueries({ queryKey: ["menuItems"] });

      // Nếu đang edit, cũng invalidate query chi tiết
      if (isEdit && item?._id) {
        await queryClient.invalidateQueries({
          queryKey: ["menuItem", item._id],
        });
      }

      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error("Error saving menu item:", error);
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi lưu menu item",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    form.reset({
      name: "",
      category: FnBCategory.SNACK,
      parentId: null,
      hasVariant: false,
      price: 0,
      image: "",
      inventory: {
        quantity: 0,
      },
      variants: [],
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Chỉnh sửa Menu Item" : "Thêm Menu Item mới"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Cập nhật thông tin menu item"
              : "Tạo menu item mới cho hệ thống"}
          </DialogDescription>
        </DialogHeader>

        {isLoadingDetail ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Đang tải thông tin...</p>
            </div>
          </div>
        ) : (
          <form
            onSubmit={form.handleSubmit(onSubmit, (errors) => {
              console.log(errors);
            })}
            className="space-y-4"
          >
            {/* Thông tin cơ bản */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Thông tin cơ bản</h3>

              <div className="grid grid-cols-3 gap-4">
                {/* Tên sản phẩm */}
                <div className="space-y-2">
                  <Label htmlFor="name">Tên sản phẩm *</Label>
                  <Input
                    id="name"
                    {...form.register("name")}
                    placeholder="Nhập tên sản phẩm"
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>

                {/* Danh mục */}
                <div className="space-y-2">
                  <Label htmlFor="category">Danh mục *</Label>
                  <Select
                    value={form.watch("category")}
                    onValueChange={(value) =>
                      form.setValue("category", value as FnBCategory)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn danh mục" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={FnBCategory.SNACK}>
                        Đồ ăn nhẹ
                      </SelectItem>
                      <SelectItem value={FnBCategory.DRINK}>Đồ uống</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.category && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.category.message}
                    </p>
                  )}
                </div>

                {/* Giá */}
                <div className="space-y-2">
                  <Label htmlFor="price">Giá (VND) *</Label>
                  <Input
                    id="price"
                    value={formatCurrency(form.watch("price") || 0)}
                    onChange={(e) => {
                      const rawValue = e.target.value.replace(/\./g, "");
                      const numericValue = Number(rawValue) || 0;
                      form.setValue("price", numericValue);
                    }}
                    placeholder="0"
                  />
                  {form.formState.errors.price && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.price.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Số lượng tồn kho - chỉ hiển thị khi không có variants */}
              {!form.watch("hasVariant") && (
                <div className="space-y-2">
                  <Label htmlFor="quantity">Số lượng tồn kho *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    {...form.register("inventory.quantity", {
                      valueAsNumber: true,
                    })}
                    placeholder="0"
                  />
                  {form.formState.errors.inventory?.quantity && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.inventory.quantity.message}
                    </p>
                  )}
                </div>
              )}

              {/* Có variant hay không */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="hasVariant"
                  checked={form.watch("hasVariant")}
                  onCheckedChange={(checked) =>
                    form.setValue("hasVariant", checked)
                  }
                />
                <Label htmlFor="hasVariant">Có variants</Label>
              </div>

              {/* Hình ảnh chính */}
              <div className="space-y-2">
                <Label>Hình ảnh</Label>
                <ImagePicker
                  onChange={handleImagesChange}
                  currentImage={form.watch("image") || ""}
                  onRemove={() => {
                    form.setValue("image", "");
                    setMainImageFile(null);
                  }}
                />
              </div>
            </div>

            {/* Phần Variants */}
            {form.watch("hasVariant") && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Variants</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addVariant}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Thêm Variant
                  </Button>
                </div>

                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="rounded-lg border p-4 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Variant {index + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeVariant(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Tên Variant *</Label>
                        <Input
                          {...form.register(`variants.${index}.name`)}
                          placeholder="Nhập tên variant"
                        />
                        {form.formState.errors.variants?.[index]?.name && (
                          <p className="text-sm text-red-500">
                            {
                              form.formState.errors.variants[index]?.name
                                ?.message
                            }
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Giá (VND)</Label>
                        <Input
                          value={formatCurrency(
                            form.watch(`variants.${index}.price`) || 0
                          )}
                          onChange={(e) => {
                            const rawValue = e.target.value.replace(/\./g, "");
                            const numericValue = Number(rawValue) || 0;
                            form.setValue(
                              `variants.${index}.price`,
                              numericValue
                            );
                          }}
                          placeholder="0"
                        />
                        {form.formState.errors.variants?.[index]?.price && (
                          <p className="text-sm text-red-500">
                            {
                              form.formState.errors.variants[index]?.price
                                ?.message
                            }
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Hình ảnh variant */}
                    <div className="space-y-2">
                      <Label>Hình ảnh</Label>
                      <ImagePicker
                        onChange={(e) => handleVariantImagesChange(index, e)}
                        currentImage={
                          form.watch(`variants.${index}.image`) || ""
                        }
                        onRemove={() => {
                          form.setValue(`variants.${index}.image`, "");
                          setVariantFiles((prev) => {
                            const newFiles = { ...prev };
                            delete newFiles[index];
                            return newFiles;
                          });
                        }}
                      />
                    </div>

                    {/* Inventory cho variant */}
                    <div className="space-y-4">
                      <Label>Quản lý tồn kho</Label>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Số lượng</Label>
                          <Input
                            type="number"
                            min={0}
                            {...form.register(
                              `variants.${index}.inventory.quantity`,
                              { valueAsNumber: true }
                            )}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Tồn kho tối thiểu</Label>
                          <Input
                            type="number"
                            min={0}
                            {...form.register(
                              `variants.${index}.inventory.minStock`,
                              { valueAsNumber: true }
                            )}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Tồn kho tối đa</Label>
                          <Input
                            type="number"
                            min={0}
                            {...form.register(
                              `variants.${index}.inventory.maxStock`,
                              { valueAsNumber: true }
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Đang lưu..." : isEdit ? "Cập nhật" : "Tạo mới"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UpsertMenuItemModal;
