import "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      firstName: string
      lastName: string
      roles: string[]
      permissions: string[]
      dataScope: string
      departmentId: string | null
      image?: string | null
    }
  }

  interface User {
    id: string
    email: string
    name: string
    firstName: string
    lastName: string
    roles: string[]
    permissions: string[]
    dataScope: string
    departmentId: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    roles: string[]
    permissions: string[]
    dataScope: string
    firstName: string
    lastName: string
    departmentId: string | null
  }
}
