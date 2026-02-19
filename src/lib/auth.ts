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
        // Check admin status
        const adminRow = db.exec("SELECT is_admin FROM users WHERE id = ?", [id]);
        const isAdmin = adminRow.length && adminRow[0].values.length ? adminRow[0].values[0][0] === 1 : false;
        return { id, email, name, is_admin: isAdmin };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.is_admin = (user as any).is_admin ?? false;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        (session.user as any).is_admin = token.is_admin ?? false;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
