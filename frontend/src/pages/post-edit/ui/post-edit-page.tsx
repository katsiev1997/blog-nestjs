import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router";
import { z } from "zod";
import { deletePost, POST_QUERIES, updatePost } from "@/shared/api";
import { useSession } from "@/shared/auth";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
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
import { Textarea } from "@/shared/ui/textarea";

const postSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  content: z.string().min(1, "Content is required"),
  imageUrl: z.string().max(255).optional().or(z.literal("")),
});

type PostValues = z.infer<typeof postSchema>;

export function PostEditPage() {
  const { id } = useParams();
  const postId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useSession();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const postQuery = useQuery({
    ...POST_QUERIES.detail(postId),
    enabled: Number.isFinite(postId),
  });

  const form = useForm<PostValues>({
    resolver: zodResolver(postSchema),
    defaultValues: { title: "", content: "", imageUrl: "" },
  });

  useEffect(() => {
    if (postQuery.data) {
      form.reset({
        title: postQuery.data.title,
        content: postQuery.data.content,
        imageUrl: postQuery.data.imageUrl ?? "",
      });
    }
  }, [postQuery.data, form]);

  const saveMutation = useMutation({
    mutationFn: (values: PostValues) =>
      updatePost(postId, {
        title: values.title,
        content: values.content,
        imageUrl: values.imageUrl || undefined,
      }),
    onSuccess: async (post) => {
      await queryClient.invalidateQueries({ queryKey: POST_QUERIES.all() });
      navigate(`/posts/${post.id}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deletePost(postId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: POST_QUERIES.all() });
      navigate("/posts");
    },
  });

  if (postQuery.isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (!postQuery.data) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Post not found</AlertTitle>
        <AlertDescription>This post may have been deleted.</AlertDescription>
      </Alert>
    );
  }

  if (user && postQuery.data.userId !== user.id) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Forbidden</AlertTitle>
        <AlertDescription>You can only edit your own posts.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold tracking-tight">Edit post</h1>
      <form
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}
      >
        <FieldGroup>
          <Controller
            control={form.control}
            name="title"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor="edit-title">Title</FieldLabel>
                <Input
                  {...field}
                  id="edit-title"
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
                <FieldLabel htmlFor="edit-content">Content</FieldLabel>
                <Textarea
                  {...field}
                  id="edit-content"
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
                <FieldLabel htmlFor="edit-image">Image URL (optional)</FieldLabel>
                <Input
                  {...field}
                  id="edit-image"
                  aria-invalid={fieldState.invalid}
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
        </FieldGroup>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? (
              <Spinner data-icon="inline-start" />
            ) : null}
            Save
          </Button>
          <Button
            type="button"
            variant="outline"
            render={<Link to={`/posts/${postId}`} />}
            nativeButton={false}
          >
            Cancel
          </Button>
          {confirmDelete ? (
            <>
              <Button
                type="button"
                variant="destructive"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate()}
              >
                Confirm delete
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setConfirmDelete(false)}
              >
                Keep post
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="destructive"
              onClick={() => setConfirmDelete(true)}
            >
              Delete
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
