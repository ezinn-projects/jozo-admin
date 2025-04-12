/* eslint-disable @typescript-eslint/no-unused-vars */
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
// import { FnbFormValues } from "../types";
import { FnbFormValues } from "@/@types/FnBMenu";
import { useState } from "react";
import { FNB_CATEGORIES, FNB_CATEGORY_LABELS } from "../constants";

interface FnbModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: FnbFormValues) => void;
  initialValues?: Partial<FnbFormValues>;
  mode: "create" | "edit";
}

export function FnbModal({
  isOpen,
  onClose,
  onSubmit,
  initialValues,
  mode,
}: FnbModalProps) {
  const [values, setValues] = useState<FnbFormValues>({
    name: initialValues?.name || "",
    price: initialValues?.price || 0,
    description: initialValues?.description || "",
    category: initialValues?.category || FNB_CATEGORIES.SNACKS,
    image: initialValues?.image,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create Menu Item" : "Edit Menu Item"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={values.name}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, name: e.target.value }))
              }
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              type="number"
              min={0}
              step={0.01}
              value={values.price}
              onChange={(e) =>
                setValues((prev) => ({
                  ...prev,
                  price: Number(e.target.value),
                }))
              }
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={values.category}
              onValueChange={(value) =>
                setValues((prev) => ({ ...prev, category: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(FNB_CATEGORIES).map(([_, value]) => (
                  <SelectItem key={value} value={value}>
                    {FNB_CATEGORY_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={values.description}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, description: e.target.value }))
              }
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
