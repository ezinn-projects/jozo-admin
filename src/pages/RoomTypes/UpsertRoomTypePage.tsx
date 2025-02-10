import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import Typography from "@/components/ui/typography";
import { useForm } from "react-hook-form";
import Header from "@/components/Layout/Header";
import ImagesList from "@/pages/RoomsManagement/components/ui/ImagesList";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation } from "@tanstack/react-query";
import roomTypeApis from "@/apis/roomType.apis";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import PATHS from "@/constants/paths";

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

type Props = {
  id?: string;
};

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.nativeEnum(RoomType),
  capacity: z.number().min(1, "Capacity must be at least 1"),
  area: z.string(),
  description: z.string(),
  images: z.array(z.string()),
});

type FormValues = z.infer<typeof formSchema>;

function UpsertRoomTypePage(props: Props) {
  const { id = "" } = props;
  const title = id ? "Edit Room Type" : "New Room Type";

  const navigate = useNavigate();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: RoomType.Small,
      capacity: 1,
      area: "1",
      description: "",
      images: [],
    },
  });

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

  const onSubmit = async (values: FormValues) => {
    try {
      // Create FormData
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("type", values.type);
      formData.append("capacity", values.capacity.toString());
      formData.append("area", values.area || "1");
      formData.append("description", values.description || "");

      // Chuyển đổi blob URL thành File
      const imageFiles = await Promise.all(
        values.images.map(async (blobUrl) => {
          const response = await fetch(blobUrl);
          const blob = await response.blob();
          // Tạo tên file từ blob URL hoặc dùng timestamp
          const fileName =
            blobUrl.split("/").pop() || `image-${Date.now()}.jpg`;
          return new File([blob], fileName, { type: blob.type });
        })
      );

      // Append các file ảnh
      imageFiles.forEach((file) => {
        formData.append("images", file);
      });

      createRoomType(formData);
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
                    onChange={(e) => field.onChange(Number(e.target.value))}
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

          <Button type="submit" className="mt-6" disabled={isCreating}>
            {isCreating
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
