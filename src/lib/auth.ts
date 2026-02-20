import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { getDb, saveDb } from "@/lib/db";

async function logAccess(userId: string) {
  try {
    const db = await getDb();
    const now = new Date().toISOString();
    db.run(
      "INSERT INTO access_log (id, user_id, action, created_at) VALUES (?, ?, 'login', ?)",
      [crypto.randomUUID(), userId, now]
    );
    db.run("UPDATE users SET last_login_at = ? WHERE id = ?", [now, userId]);
    saveDb();
  } catch {}
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        name: { label: "Name", type: "text" },
      },
      async authorize(credentials) {
        const name = (credentials?.name as string)?.trim();
        if (!name) return null;

        const db = await getDb();

        // Look for existing user by name (case-insensitive)
        const rows = db.exec(
          "SELECT id, email, name FROM users WHERE LOWER(name) = LOWER(?)",
          [name]
        );

        if (rows.length && rows[0].values.length) {
          const [id, email, userName] = rows[0].values[0] as string[];
          const adminRow = db.exec("SELECT is_admin FROM users WHERE id = ?", [id]);
          const isAdmin = adminRow.length && adminRow[0].values.length ? adminRow[0].values[0][0] === 1 : false;
          logAccess(id);
          return { id, email, name: userName, is_admin: isAdmin };
        }

        // Create new user with this name
        const id = crypto.randomUUID();
        const email = `${name.toLowerCase().replace(/\s+/g, ".")}@scope.local`;
        db.run(
          "INSERT INTO users (id, email, name, password_hash) VALUES (?, ?, ?, ?)",
          [id, email, name, "none"]
        );
        saveDb();

        logAccess(id);
        return { id, email, name, is_admin: false };
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
