import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
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
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <Card className="w-full max-w-md border-border/60 bg-card/60">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Selly</CardTitle>
          <CardDescription>Sales & Reach Dashboard — CEO access</CardDescription>
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
            <Button
              type="submit"
              className="w-full bg-emerald-500 text-black hover:bg-emerald-400"
            >
              Zaloguj
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
