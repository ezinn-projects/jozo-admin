import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
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
import { Input } from "@/components/ui/input";
import { RoomType } from "@/constants/enum";
import { useForm } from "react-hook-form";

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
};

function UpsertRoomModal(props: Props) {
  const { id = "" } = props;

  const title = id ? "Edit room" : "Add room";

  const form = useForm<FormValues>();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>{title}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {id ? "Edit a room here." : "Add a new room here."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <Form {...form}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Name's room" {...field} />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />
          </Form>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Save changes
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default UpsertRoomModal;
