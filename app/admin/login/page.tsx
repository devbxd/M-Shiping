import { Logo } from "@/components/Chrome";

export const metadata = { title: "Admin" };

export default async function Login({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  const { e } = await searchParams;
  return (
    <div className="login">
      <form action="/api/admin/login" method="post">
        <Logo />
        <span className="eyebrow">Orders dashboard</span>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" required autoFocus autoComplete="current-password" />
        </div>
        <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14 }}>
          <input type="checkbox" name="remember" defaultChecked style={{ accentColor: "var(--ink)" }} />
          Remember this device for a year
        </label>
        {e && <p className="error">Wrong password.</p>}
        <button className="btn block">Sign in</button>
      </form>
    </div>
  );
}
