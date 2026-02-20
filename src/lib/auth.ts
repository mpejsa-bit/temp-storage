import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { getDb, saveDb } from "@/lib/db";

async function resolveGeo(ip: string): Promise<{ city?: string; region?: string; country?: string }> {
  if (!ip || ip === "unknown" || ip === "127.0.0.1" || ip === "::1") return {};
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=city,regionName,country`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return {};
    const data = await res.json();
    return { city: data.city, region: data.regionName, country: data.country };
  } catch {
    return {};
  }
}

async function logAccess(userId: string, request?: Request) {
  try {
    const db = await getDb();
    const now = new Date().toISOString();

    let ip = "unknown";
    let userAgent = "unknown";
    if (request) {
      ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
        || request.headers.get("x-real-ip")
        || "unknown";
      userAgent = request.headers.get("user-agent") || "unknown";
    }

    const geo = await resolveGeo(ip);

    await db.run(
      `INSERT INTO access_log (id, user_id, action, ip_address, city, region, country, user_agent, created_at)
       VALUES (?, ?, 'login', ?, ?, ?, ?, ?, ?)`,
      [crypto.randomUUID(), userId, ip, geo.city ?? null, geo.region ?? null, geo.country ?? null, userAgent, now]
    );
    await db.run("UPDATE users SET last_login_at = ? WHERE id = ?", [now, userId]);
    saveDb();
  } catch {}
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        name: { label: "Name", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const name = (credentials?.name as string)?.trim();
        if (!name) return null;

        // Admin login requires password
        if (name.toLowerCase() === "admin") {
          const pwd = (credentials?.password as string) || "";
          const adminPwd = process.env.ADMIN_PASSWORD;
          if (!adminPwd || pwd !== adminPwd) return null;
        }

        const db = await getDb();

        // Look for existing user by name (case-insensitive)
        const rows = await db.exec(
          "SELECT id, email, name FROM users WHERE LOWER(name) = LOWER(?)",
          [name]
        );

        if (rows.length && rows[0].values.length) {
          const [id, email, userName] = rows[0].values[0] as string[];
          const adminRow = await db.exec("SELECT is_admin FROM users WHERE id = ?", [id]);
          const isAdmin = adminRow.length && adminRow[0].values.length ? adminRow[0].values[0][0] === 1 : false;
          logAccess(id, request as unknown as Request);
          return { id, email, name: userName, is_admin: isAdmin };
        }

        // Create new user with this name
        const id = crypto.randomUUID();
        const email = `${name.toLowerCase().replace(/\s+/g, ".")}@scope.local`;
        await db.run(
          "INSERT INTO users (id, email, name, password_hash) VALUES (?, ?, ?, ?)",
          [id, email, name, "none"]
        );
        saveDb();

        logAccess(id, request as unknown as Request);
        return { id, email, name, is_admin: false };
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 86400 },
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
