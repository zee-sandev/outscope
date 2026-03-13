import { prisma } from '@libs/prisma'
import type { User, Session, Organization, Member } from '@generated/prisma'

export type OrganizationWithRole = Organization & { role: string }

export const authRepository = {
  /**
   * Find user by ID
   */
  findUserById: async (userId: string): Promise<User | null> => {
    return prisma.user.findUnique({
      where: { id: userId },
    })
  },

  /**
   * Find session by token
   */
  findSessionByToken: async (token: string): Promise<Session | null> => {
    return prisma.session.findUnique({
      where: { token },
    })
  },

  /**
   * Create organization
   */
  createOrganization: async (
    orgId: string,
    name: string,
    slug: string,
    _ownerId: string
  ): Promise<Organization> => {
    return prisma.organization.create({
      data: {
        id: orgId,
        name,
        slug,
        createdAt: new Date(),
      },
    })
  },

  /**
   * Add user as member to organization
   */
  addUserToOrganization: async (
    userId: string,
    organizationId: string,
    role: string
  ): Promise<Member> => {
    return prisma.member.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        organizationId,
        role,
        createdAt: new Date(),
      },
    })
  },

  /**
   * Update session active organization
   */
  updateSessionOrganization: async (
    sessionId: string,
    organizationId: string
  ): Promise<Session> => {
    return prisma.session.update({
      where: { id: sessionId },
      data: { activeOrganizationId: organizationId },
    })
  },

  /**
   * Get user organizations with roles
   */
  getUserOrganizations: async (userId: string): Promise<OrganizationWithRole[]> => {
    const members = await prisma.member.findMany({
      where: { userId },
      include: {
        organization: true,
      },
    })

    return members.map((member) => ({
      ...member.organization,
      role: member.role,
    }))
  },

  /**
   * Delete session
   */
  deleteSession: async (token: string): Promise<void> => {
    await prisma.session.delete({
      where: { token },
    })
  },
} as const
