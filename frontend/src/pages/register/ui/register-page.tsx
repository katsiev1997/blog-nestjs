import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import { z } from "zod";
import { AUTH_QUERIES, register } from "@/shared/api";
import { setAccessToken } from "@/shared/auth";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { Spinner } from "@/shared/ui/spinner";

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  age: z.coerce.number().int().min(1).max(150),
  email: z.email(),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  imageUrl: z.string().optional().or(z.literal("")),
});

type RegisterValues = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      age: 18,
      email: "",
      username: "",
      password: "",
      imageUrl: "",
    },
  });

  const mutation = useMutation({
    mutationFn: register,
    onSuccess: async (data) => {
      setAccessToken(data.accessToken);
      await queryClient.setQueryData(AUTH_QUERIES.me().queryKey, data.user);
      navigate("/posts");
    },
  });

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create account</CardTitle>
          <CardDescription>Join Blog to write and comment.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-4"
            onSubmit={form.handleSubmit((values) =>
              mutation.mutate({
                ...values,
                imageUrl: values.imageUrl || undefined,
              }),
            )}
          >
            <FieldGroup>
              <Controller
                control={form.control}
                name="name"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid || undefined}>
                    <FieldLabel htmlFor="register-name">Name</FieldLabel>
                    <Input
                      {...field}
                      id="register-name"
                      aria-invalid={fieldState.invalid}
                      autoComplete="name"
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="age"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid || undefined}>
                    <FieldLabel htmlFor="register-age">Age</FieldLabel>
                    <Input
                      {...field}
                      id="register-age"
                      type="number"
                      min={1}
                      max={150}
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="email"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid || undefined}>
                    <FieldLabel htmlFor="register-email">Email</FieldLabel>
                    <Input
                      {...field}
                      id="register-email"
                      type="email"
                      aria-invalid={fieldState.invalid}
                      autoComplete="email"
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="username"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid || undefined}>
                    <FieldLabel htmlFor="register-username">Username</FieldLabel>
                    <Input
                      {...field}
                      id="register-username"
                      aria-invalid={fieldState.invalid}
                      autoComplete="username"
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="password"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid || undefined}>
                    <FieldLabel htmlFor="register-password">Password</FieldLabel>
                    <Input
                      {...field}
                      id="register-password"
                      type="password"
                      aria-invalid={fieldState.invalid}
                      autoComplete="new-password"
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="imageUrl"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid || undefined}>
                    <FieldLabel htmlFor="register-image">
                      Avatar URL (optional)
                    </FieldLabel>
                    <Input
                      {...field}
                      id="register-image"
                      aria-invalid={fieldState.invalid}
                      placeholder="https://…"
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            </FieldGroup>
            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? <Spinner data-icon="inline-start" /> : null}
              Create account
            </Button>
            <p className="text-center text-sm">
              <Link to="/login" className="font-medium hover:underline">
                Already have an account? Log in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
