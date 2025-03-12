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
import { useDeletePricing } from "@/hooks/pricing";
import { TrashIcon } from "lucide-react";
import { Spin } from "../../ui/spin";

type Props = {
  id?: string;
};

function DeletePricingModal(props: Props) {
  const { id = "" } = props;

  const { mutate, isPending } = useDeletePricing();

  const handleDelete = () => {
    mutate({ _id: id });
  };

  console.log("id", id);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="my-3" variant="ghost" size="icon">
          <TrashIcon size={12} />
        </Button>
      </DialogTrigger>

      <DialogPortal>
        <DialogContent className="sm:max-w-[425px]">
          <Spin spinning={isPending}>
            <DialogHeader>
              <DialogTitle>Delete pricing</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this pricing?
              </DialogDescription>
            </DialogHeader>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Close
                </Button>
              </DialogClose>
              <Button onClick={handleDelete}>Delete</Button>
            </DialogFooter>
          </Spin>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}

export default DeletePricingModal;
