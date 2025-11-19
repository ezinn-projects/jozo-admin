import Typography from "../ui/typography";
import { LogoutButton } from "../shared/LogoutButton";
import { NotificationBell } from "../shared/NotificationBell";

type Props = {
  title: string;
  subtitle?: string;
  showLogout?: boolean;
};
function Header(props: Props) {
  const { title, subtitle, showLogout = false } = props;

  return (
    <div className="flex flex-col w-full">
      <div className="flex items-center justify-between">
        <div>
          <Typography variant="p" className="text-md">
            {title}
          </Typography>

          {subtitle && (
            <Typography variant="p" className="text-sm text-gray-500 !mt-0">
              {subtitle}
            </Typography>
          )}
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell />
          {showLogout && (
            <LogoutButton variant="outline" size="sm" showIcon={false}>
              Đăng xuất
            </LogoutButton>
          )}
        </div>
      </div>

      <div className="w-full h-[1px] bg-gray-200 mt-4" />
    </div>
  );
}

export default Header;
