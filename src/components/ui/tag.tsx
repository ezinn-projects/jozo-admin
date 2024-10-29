import { X } from "lucide-react";
import Typography from "./typography";

type Props = {
  label: string;
  onRemove: VoidFunction;
};

const Tag = (props: Props) => {
  const { label, onRemove } = props;

  return (
    <div className="flex items-center bg-muted text-black rounded-md px-1 h-7">
      <Typography variant="span" className="text-sm">
        {label}
      </Typography>

      <button
        onClick={onRemove}
        className="ml-1 text-sm opacity-70 hover:opacity-100"
        type="button"
      >
        {<X width={12} height={12} />}
      </button>
    </div>
  );
};

export default Tag;
