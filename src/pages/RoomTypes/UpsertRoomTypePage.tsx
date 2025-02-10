import roomTypeApis from "@/apis/roomType.apis";
import Header from "@/components/Layout/Header";
import { Button } from "@/components/ui/button";
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
import Typography from "@/components/ui/typography";
import PATHS from "@/constants/paths";
import { toast } from "@/hooks/use-toast";
import ImagesList from "@/pages/RoomsManagement/components/ui/ImagesList";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import * as z from "zod";

export enum RoomType {
  Small = "small",
  Medium = "medium",
  Large = "large",
}

const roomTypeOptions = [
  { value: RoomType.Small, label: "Small" },
  { value: RoomType.Medium, label: "Medium" },
  { value: RoomType.Large, label: "Large" },
];

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.nativeEnum(RoomType),
  capacity: z.string().min(1, "Capacity must be at least 1"),
  area: z.string().min(1, "Area is required"),
  description: z.string(),
  images: z.array(z.string()),
});

type FormValues = z.infer<typeof formSchema>;

function UpsertRoomTypePage() {
  const { id = "" } = useParams();
  const title = id ? "Edit Room Type" : "New Room Type";
  const navigate = useNavigate();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: RoomType.Small,
      capacity: "1",
      area: "1",
      description: "",
      images: [],
    },
  });

  const { data: roomTypeData } = useQuery({
    queryKey: ["roomType", id],
    queryFn: () => roomTypeApis.getRoomType(id || ""),
    enabled: !!id,
  });

  useEffect(() => {
    if (roomTypeData?.data) {
      form.reset({
        name: roomTypeData?.data.result?.name || "",
        type: roomTypeData?.data.result?.type || RoomType.Small,
        capacity: roomTypeData?.data.result?.capacity?.toString() || "1",
        area: roomTypeData?.data.result?.area?.toString() || "1",
        description: roomTypeData?.data.result?.description || "",
        images: roomTypeData?.data.result?.images || [],
      });
    }
  }, [roomTypeData, form]);

  const { mutate: createRoomType, isPending: isCreating } = useMutation({
    mutationFn: roomTypeApis.createRoomType,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Room type created successfully",
      });
      form.reset();
      navigate(PATHS.ROOM_TYPES_LISTS);
    },

    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  // Thêm mutation để cập nhật room type
  const { mutate: updateRoomType, isPending: isUpdating } = useMutation({
    mutationFn: (data: FormData) => roomTypeApis.updateRoomType(data, id || ""),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Room type updated successfully",
      });
      navigate(PATHS.ROOM_TYPES_LISTS);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("type", values.type);
      formData.append("capacity", values.capacity.toString());
      formData.append("area", values.area + "");
      formData.append("description", values.description || "");

      // Chỉ xử lý các ảnh mới (không phải URL từ server)
      const newImages = values.images.filter((url) => !url.startsWith("http"));

      for (const blobUrl of newImages) {
        const response = await fetch(blobUrl);
        const blob = await response.blob();
        const fileName = blobUrl.split("/").pop() || `image-${Date.now()}.jpg`;
        const file = new File([blob], fileName, { type: blob.type });
        formData.append("images", file);
      }

      if (id) {
        updateRoomType(formData);
      } else {
        createRoomType(formData);
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="max-w-3xl">
      <Header title={title} />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-3">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Name <Typography variant="span">(*)</Typography>
                </FormLabel>
                <FormControl>
                  <Input placeholder="Enter room type name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Type <Typography variant="span">(*)</Typography>
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select room type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {roomTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
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
            name="capacity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Capacity <Typography variant="span">(*)</Typography>
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Enter capacity"
                    min={1}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="area"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Area (m²) <Typography variant="span">(*)</Typography>
                </FormLabel>
                <FormControl>
                  <Input type="text" placeholder="Enter area 1111" {...field} />
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
                <FormLabel>
                  Description <Typography variant="span">(*)</Typography>
                </FormLabel>
                <FormControl>
                  <Textarea placeholder="Enter description" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="images"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Images</FormLabel>
                <FormControl>
                  <ImagesList
                    onChange={field.onChange}
                    images={field.value}
                    max={5}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="mt-6"
            disabled={isCreating || isUpdating}
          >
            {isCreating || isUpdating
              ? "Loading..."
              : id
              ? "Update Room Type"
              : "Create Room Type"}
          </Button>
        </form>
      </Form>
    </div>
  );
}

export default UpsertRoomTypePage;
