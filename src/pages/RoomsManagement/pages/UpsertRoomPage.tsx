import roomApis from "@/apis/room.apis";
import Header from "@/components/Layout/Header";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import Typography from "@/components/ui/typography";
import { RoomType } from "@/constants/enum";
import PATHS from "@/constants/paths";
import { useToast } from "@/hooks/use-toast";
import { Select } from "@radix-ui/react-select";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import ImagesList from "../components/ui/ImagesList";
import { roomStatusOptions, roomTypeOptions } from "../constants";
import { RoomStatus } from "../constants/enum";

// IRoom chỉ còn các trường cơ bản:
// {
//   _id?: ObjectId;
//   roomName: string;
//   roomType: string; // SMALL, MEDIUM, LARGE
//   maxCapacity: number;
//   status: string; // AVAILABLE, UNAVAILABLE
//   images: string[]; // Cloudinary URLs
//   description?: string;
//   createdAt: Date;
//   updatedAt?: Date;
// }

type Props = {
  id?: string;
};

// FormValues đồng bộ với IRoom tối giản
type FormValues = {
  roomName: string;
  roomType: RoomType;
  maxCapacity: number;
  description?: string;
  images: string[];
  status: RoomStatus;
};

function UpsertRoomPage({ id = "" }: Props) {
  const { toast } = useToast();
  const navigate = useNavigate();

  const title = id ? "Edit room" : "New room";

  const form = useForm<FormValues>({
    defaultValues: {
      roomName: "",
      roomType: RoomType.Small,
      maxCapacity: 1,
      description: "",
      images: [],
      status: RoomStatus.Available,
    },
  });

  const { mutate: createRoom, isPending: isCreating } = useMutation({
    mutationFn: roomApis.createRoom,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Room created successfully",
      });
      navigate(PATHS.ROOMS);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const { mutate: updateRoom, isPending: isUpdating } = useMutation({
    mutationFn: roomApis.updateRoom,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Room updated successfully",
      });
      navigate(PATHS.ROOMS);
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
    const formData = new FormData();
    formData.append("roomName", values.roomName);
    formData.append("roomType", values.roomType);
    formData.append("maxCapacity", values.maxCapacity.toString());
    formData.append("description", values.description || "");

    // Chuyển đổi blob URL thành File
    const imageFiles = await Promise.all(
      values.images.map(async (blobUrl) => {
        const response = await fetch(blobUrl);
        const blob = await response.blob();
        // Tạo tên file từ blob URL hoặc dùng timestamp
        const fileName = blobUrl.split("/").pop() || `image-${Date.now()}.jpg`;
        return new File([blob], fileName, { type: blob.type });
      })
    );

    // Append các file ảnh
    imageFiles.forEach((file) => {
      formData.append("images", file);
    });

    formData.append("status", values.status);

    if (id) {
      formData.append("_id", id);
      updateRoom(formData);
    } else {
      console.log("formData", formData.get("images"));
      createRoom(formData);
    }
  };

  return (
    <div className="max-w-3xl">
      <Header title={title} />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2 mt-3">
          <Accordion type="multiple">
            {/* Basic Information */}
            <AccordionItem value="item-1">
              <AccordionTrigger>Basic Information</AccordionTrigger>
              <AccordionContent>
                {/* Room Name */}
                <FormField
                  control={form.control}
                  name="roomName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Room Name <Typography variant="span">(*)</Typography>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Enter room name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Room Type */}
                <FormField
                  control={form.control}
                  name="roomType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Room Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a room type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {roomTypeOptions.map((option) => (
                            <SelectItem value={option.value} key={option.label}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Max Capacity */}
                <FormField
                  control={form.control}
                  name="maxCapacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Max Capacity <Typography variant="span">(*)</Typography>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter max capacity"
                          {...field}
                          min={1}
                          max={99}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </AccordionContent>
              x
            </AccordionItem>

            {/* Images */}
            <AccordionItem value="item-2">
              <AccordionTrigger>Images</AccordionTrigger>
              <AccordionContent>
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
              </AccordionContent>
            </AccordionItem>

            {/* Status */}
            <AccordionItem value="item-3">
              <AccordionTrigger>Status</AccordionTrigger>
              <AccordionContent>
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select room status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {roomStatusOptions.map((option) => (
                            <SelectItem value={option.value} key={option.label}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Thêm nút Submit ở cuối form */}
          <div className="flex justify-end mt-4">
            <Button type="submit" disabled={isCreating || isUpdating}>
              {isCreating || isUpdating
                ? "Loading..."
                : id
                ? "Update Room"
                : "Create Room"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

export default UpsertRoomPage;
