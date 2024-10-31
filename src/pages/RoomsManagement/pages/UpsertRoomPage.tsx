import AutocompleteTags from "@/components/ui/autocomplete-tags";
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
import { Select } from "@radix-ui/react-select";
import { useForm } from "react-hook-form";
import { RoomStatus } from "../constants/enum";
import { roomStatusOptions, roomTypeOptions } from "../constants";
// import { roomStatusOptions, roomTypeOptions } from "../../constants";

type Props = {
  id?: string;
};

type FormValues = {
  name: string;
  type: RoomType;
  maxOccupancy: number;
  description: string;
  originalPrice: number;
  discountedPrice?: number;
  amenities: string[];
  status: RoomStatus;
};

export const amenitiesOptions = [
  { value: "wifi", label: "Wi-Fi" },
  { value: "ac", label: "Air Conditioning" },
  { value: "tv", label: "Television" },
  { value: "minibar", label: "Minibar" },
  { value: "safe", label: "Safe" },
  { value: "coffee_maker", label: "Coffee Maker" },
  { value: "gym", label: "Gym Access" },
  { value: "pool", label: "Swimming Pool" },
  { value: "parking", label: "Parking" },
  { value: "spa", label: "Spa Services" },
  { value: "projector", label: "Projector" },
  { value: "sofa", label: "Sofa" },
  { value: "refrigerator", label: "Mini Fridge" },
  { value: "decor_lighting", label: "Decor Lighting" },
  { value: "marshall_speaker", label: "Marshall Speaker" },
];

function UpsertRoomPage(props: Props) {
  const { id = "" } = props;

  const title = id ? "Edit room" : "New room";

  const form = useForm<FormValues>();
  return (
    <div>
      <Typography variant="h1">{title}</Typography>

      <Form {...form}>
        <form className="space-y-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Name <Typography variant="span">(*)</Typography>{" "}
                </FormLabel>
                <FormControl>
                  <Input placeholder="Enter room name" {...field} />
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
                <FormLabel>Type</FormLabel>
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
                        {option.value}
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
            name="maxOccupancy"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Max Occupancy <Typography variant="span">(*)</Typography>{" "}
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter max occupancy"
                    {...field}
                    type="number"
                    max={99}
                    min={1}
                  />
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
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea placeholder="Enter description" {...field} />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="originalPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Original price</FormLabel>
                <FormControl>
                  <Input placeholder="Enter original price" {...field} />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="discountedPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Discounted price</FormLabel>
                <FormControl>
                  <Input placeholder="Enter original price" {...field} />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="amenities"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amenities</FormLabel>
                <FormControl>
                  <AutocompleteTags
                    suggestions={amenitiesOptions}
                    placeholder="Enter amenities"
                    {...field}
                  />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />

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
                      <SelectValue placeholder="Select a room status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {roomStatusOptions.map((option) => (
                      <SelectItem value={option.value} key={option.label}>
                        {option.value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </div>
  );
}

export default UpsertRoomPage;
