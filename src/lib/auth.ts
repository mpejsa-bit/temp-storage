import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { getDb } from "@/lib/db";
import bcrypt from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const db = await getDb();
        const row = db.exec(
          "SELECT id, email, name, password_hash FROM users WHERE email = ?",
          [credentials.email as string]
        );
        if (!row.length || !row[0].values.length) return null;
        const [id, email, name, hash] = row[0].values[0] as string[];
        const valid = await bcrypt.compare(
          credentials.password as string,
          hash
        );
        if (!valid) return null;
        return { id, email, name };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
