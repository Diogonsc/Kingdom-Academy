import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import logo from "@/assets/logo.png";
import { toast } from "sonner";
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
import { APP_NAME } from "@/lib/constants";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const { resetPassword } = useAuth();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!email) {
      toast.error("Informe seu e-mail");
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await resetPassword(email);

      if (error) {
        toast.error(error);
        return;
      }

      setSent(true);
      toast.success("Verifique seu e-mail para redefinir a senha");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/40 p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3 text-center">
          <div className="w-full flex items-center justify-center">
            <img src={logo} alt="Kingdom Academy" className="w-1/3 mx-auto" />
          </div>
          <CardTitle className="text-2xl">{APP_NAME}</CardTitle>
          <CardDescription>
            {sent
              ? "Enviamos um link de recuperação para o seu e-mail."
              : "Informe seu e-mail para receber o link de redefinição de senha"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                Verifique sua caixa de entrada e siga as instruções para criar uma
                nova senha.
              </p>
              <Button asChild className="w-full">
                <Link to="/login">Voltar para login</Link>
              </Button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              <Button className="w-full" type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                Enviar link de recuperação
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                <Link
                  to="/login"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Voltar para login
                </Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
