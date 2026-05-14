import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface User {
    id: string
    email: string
    role: string
    firstName: string
    lastName: string
    specialization: string | null
    accountStatus: string
  }

  interface Session {
    user: {
      id: string
      email: string
      role: string
      firstName: string
      lastName: string
      specialization: string | null
      accountStatus: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
    firstName: string
    lastName: string
    specialization: string | null
    accountStatus: string
  }
}
