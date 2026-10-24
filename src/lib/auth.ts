import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcryptjs from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string }
          })

          if (!user) return null


          const isPasswordValid = await bcryptjs.compare(
            credentials.password as string,
            user.passwordHash
          )

          if (!isPasswordValid) return null
          // Reveal state only after valid credentials; no pending/rejected session is issued.
          if (user.accountStatus === 'PENDING') throw new Error('ACCOUNT_PENDING')
          if (user.accountStatus === 'REJECTED') throw new Error(`ACCOUNT_REJECTED:${encodeURIComponent(user.verificationRejectionReason || '')}`)
          if (user.accountStatus !== 'ACTIVE') throw new Error('ACCOUNT_NOT_APPROVED')

          return {
            id: user.id,
            email: user.email,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
            specialization: user.specialization ?? null,
            accountStatus: user.accountStatus
          }
        } catch (error) {
          if (error instanceof Error && (['ACCOUNT_PENDING', 'ACCOUNT_NOT_APPROVED'].includes(error.message) || error.message.startsWith('ACCOUNT_REJECTED:'))) throw error
          console.error('Authentication could not be completed.')
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.firstName = user.firstName
        token.lastName = user.lastName
        token.specialization = user.specialization ?? null
        token.accountStatus = user.accountStatus
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.firstName = token.firstName as string
        session.user.lastName = token.lastName as string
        session.user.specialization = token.specialization as string | null
        session.user.accountStatus = token.accountStatus as string
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
