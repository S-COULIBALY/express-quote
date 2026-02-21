import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// Administrateurs avec mots de passe hachés (bcrypt)
// Pour changer le mot de passe : node -e "require('bcryptjs').hash('nouveau-mdp', 12).then(console.log)"
const ADMIN_USERS = [
  {
    id: "admin-1",
    name: "Admin",
    email: process.env.ADMIN_EMAIL || "admin@express-quote.com",
    passwordHash:
      process.env.ADMIN_PASSWORD_HASH ||
      "$2b$12$qt/nlniihlY1EyAIX67dTOyaWnZTSkSsllFtXl9IPmOsh/Q1esKl6",
    role: "ADMIN",
  },
];

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Vérifier les administrateurs (mot de passe haché bcrypt)
          const adminCandidate = ADMIN_USERS.find(
            (user) => user.email === credentials.email,
          );

          if (
            adminCandidate &&
            (await bcrypt.compare(
              credentials.password,
              adminCandidate.passwordHash,
            ))
          ) {
            const adminUser = adminCandidate;
            return {
              id: adminUser.id,
              name: adminUser.name,
              email: adminUser.email,
              role: adminUser.role,
            };
          }

          // Vérifier les professionnels externes
          const professional = await prisma.professional.findUnique({
            where: {
              email: credentials.email,
            },
            select: {
              id: true,
              companyName: true,
              email: true,
              password: true,
              verified: true,
            },
          });

          if (professional && professional.verified && professional.password) {
            // Vérifier le mot de passe haché avec bcrypt
            const isPasswordValid = await bcrypt.compare(
              credentials.password,
              professional.password,
            );
            if (isPasswordValid) {
              return {
                id: professional.id,
                name: professional.companyName,
                email: professional.email,
                role: "EXTERNAL_PROFESSIONAL",
              };
            }
          }

          // Vérifier le staff interne
          const internalStaff = await prisma.internal_staff.findUnique({
            where: {
              email: credentials.email,
            },
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
              password: true,
              role: true,
              is_active: true,
            },
          });

          if (
            internalStaff &&
            internalStaff.is_active &&
            internalStaff.password
          ) {
            // Vérifier le mot de passe haché avec bcrypt
            const isPasswordValid = await bcrypt.compare(
              credentials.password,
              internalStaff.password,
            );
            if (isPasswordValid) {
              return {
                id: internalStaff.id,
                name: `${internalStaff.first_name} ${internalStaff.last_name}`,
                email: internalStaff.email,
                role: internalStaff.role,
              };
            }
          }

          return null;
        } catch (error) {
          console.error("Erreur d'authentification:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
};

// Augmenter la définition des types pour inclure nos champs personnalisés
declare module "next-auth" {
  interface User {
    id: string;
    role: string;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
  }
}

export default authOptions;
