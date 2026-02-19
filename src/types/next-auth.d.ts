import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    is_admin?: boolean;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      is_admin: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    is_admin?: boolean;
  }
}
