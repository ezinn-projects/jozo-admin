import Typography from "../ui/typography";

type Props = {
  title: string;
  subtitle?: string;
};
function Header(props: Props) {
  const { title, subtitle } = props;

  return (
    <div className="flex flex-col w-full">
      <Typography variant="p" className="text-md">
        {title}
      </Typography>

      {subtitle && (
        <Typography variant="p" className="text-sm text-gray-500 !mt-0">
          {subtitle}
        </Typography>
      )}

      <div className="w-full h-[1px] bg-gray-200" />
    </div>
  );
}

export default Header;
