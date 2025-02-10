import authorizationApis from "@/apis/authorization.apis";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import Typography from "@/components/ui/typography";
import PATHS from "@/constants/paths";
import { useToast } from "@/hooks/use-toast";
import { loginSchema } from "@/utils/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { AUTH_EVENTS } from "@/constants/events";
import useAuth from "@/hooks/useAuth";

type FormValues = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate(PATHS.HOME, { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const form = useForm<FormValues>({
    defaultValues: {
      email: "",
      password: "",
    },
    resolver: zodResolver(loginSchema),
  });

  const { control, handleSubmit } = form;

  const { mutate } = useMutation({
    mutationFn: authorizationApis.login,
    onSuccess: async ({ data }) => {
      localStorage.setItem("access_token", data.result?.access_token || "");

      // Dispatch event sau khi lưu token
      window.dispatchEvent(new Event(AUTH_EVENTS.LOGIN_SUCCESS));

      toast({
        title: data.message,
      });

      // Đợi một chút để đảm bảo context đã được cập nhật
      await new Promise((resolve) => setTimeout(resolve, 100));

      navigate(PATHS.HOME, { replace: true });
    },
    onError: (error) => {
      toast({
        title: error.message,
        className: "bg-red-500 text-white",
      });
    },
  });

  const [hidePassword, setHidePassword] = useState<boolean>(true);

  const togglePassword = () => setHidePassword(!hidePassword);

  const onSubmit = (data: FormValues) => {
    mutate(data);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Form {...form}>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white p-6 rounded shadow-md w-full max-w-sm"
        >
          <Typography variant="h2" className="mb-4">
            Login
          </Typography>

          <FormField
            control={control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="Enter email" {...field} />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="password"
            render={({ field }) => (
              <FormItem className="mt-1">
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    type={hidePassword ? "password" : "text"}
                    placeholder="Enter password"
                    {...field}
                    suffix={
                      <button
                        className="p-1"
                        type="button"
                        onClick={togglePassword}
                      >
                        {hidePassword ? <EyeIcon /> : <EyeOffIcon />}
                      </button>
                    }
                  />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full mt-4">
            Login
          </Button>
        </form>
      </Form>
    </div>
  );
}
