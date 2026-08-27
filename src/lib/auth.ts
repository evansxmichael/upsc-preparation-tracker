import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

// Custom error classes for granular client feedback
class PendingApprovalError extends CredentialsSignin {
  code = "PENDING_APPROVAL";
}

class RejectedAccountError extends CredentialsSignin {
  code = "ACCOUNT_REJECTED";
}

class InvalidCredentialsError extends CredentialsSignin {
  code = "INVALID_CREDENTIALS";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new InvalidCredentialsError();
        }

        const email = (credentials.email as string).toLowerCase().trim();
        const user = await db.user.findUnique({
          where: { email },
        });

        // Check if user exists and has a password
        if (!user || !user.password) {
          throw new InvalidCredentialsError();
        }

        // Validate password match
        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) {
          throw new InvalidCredentialsError();
        }

        // Admin Approval Status Checks
        if (user.role !== "ADMIN" && user.status === "PENDING") {
          throw new PendingApprovalError();
        }

        if (user.status === "REJECTED") {
          throw new RejectedAccountError();
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.status = (user as any).status;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = (token.id as string) || (token.sub as string);
        (session.user as any).role = token.role as string;
        (session.user as any).status = token.status as string;
      }
      return session;
    },
  },
});