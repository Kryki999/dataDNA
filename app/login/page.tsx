import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { Dna } from "lucide-react";
import { signIn } from "@/lib/auth";
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

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  async function loginAction(formData: FormData) {
    "use server";

    try {
      await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirectTo: "/profil",
      });
    } catch (error) {
      if (isRedirectError(error)) {
        throw error;
      }
      if (error instanceof AuthError) {
        redirect("/login?error=invalid");
      }
      throw error;
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg border border-primary/30 bg-primary/15 text-primary shadow-[0_0_24px_rgba(0,85,255,0.25)]">
          <Dna className="size-5" />
        </div>
        <div>
          <p className="font-semibold leading-none">DataDNA</p>
          <p className="text-sm text-muted-foreground">Sales & Reach Terminal</p>
        </div>
      </div>
      <Card className="w-full max-w-sm border-border/80 bg-card/80">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Zaloguj się</CardTitle>
          <CardDescription>Konto utworzone przez seed</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={loginAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="bg-background/60"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Hasło</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="bg-background/60"
              />
            </div>
            {params.error ? (
              <p className="text-sm text-destructive">
                Nieprawidłowy email lub hasło.
              </p>
            ) : null}
            <Button type="submit" className="w-full shadow-[0_0_20px_rgba(0,85,255,0.2)]">
              Zaloguj
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
