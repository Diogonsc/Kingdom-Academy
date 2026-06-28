import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Loading } from "@/components/loading";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { ALLOWED_IMAGE_ACCEPT, mapImageError } from "@/lib/image";
import { updateProfile } from "@/services/profiles";
import { uploadAvatar } from "@/services/storage";

const profileSchema = z
  .object({
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    email: z.string().email("E-mail inválido"),
    password: z.string().optional(),
    confirmPassword: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.password && data.password.length > 0) {
        return data.password.length >= 8;
      }
      return true;
    },
    { message: "A senha deve ter pelo menos 8 caracteres", path: ["password"] },
  )
  .refine(
    (data) => {
      if (data.password) {
        return data.password === data.confirmPassword;
      }
      return true;
    },
    { message: "As senhas não coincidem", path: ["confirmPassword"] },
  );

type ProfileFormValues = z.infer<typeof profileSchema>;

export function ProfilePage() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    values: {
      name: profile?.name ?? "",
      email: profile?.email ?? user?.email ?? "",
      password: "",
      confirmPassword: "",
    },
  });

  const displayAvatar = avatarUrl ?? profile?.avatar_url ?? "";
  const name = profile?.name ?? "Usuário";
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploadingAvatar(true);

    try {
      const url = await uploadAvatar(file, user.id);
      await updateProfile(user.id, { name: profile?.name ?? name, avatar_url: url });
      setAvatarUrl(url);
      await refreshProfile();
      toast.success("Foto atualizada com sucesso!");
    } catch (error) {
      toast.error(mapImageError(error));
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleSubmit(values: ProfileFormValues) {
    if (!user || !profile) return;

    setSaving(true);

    try {
      await updateProfile(user.id, {
        name: values.name,
        avatar_url: displayAvatar || profile.avatar_url,
      });

      if (values.email !== (profile.email ?? user.email)) {
        const { error } = await supabase.auth.updateUser({ email: values.email });
        if (error) throw new Error(error.message);
      }

      if (values.password) {
        const { error } = await supabase.auth.updateUser({
          password: values.password,
        });
        if (error) throw new Error(error.message);
      }

      toast.success("Perfil atualizado com sucesso!");
      await refreshProfile();
      form.reset({
        name: values.name,
        email: values.email,
        password: "",
        confirmPassword: "",
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao atualizar perfil",
      );
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || !profile) {
    return <Loading message="Carregando perfil..." />;
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-4">
      <div>
        <h1 className="text-2xl font-bold">Meu Perfil</h1>
        <p className="text-sm text-muted-foreground">
          Atualize suas informações pessoais e foto de perfil.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Foto de perfil</CardTitle>
          <CardDescription>
            Sua foto será exibida na barra lateral e no certificado.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="size-20 rounded-xl">
              {displayAvatar ? (
                <AvatarImage
                  src={displayAvatar}
                  alt={name}
                  className="rounded-xl"
                />
              ) : null}
              <AvatarFallback className="rounded-xl text-lg">
                {initials}
              </AvatarFallback>
            </Avatar>
            <button
              type="button"
              disabled={uploadingAvatar}
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-full border border-border bg-background shadow-sm transition-colors hover:bg-muted"
            >
              {uploadingAvatar ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Camera className="size-4" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_IMAGE_ACCEPT}
              className="hidden"
              onChange={(event) => void handleAvatarChange(event)}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            JPG, PNG ou WEBP (até 5 MB). Otimizado automaticamente para WebP (máx. 512px).
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informações pessoais</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit((values) => void handleSubmit(values))}
          >
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" {...form.register("name")} />
              {form.formState.errors.name ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.name.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" {...form.register("email")} />
              {form.formState.errors.email ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.email.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Nova senha (opcional)</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                {...form.register("password")}
              />
              {form.formState.errors.password ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.password.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                {...form.register("confirmPassword")}
              />
              {form.formState.errors.confirmPassword ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.confirmPassword.message}
                </p>
              ) : null}
            </div>

            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              Salvar alterações
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
