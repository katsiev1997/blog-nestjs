import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import { z } from "zod";
import { AUTH_QUERIES, updateUser, USER_QUERIES } from "@/shared/api";
import { useSession } from "@/shared/auth";
import { Button } from "@/shared/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { Skeleton } from "@/shared/ui/skeleton";
import { Spinner } from "@/shared/ui/spinner";

const profileSchema = z.object({
  name: z.string().min(1).max(255),
  age: z.coerce.number().int().min(1).max(150),
  email: z.email(),
  username: z.string().min(3).max(255),
  password: z.string().min(8).optional().or(z.literal("")),
  imageUrl: z.string().max(255).optional().or(z.literal("")),
});

type ProfileValues = z.infer<typeof profileSchema>;

export function ProfileEditPage() {
  const { user, isLoading } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      age: 18,
      email: "",
      username: "",
      password: "",
      imageUrl: "",
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name,
        age: user.age,
        email: user.email,
        username: user.username,
        password: "",
        imageUrl: user.imageUrl ?? "",
      });
    }
  }, [user, form]);

  const mutation = useMutation({
    mutationFn: (values: ProfileValues) => {
      if (!user) throw new Error("Not authenticated");
      return updateUser(user.id, {
        name: values.name,
        age: values.age,
        email: values.email,
        username: values.username,
        imageUrl: values.imageUrl || null,
        ...(values.password ? { password: values.password } : {}),
      });
    },
    onSuccess: async (updated) => {
      await queryClient.setQueryData(AUTH_QUERIES.me().queryKey, updated);
      await queryClient.invalidateQueries({ queryKey: USER_QUERIES.all() });
      navigate("/profile/me");
    },
  });

  if (isLoading || !user) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold tracking-tight">Edit profile</h1>
      <form
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      >
        <FieldGroup>
          <Controller
            control={form.control}
            name="name"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor="profile-name">Name</FieldLabel>
                <Input {...field} id="profile-name" aria-invalid={fieldState.invalid} />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="age"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor="profile-age">Age</FieldLabel>
                <Input
                  {...field}
                  id="profile-age"
                  type="number"
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
                <FieldLabel htmlFor="profile-email">Email</FieldLabel>
                <Input
                  {...field}
                  id="profile-email"
                  type="email"
                  aria-invalid={fieldState.invalid}
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
                <FieldLabel htmlFor="profile-username">Username</FieldLabel>
                <Input
                  {...field}
                  id="profile-username"
                  aria-invalid={fieldState.invalid}
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
                <FieldLabel htmlFor="profile-password">
                  New password (optional)
                </FieldLabel>
                <Input
                  {...field}
                  id="profile-password"
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
                <FieldLabel htmlFor="profile-image">Avatar URL</FieldLabel>
                <Input
                  {...field}
                  id="profile-image"
                  aria-invalid={fieldState.invalid}
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
        </FieldGroup>
        <div className="flex items-center gap-2">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? <Spinner data-icon="inline-start" /> : null}
            Save
          </Button>
          <Button
            type="button"
            variant="outline"
            render={<Link to="/profile/me" />}
            nativeButton={false}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
