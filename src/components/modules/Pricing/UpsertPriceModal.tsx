import { type Price } from "@/@types/general-management";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
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
import { DayType, RoomType } from "@/constants/enum";
import { DAY_TYPE_OPTIONS } from "@/constants/options";
import { useAddPricing, useGetPricingById } from "@/hooks/pricing";
import { cn } from "@/lib/utils";
import { addPricingSchema } from "@/utils/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Portal } from "@radix-ui/react-portal";
import { AxiosError } from "axios";
import { format } from "date-fns";
import { CalendarIcon, CircleXIcon } from "lucide-react";
import { ReactNode, useRef } from "react";
import { useForm } from "react-hook-form";
import { Calendar } from "../../ui/calendar";
import { Input } from "../../ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Spin } from "../../ui/spin";
import Typography from "../../ui/typography";
import { formatCurrency } from "@/utils";

type Props = {
  id?: string;
  icon?: ReactNode;
};

type FormValues = {
  dayType: DayType;
  timeRange: {
    start: string; // e.g., "17:00"
    end: string; // e.g., "24:00"
  };
  prices: {
    roomType: RoomType;
    price: string;
  }[];
  effectiveDate: string;
  endDate?: string;
  note?: string;
};

const roomTypes = Object.values(RoomType).filter((type) => type);

function UpsertPricingModal(props: Props) {
  const { id = "", icon } = props;
  const closeRef = useRef<HTMLButtonElement>(null);

  const title = id ? "Edit price" : "Add price";

  const { data: priceData } = useGetPricingById(id);

  const price = priceData?.data.result || ({} as Price);

  // console.log("roomTypes", roomTypes);

  const { mutate, isPending } = useAddPricing();

  const form = useForm<FormValues>({
    resolver: zodResolver(addPricingSchema),
    defaultValues: {
      dayType: price.day_type,
      timeRange: price.time_range,
      prices: price?.prices?.map((price) => ({
        roomType: price.room_type,
        price: formatCurrency(price.price),
      })),
      effectiveDate: price.effective_date,
      endDate: price.end_date || undefined,
      note: price.note || undefined,
    },
  });

  const { control, handleSubmit, setError } = form;

  const onSubmit = handleSubmit(
    (values: FormValues) => {
      const payload = {
        ...values,
        prices: values.prices.map((price) => ({
          roomType: price.roomType,
          price: +price.price.replace(/\./g, ""),
        })),
        dayType: values.dayType,
        effectiveDate: values.effectiveDate,
        endDate: values.endDate,
        note: values.note,
      };

      mutate(payload, {
        onSuccess: () => {
          closeRef.current?.click();
          form.reset();
        },
        onError: (error) => {
          const axiosError = error as AxiosError<{
            errors: Record<string, ErrorField>;
          }>;

          if (axiosError.response?.data) {
            const errors = axiosError.response.data.errors;
            for (const key in errors) {
              setError(key as keyof FormValues, { message: errors[key].msg });
            }
          }
        },
      });
    },
    (error) => console.log("error", error)
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="my-3" icon={icon}>
          {title}
        </Button>
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
                      control={control}
                      name="prices"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Prices</FormLabel>
                          <div className="grid gap-2">
                            {roomTypes.map((roomType) => (
                              <div
                                key={roomType}
                                className="grid grid-cols-2 gap-4 items-center"
                              >
                                <div className="text-sm font-medium">
                                  {roomType}
                                </div>
                                <FormControl>
                                  <Input
                                    {...field}
                                    type="number"
                                    currency
                                    placeholder="Enter price"
                                    value={
                                      field.value?.find(
                                        (p) => p.roomType === roomType
                                      )?.price || ""
                                    }
                                    onChange={(e) => {
                                      const newValue = [...(field.value || [])];
                                      const index = newValue.findIndex(
                                        (p) => p.roomType === roomType
                                      );
                                      const price = e.target.value;

                                      if (index >= 0) {
                                        newValue[index] = {
                                          ...newValue[index],
                                          price,
                                        };
                                      } else {
                                        newValue.push({ roomType, price });
                                      }

                                      field.onChange(newValue);
                                    }}
                                  />
                                </FormControl>
                              </div>
                            ))}
                          </div>
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
                      <DialogClose ref={closeRef} asChild>
                        <Button type="button" variant="secondary">
                          Close
                        </Button>
                      </DialogClose>
                      <Button type="submit" loading={isPending}>
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

export default UpsertPricingModal;
