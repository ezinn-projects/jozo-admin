import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Typography from "@/components/ui/typography";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { addRoomTypeSchema } from "@/utils/schema";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAddRoomType, useUpdateRoomType, useRoomTypesLists } from "../hooks";
import { toast } from "@/hooks/use-toast";
import { AxiosError } from "axios";

function RoomTypesLists() {
  const form = useForm<z.infer<typeof addRoomTypeSchema>>({
    defaultValues: {
      name: "",
      description: "",
    },
    resolver: zodResolver(addRoomTypeSchema),
  });

  const { handleSubmit, reset, setError } = form;

  const { mutate: addRoomType, isPending } = useAddRoomType();

  const { mutate: updateRoomType, isPending: pendingUpdate } =
    useUpdateRoomType();

  const { data: roomTypesListsData } = useRoomTypesLists();

  const { data } = roomTypesListsData?.data.result as {};

  const columns: ColumnDef<RoomType>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: () => <div className="w-20">Name</div>,
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const payment = row.original;

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => navigator.clipboard.writeText(payment._id)}
                >
                  Copy payment ID
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>View customer</DropdownMenuItem>
                <DropdownMenuItem>View payment details</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    []
  );

  const submit = handleSubmit((data) => {
    addRoomType(data as Omit<RoomType, "id">, {
      onSuccess: ({ data }) => {
        toast({
          title: data.message,
        });
        reset();
      },
      onError: (error) => {
        const axiosError = error as AxiosError<HTTPResponse>;
        const errors = axiosError.response?.data.errors as Record<
          string,
          { msg: string }
        >;

        for (const key in errors) {
          const error = errors[key];
          setError(key as "name" | "description", {
            message: error.msg,
          });
        }
      },
    });
  });

  const handleClose = () => {
    reset();
  };

  console.log("roomTypesListsData", data);

  return (
    <div>
      <Typography variant="h3">Room Types</Typography>

      <Drawer>
        <DrawerTrigger asChild>
          <Button>Create</Button>
        </DrawerTrigger>

        <DrawerContent className="mx-auto max-w-md p-4">
          <DrawerHeader>
            <DrawerTitle>Add Room Type</DrawerTitle>
            <DrawerDescription>This action cannot be undone.</DrawerDescription>
          </DrawerHeader>

          <Form {...form}>
            <form className="flex flex-col gap-4 w-full" onSubmit={submit}>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter name" {...field} />
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
                      <Input placeholder="Enter description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DrawerFooter>
                <Button className="w-full" type="submit" loading={isPending}>
                  Submit
                </Button>

                <DrawerClose asChild>
                  <Button variant="outline" onClick={handleClose}>
                    Cancel
                  </Button>
                </DrawerClose>
              </DrawerFooter>
            </form>
          </Form>
        </DrawerContent>
      </Drawer>

      <DataTable columns={columns} data={data || []} className="mt-4" />
    </div>
  );
}

export default RoomTypesLists;
