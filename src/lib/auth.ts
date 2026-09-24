import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import prisma from "@/lib/db"

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "chivon-crm-super-secure-production-secret-key-32chars",
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = credentials.email as string
        const password = credentials.password as string

        const user = await prisma.user.findUnique({
          where: { email },
          include: {
            userRoles: {
              include: {
                role: {
                  include: {
                    rolePermissions: {
                      include: {
                        permission: true,
                      },
                    },
                  },
                },
              },
            },
            department: true,
          },
        })

        if (!user || !user.isActive) {
          return null
        }

        const isPasswordValid = await compare(password, user.passwordHash)

        if (!isPasswordValid) {
          return null
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        })

        // Collect permissions
        const permissions = new Set<string>()
        const roles: string[] = []
        let dataScope = "own"

        for (const ur of user.userRoles) {
          roles.push(ur.role.slug)
          // Use the broadest data scope
          const scopePriority: Record<string, number> = { own: 0, team: 1, department: 2, all: 3 }
          if (scopePriority[ur.role.dataScope] > scopePriority[dataScope]) {
            dataScope = ur.role.dataScope
          }
          for (const rp of ur.role.rolePermissions) {
            permissions.add(rp.permission.slug)
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          firstName: user.firstName,
          lastName: user.lastName,
          roles,
          permissions: Array.from(permissions),
          dataScope,
          departmentId: user.departmentId,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.roles = (user as any).roles
        token.permissions = (user as any).permissions
        token.dataScope = (user as any).dataScope
        token.firstName = (user as any).firstName
        token.lastName = (user as any).lastName
        token.departmentId = (user as any).departmentId
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.roles = token.roles as string[]
        session.user.permissions = token.permissions as string[]
        session.user.dataScope = token.dataScope as string
        session.user.firstName = token.firstName as string
        session.user.lastName = token.lastName as string
        session.user.departmentId = token.departmentId as string | null
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
})
