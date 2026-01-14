import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { organization } from "better-auth/plugins";
import { PrismaClient } from "@generated/prisma";

const prisma = new PrismaClient();

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "sqlite",
  }),
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL!,
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  plugins: [
    organization({
      allowUserToCreateOrganization: async () => {
        // Allow all users to create organizations for now
        // You can add custom logic here later (e.g., subscription checks)
        return true;
      },
      // Automatically set an active organization when creating a session
      async sendInvitationEmail(_data) {
        // TODO: Implement email sending for organization invitations
        // Example: await sendEmail({ to: data.email, subject: "Organization Invitation", ... })
      },
    }),
  ],
  // Database hooks to automatically set active organization on login
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          // Get the user's first organization as default active organization
          const userOrg = await prisma.member.findFirst({
            where: { userId: session.userId },
            orderBy: { createdAt: "asc" },
          });

          if (userOrg) {
            return {
              data: {
                ...session,
                activeOrganizationId: userOrg.organizationId,
              },
            };
          }

          return { data: session };
        },
      },
    },
  },
  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update session every 24 hours
  },
});

export type Auth = typeof auth;
