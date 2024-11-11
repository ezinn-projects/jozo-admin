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
import Header from "@/components/Layout/Header";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import ImagesList from "../components/ui/ImagesList";

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
  tags: string[];
  images: string[];
  status: RoomStatus;
  area: string;
  houseRules: string[];
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

const tagsOptions = [
  { value: "single", label: "Single" },
  { value: "double", label: "Double" },
  { value: "twin", label: "Twin" },
];

const houseRules = [
  {
    id: "1",
    rule: "Không hút thuốc",
    description:
      "Cấm hút thuốc trong phòng và các khu vực công cộng của homestay.",
    status: "active",
  },
  {
    id: "2",
    rule: "Không thú cưng",
    description: "Không được mang thú cưng vào phòng.",
    status: "active",
  },
  {
    id: "3",
    rule: "Không tổ chức tiệc",
    description: "Không tổ chức tiệc, tiệc tùng ồn ào trong phòng.",
    status: "active",
  },
  {
    id: "4",
    rule: "Giữ yên lặng sau 10 giờ tối",
    description: "Giữ yên lặng từ 10 giờ tối trở đi.",
    status: "active",
  },
];

function UpsertRoomPage(props: Props) {
  const { id = "" } = props;

  const title = id ? "Edit room" : "New room";

  const form = useForm<FormValues>();

  return (
    <div className="max-w-3xl">
      <Header title={title} />

      <Form {...form}>
        <form className="space-y-2 mt-3">
          <Accordion type="multiple">
            <AccordionItem value="item-1">
              <AccordionTrigger>Basic Information</AccordionTrigger>
              <AccordionContent>
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
                        Max Occupancy{" "}
                        <Typography variant="span">(*)</Typography>{" "}
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
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger>Pricing</AccordionTrigger>
              <AccordionContent>
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
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger>Room details</AccordionTrigger>
              <AccordionContent>
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
                  name="houseRules"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>House rules</FormLabel>
                      <FormControl>
                        <AutocompleteTags
                          suggestions={houseRules.map((rule) => ({
                            value: rule.id,
                            label: rule.rule,
                          }))}
                          placeholder="Enter house rules"
                          {...field}
                        />
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags</FormLabel>
                      <FormControl>
                        <AutocompleteTags
                          suggestions={tagsOptions}
                          placeholder="Enter tags"
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
                      <FormLabel>Area</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter area"
                          {...field}
                          type="number"
                          prefix="m²"
                        />
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger>Images</AccordionTrigger>
              <AccordionContent>
                <FormField
                  control={form.control}
                  name="images"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image</FormLabel>
                      <FormControl>
                        <ImagesList
                          onChange={field.onChange}
                          images={field.value}
                          max={10}
                        />
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
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
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </form>
      </Form>
    </div>
  );
}

export default UpsertRoomPage;
