import { withAuth } from "next-auth/middleware"

export default withAuth({
  pages: {
    signIn: "/login",
  },
})

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/deudas",
    "/deudas/:path*",
    "/ingresos",
    "/ingresos/:path*",
    "/gastos",
    "/gastos/:path*",
    "/calendario",
    "/calendario/:path*",
    "/metas",
    "/metas/:path*",
    "/reportes",
    "/reportes/:path*",
    "/configuracion",
    "/configuracion/:path*",
  ],
}
