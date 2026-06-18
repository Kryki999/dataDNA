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
        redirectTo: "/",
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
    <div className="flex min-h-dvh flex-col items-center justify-center bg-muted/40 px-4 py-8">
      <div className="mb-8 flex items-center gap-2">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Dna className="size-5" />
        </div>
        <div>
          <p className="font-semibold leading-none">DataDNA</p>
          <p className="text-sm text-muted-foreground">Sales & Reach</p>
        </div>
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Zaloguj się</CardTitle>
          <CardDescription>CEO access only</CardDescription>
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
              />
            </div>
            {params.error ? (
              <p className="text-sm text-destructive">
                Nieprawidłowy email lub hasło.
              </p>
            ) : null}
            <Button type="submit" className="w-full">
              Zaloguj
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
