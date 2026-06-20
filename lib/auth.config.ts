import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.organizationId = user.organizationId;
        token.role = user.role;
        token.displayName = user.displayName;
        token.username = user.username;
        token.avatarUrl = user.avatarUrl;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.organizationId = token.organizationId as string;
        session.user.role = token.role as "owner" | "admin" | "member";
        session.user.displayName = token.displayName as string | undefined;
        session.user.username = token.username as string | undefined;
        session.user.avatarUrl = token.avatarUrl as string | null | undefined;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
