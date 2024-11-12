import { ReactNode } from "react";

// Định nghĩa các kiểu cho variant
type Variant = "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span";

const variantClasses: Record<Variant, string> = {
  h1: "scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl",
  h2: "scroll-m-20 text-3xl font-semibold tracking-tight",
  h3: "scroll-m-20 text-2xl font-semibold tracking-tight",
  h4: "scroll-m-20 text-xl font-semibold tracking-tight",
  h5: "scroll-m-20 text-lg font-semibold tracking-tight",
  h6: "scroll-m-20 text-base font-semibold tracking-tight",
  p: "leading-7 [&:not(:first-child)]:mt-6",
  span: "text-base font-normal", // Lớp CSS cơ bản cho span
};

// Định nghĩa kiểu cho props của Typography
interface TypographyProps {
  variant?: Variant;
  children: ReactNode;
  className?: string;
}

// Component Typography
function Typography({
  variant = "p",
  children,
  className,
  ...props
}: TypographyProps) {
  // Xác định thẻ HTML tương ứng dựa trên variant
  const Component = variant as keyof JSX.IntrinsicElements;
  const variantClass = variantClasses[variant]; // Lấy lớp CSS theo variant

  return (
    <Component className={`${variantClass} ${className} !mt-0`} {...props}>
      {children}
    </Component>
  );
}

export default Typography;
