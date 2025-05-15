/* eslint-disable @typescript-eslint/no-unused-vars */
import { FnbMenu } from "@/@types/FnBMenu";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateMenu, useUpdateMenu } from "@/hooks/use-fnb-menu";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import ImagesList from "../../RoomsManagement/components/ui/ImagesList";
import { FNB_CATEGORIES, FNB_CATEGORY_LABELS } from "../constants";

interface FnbModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialValues?: Partial<FnbMenu>;
}

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  price: z.string().min(1, "Price is required"),
  description: z.string(),
  category: z.string(),
  image: z.string().optional(),
  inventory: z.object({
    quantity: z.number().min(0, "Quantity must be greater than or equal to 0"),
    unit: z.string().min(1, "Unit is required"),
    minStock: z
      .number()
      .min(0, "Minimum stock must be greater than or equal to 0"),
    maxStock: z
      .number()
      .min(0, "Maximum stock must be greater than or equal to 0"),
  }),
});

const INVENTORY_UNITS = {
  CAN: "lon",
  BAG: "bịch",
  BOTTLE: "chai",
  PACK: "gói",
} as const;

const INVENTORY_UNIT_LABELS = {
  [INVENTORY_UNITS.CAN]: "Lon",
  [INVENTORY_UNITS.BAG]: "Bịch",
  [INVENTORY_UNITS.BOTTLE]: "Chai",
  [INVENTORY_UNITS.PACK]: "Gói",
} as const;

export function FnbModal({ isOpen, onClose, initialValues }: FnbModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialValues?.name || "",
      price: initialValues?.price
        ? typeof initialValues.price === "number"
          ? (initialValues.price as number).toLocaleString("vi-VN")
          : String(initialValues.price)
        : "1.000",
      description: initialValues?.description || "",
      category: initialValues?.category || FNB_CATEGORIES.SNACKS,
      image: initialValues?.image || "",
      inventory: {
        quantity: initialValues?.inventory?.quantity || 0,
        unit: initialValues?.inventory?.unit || INVENTORY_UNITS.CAN,
        minStock: initialValues?.inventory?.minStock || 0,
        maxStock: initialValues?.inventory?.maxStock || 0,
      },
    },
  });

  const { mutate: createMenu, isPending: isCreating } = useCreateMenu();
  const { mutate: updateMenu, isPending: isUpdating } = useUpdateMenu();

  useEffect(() => {
    if (initialValues) {
      form.reset({
        ...initialValues,
        price:
          typeof initialValues.price === "number"
            ? (initialValues.price as number).toLocaleString("vi-VN")
            : initialValues.price,
      });
    }
  }, [initialValues]);

  const resetForm = () => {
    form.reset({
      name: "",
      price: "1.000",
      description: "",
      category: FNB_CATEGORIES.SNACKS,
      image: "",
      inventory: {
        quantity: 0,
        unit: INVENTORY_UNITS.CAN,
        minStock: 0,
        maxStock: 0,
      },
    });
    setFiles([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const onFormSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("price", data.price.toString());
      formData.append("description", data.description);
      formData.append("category", data.category);
      formData.append("inventory", JSON.stringify(data.inventory));

      // Handle image upload
      if (data.image) {
        if (data.image.startsWith("http")) {
          formData.append("existingImage", data.image);
        } else if (files.length > 0) {
          formData.append("file", files[0]);
        }
      }

      if (!initialValues?._id) {
        formData.append("createdAt", new Date().toISOString());
        createMenu(formData as unknown as Omit<FnbMenu, "_id">, {
          onSuccess: handleClose,
        });
      } else {
        updateMenu(
          {
            id: initialValues._id,
            menu: formData as unknown as Partial<FnbMenu>,
          },
          {
            onSuccess: handleClose,
          }
        );
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  const handleImagesChange = (images: string[], imageFiles: File[]) => {
    setFiles(imageFiles);
    form.setValue("image", images[0] || "");
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {!initialValues?._id ? "Create Menu Item" : "Edit Menu Item"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onFormSubmit)}
            className="grid gap-4 py-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="name">Name</FormLabel>
                  <FormControl>
                    <Input id="name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="price">Price</FormLabel>
                  <FormControl>
                    <Input
                      id="price"
                      currency
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="category">Category</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(FNB_CATEGORIES).map(([_, value]) => (
                        <SelectItem key={value} value={value}>
                          {FNB_CATEGORY_LABELS[value]}
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="description">Description</FormLabel>
                  <FormControl>
                    <Textarea id="description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image</FormLabel>
                  <FormControl>
                    <ImagesList
                      images={field.value ? [field.value] : []}
                      onChange={handleImagesChange}
                      max={1}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Inventory Management</h3>

              <FormField
                control={form.control}
                name="inventory.quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="inventory.unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(INVENTORY_UNITS).map(([_, value]) => (
                          <SelectItem key={value} value={value}>
                            {INVENTORY_UNIT_LABELS[value]}
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
                name="inventory.minStock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Stock</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="inventory.maxStock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Stock</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" loading={isCreating || isUpdating}>
                Save
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
