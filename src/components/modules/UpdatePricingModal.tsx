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
import { DayType, RoomSize } from "@/constants/enum";
import { DAY_TYPE_OPTIONS, ROOM_SIZE_OPTIONS } from "@/constants/options";
import { cn } from "@/lib/utils";
import { Portal } from "@radix-ui/react-portal";
import { format } from "date-fns";
import { CalendarIcon, CircleXIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import Typography from "../ui/typography";

type Props = {
  id?: string;
};

type FormValues = {
  roomSize: RoomSize;
  dayType: DayType;
  effectiveDate: string;
  timeRange: string;
  price: number;
  endDate?: string;
  note?: string;
};

function UpdatePricingModal(props: Props) {
  const { id = "" } = props;

  const title = id ? "Edit pricing" : "Add pricing";

  const form = useForm<FormValues>();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="my-3">{title}</Button>
      </DialogTrigger>
      <DialogPortal>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              {id ? "Edit a pricing here." : "Add a new pricing here."}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[(100svh-theme(spacing.8)]">
            <div className="grid gap-4">
              <Form {...form}>
                <form className="space-y-2">
                  <FormField
                    control={form.control}
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
                    control={form.control}
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
                    control={form.control}
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
                                    onClick={() => field.onChange(undefined)}
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
                              onClick={(e) => e.stopPropagation()}
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
                </form>
              </Form>
            </div>
          </ScrollArea>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Save changes
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}

export default UpdatePricingModal;
