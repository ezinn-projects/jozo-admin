import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export interface PageHeaderProps {
  /**
   * Tiêu đề chính của trang
   */
  title: string;
  
  /**
   * Mô tả ngắn gọn về trang (subtitle)
   */
  description?: string;
  
  /**
   * Icon hiển thị bên cạnh title (tùy chọn)
   */
  icon?: LucideIcon;
  
  /**
   * Các action buttons hiển thị bên phải header
   */
  actions?: ReactNode;
  
  /**
   * Hiển thị nút back (quay lại trang trước)
   */
  showBackButton?: boolean;
  
  /**
   * URL để back về (nếu không có sẽ dùng navigate(-1))
   */
  backUrl?: string;
  
  /**
   * Custom className cho container
   */
  className?: string;
  
  /**
   * Hiển thị separator line dưới header
   */
  showSeparator?: boolean;
}

/**
 * PageHeader Component
 * 
 * Component header thống nhất cho tất cả các trang trong hệ thống.
 * Thiết kế theo chuẩn big tech (Salesforce, HubSpot, Microsoft Dynamics) với:
 * - Typography nhất quán và rõ ràng
 * - Spacing đều đặn
 * - Hỗ trợ icon, actions, back button
 * - Responsive design
 * - UI đẹp mắt, hiện đại
 */
export function PageHeader({
  title,
  description,
  icon: Icon,
  actions,
  showBackButton = false,
  backUrl,
  className,
  showSeparator = true,
}: PageHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backUrl) {
      navigate(backUrl);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        {/* Left side: Back button + Title section */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3 sm:gap-4">
            {/* Back Button */}
            {showBackButton && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="mt-1 h-8 w-8 shrink-0"
                aria-label="Quay lại"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}

            {/* Title and Description */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                {/* Icon */}
                {Icon && (
                  <div className="flex-shrink-0">
                    <Icon className="h-7 w-7 text-foreground sm:h-8 sm:w-8" />
                  </div>
                )}

                {/* Title */}
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
                  {title}
                </h1>
              </div>

              {/* Description */}
              {description && (
                <p className="text-sm text-muted-foreground sm:text-base mt-1.5 max-w-2xl">
                  {description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right side: Actions */}
        {actions && (
          <div className="flex items-center gap-2 shrink-0 sm:mt-0">
            {actions}
          </div>
        )}
      </div>

      {/* Separator */}
      {showSeparator && (
        <div className="w-full h-px bg-border mt-6" />
      )}
    </div>
  );
}

