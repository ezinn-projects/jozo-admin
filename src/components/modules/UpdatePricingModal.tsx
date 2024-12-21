import pricingApis from "@/apis/pricing.apis";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DayType, RoomSize } from "@/constants/enum";
import { DAY_TYPE_OPTIONS, ROOM_SIZE_OPTIONS } from "@/constants/options";
import { cn } from "@/lib/utils";
import { addPricingSchema } from "@/utils/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Portal } from "@radix-ui/react-portal";
import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarIcon, CircleXIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { Calendar } from "../ui/calendar";
import { Input } from "../ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Spin } from "../ui/spin";
import Typography from "../ui/typography";

type Props = {
  id?: string;
};

type FormValues = {
  roomSize: RoomSize;
  dayType: DayType;
  effectiveDate: string;
  timeRange: {
    start: string;
    end: string;
  };
  price: number;
  endDate?: string;
  note?: string;
};

function UpdatePricingModal(props: Props) {
  const { id = "" } = props;

  const title = id ? "Edit pricing" : "Add pricing";

  const { mutate, isPending } = useMutation({
    mutationFn: pricingApis.createPricing,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(addPricingSchema),
  });

  const { control, handleSubmit } = form;

  const onSubmit = handleSubmit(
    (values: FormValues) => {
      const payload = {
        ...values,
        time_range: {
          start: values.timeRange.start,
          end: values.timeRange.end,
        },
        room_size: values.roomSize,
        day_type: values.dayType,
        effective_date: values.effectiveDate,
      };

      mutate(payload);
    },
    (errors) => {
      console.log(errors);
    }
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="my-3">{title}</Button>
      </DialogTrigger>

      <DialogPortal>
        <DialogContent className="sm:max-w-[425px]">
          <Spin spinning={isPending}>
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>
                {id ? "Edit a pricing here." : "Add a new pricing here."}
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="h-[(100svh-theme(spacing.8)]">
              <div className="grid gap-4">
                <Form {...form}>
                  <form className="space-y-2" onSubmit={onSubmit}>
                    <FormField
                      control={control}
                      name="roomSize"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Room size</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a room size" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {ROOM_SIZE_OPTIONS.map((option) => (
                                <SelectItem
                                  value={option.value}
                                  key={option.label}
                                >
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
                      control={control}
                      name="dayType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Day type</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a day type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {DAY_TYPE_OPTIONS.map((option) => (
                                <SelectItem
                                  value={option.value}
                                  key={option.label}
                                >
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
                      control={control}
                      name="effectiveDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Effective date</FormLabel>
                          <Popover modal={true}>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "dd/MM/yyyy")
                                  ) : (
                                    <Typography>Pick a date</Typography>
                                  )}

                                  {field.value ? (
                                    <CircleXIcon
                                      className="ml-auto h-4 w-4 opacity-50"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        field.onChange(undefined);
                                      }}
                                    />
                                  ) : (
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  )}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <Portal>
                              <PopoverContent
                                className="w-full p-0"
                                align="center"
                              >
                                <Calendar
                                  className="w-full"
                                  mode="single"
                                  selected={
                                    field.value
                                      ? new Date(field.value)
                                      : undefined
                                  }
                                  onSelect={(date) =>
                                    field.onChange(date?.toISOString())
                                  }
                                  disabled={(date) =>
                                    date > new Date() ||
                                    date < new Date("1900-01-01")
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Portal>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name="timeRange"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Time range</FormLabel>
                          <div className="flex items-center gap-2 justify-between border rounded-md p-1 shadow-sm">
                            <FormControl>
                              <input
                                type="time"
                                value={field.value?.start || ""}
                                onChange={(e) =>
                                  field.onChange({
                                    ...field.value,
                                    start: e.target.value,
                                  })
                                }
                              />
                            </FormControl>
                            <span>-</span>
                            <FormControl>
                              <input
                                type="time"
                                value={field.value?.end || ""}
                                onChange={(e) =>
                                  field.onChange({
                                    ...field.value,
                                    end: e.target.value,
                                  })
                                }
                              />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Price</FormLabel>

                          <FormControl>
                            <Input
                              placeholder="Enter price"
                              type="number"
                              {...field}
                              currency
                              maxLength={9}
                            />
                          </FormControl>

                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>End date</FormLabel>
                          <Popover modal={true}>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "dd/MM/yyyy")
                                  ) : (
                                    <Typography>Pick a date</Typography>
                                  )}

                                  {field.value ? (
                                    <CircleXIcon
                                      className="ml-auto h-4 w-4 opacity-50"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        field.onChange(undefined);
                                      }}
                                    />
                                  ) : (
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  )}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <Portal>
                              <PopoverContent
                                className="w-full p-0"
                                align="center"
                              >
                                <Calendar
                                  className="w-full"
                                  mode="single"
                                  selected={
                                    field.value
                                      ? new Date(field.value)
                                      : undefined
                                  }
                                  onSelect={field.onChange}
                                  disabled={(date) =>
                                    date > new Date() ||
                                    date < new Date("1900-01-01")
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Portal>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name="note"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Note</FormLabel>

                          <FormControl>
                            <Input
                              maxLength={200}
                              as="textarea"
                              placeholder="Enter note"
                              {...field}
                            />
                          </FormControl>

                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <DialogFooter>
                      <Button type="submit" variant="secondary">
                        Save changes
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </div>
            </ScrollArea>
          </Spin>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}

export default UpdatePricingModal;
