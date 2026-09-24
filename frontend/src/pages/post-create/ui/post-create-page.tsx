import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import { z } from "zod";
import { createPost, POST_QUERIES } from "@/shared/api";
import { Button } from "@/shared/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { Spinner } from "@/shared/ui/spinner";
import { Textarea } from "@/shared/ui/textarea";

const postSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  content: z.string().min(1, "Content is required"),
  imageUrl: z.string().max(255).optional().or(z.literal("")),
});

type PostValues = z.infer<typeof postSchema>;

export function PostCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const form = useForm<PostValues>({
    resolver: zodResolver(postSchema),
    defaultValues: { title: "", content: "", imageUrl: "" },
  });

  const mutation = useMutation({
    mutationFn: createPost,
    onSuccess: async (post) => {
      await queryClient.invalidateQueries({ queryKey: POST_QUERIES.all() });
      navigate(`/posts/${post.id}`);
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold tracking-tight">New post</h1>
      <form
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit((values) =>
          mutation.mutate({
            title: values.title,
            content: values.content,
            imageUrl: values.imageUrl || undefined,
          }),
        )}
      >
        <FieldGroup>
          <Controller
            control={form.control}
            name="title"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor="post-title">Title</FieldLabel>
                <Input
                  {...field}
                  id="post-title"
                  aria-invalid={fieldState.invalid}
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="content"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor="post-content">Content</FieldLabel>
                <Textarea
                  {...field}
                  id="post-content"
                  rows={12}
                  aria-invalid={fieldState.invalid}
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
                <FieldLabel htmlFor="post-image">Image URL (optional)</FieldLabel>
                <Input
                  {...field}
                  id="post-image"
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
            Publish
          </Button>
          <Button
            type="button"
            variant="outline"
            render={<Link to="/posts" />}
            nativeButton={false}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
