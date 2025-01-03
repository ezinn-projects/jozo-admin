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
import { DayType, RoomSize, RoomType } from "@/constants/enum";
import { DAY_TYPE_OPTIONS, ROOM_SIZE_OPTIONS } from "@/constants/options";
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

type Props = {
  id?: string;
  icon?: ReactNode;
};

type FormValues = {
  roomType: RoomType;
  dayType: DayType;
  effectiveDate: string;
  time_range: {
    start: string;
    end: string;
  };
  prices: {
    price: number;
    roomType: RoomType;
  }[];
  endDate?: string;
  note?: string;
};

function UpsertPricingModal(props: Props) {
  const { id = "", icon } = props;
  const closeRef = useRef<HTMLButtonElement>(null);

  const title = id ? "Edit pricing" : "Add pricing";

  const { data: pricingData } = useGetPricingById(id);

  const { mutate, isPending } = useAddPricing();

  const form = useForm<FormValues>({
    resolver: zodResolver(addPricingSchema),
    defaultValues: pricingData?.data.result || {},
  });

  const { control, handleSubmit, setError } = form;

  const onSubmit = handleSubmit((values: FormValues) => {
    const payload = {
      prices: values.prices,
      note: values.note,
      end_date: values.endDate,
      time_range: {
        start: values.time_range.start,
        end: values.time_range.end,
      },
      room_type: values.roomType,
      day_type: values.dayType,
      effective_date: values.effectiveDate,
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
  });

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
                      name="time_range"
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
