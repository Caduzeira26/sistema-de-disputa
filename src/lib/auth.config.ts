import type { NextAuthConfig } from "next-auth";

// Edge-safe config: no Prisma/bcrypt imports here, so it can run in
// middleware. The Node-only Credentials provider is added in auth.ts.
export const authConfig = {
  pages: { signIn: "/admin/login" },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user) session.user.id = token.id as string;
      return session;
    },
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;
      const isAdminRoute =
        pathname.startsWith("/admin") && pathname !== "/admin/login" && pathname !== "/admin/signup";
      return isAdminRoute ? isLoggedIn : true;
    },
  },
} satisfies NextAuthConfig;
