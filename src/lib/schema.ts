
import { z } from "zod"

const formSchema = z.object({
  username: z.string().min(2).max(50),
})

// Change password schema
export const changePasswordSchema = z.object({
  old_password: z
    .string()
    .min(6, "Mật khẩu cũ phải có ít nhất 6 ký tự")
    .max(8, "Mật khẩu cũ không được quá 8 ký tự"),
  password: z
    .string()
    .min(6, "Mật khẩu mới phải có ít nhất 6 ký tự")
    .max(8, "Mật khẩu mới không được quá 8 ký tự"),
  confirm_password: z
    .string()
    .min(6, "Xác nhận mật khẩu phải có ít nhất 6 ký tự")
    .max(8, "Xác nhận mật khẩu không được quá 8 ký tự"),
}).refine((data) => data.password === data.confirm_password, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirm_password"],
})

export { formSchema }
