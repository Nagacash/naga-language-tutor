import Link from "next/link";
import { AuthPanel } from "@/components/auth-panel";

// Sign-in, sign-up and password recovery pages, rendered by the Neon Auth UI.
export default async function AuthPage({ params }: { params: Promise<{ path: string }> }) {
  const { path } = await params;
  return (
    <main className="auth-page" style={{ maxWidth: 420, margin: "48px auto", padding: "0 16px", textAlign: "center" }}>
      <Link href="/" aria-label="Naga Vox home" style={{ display: "inline-block", marginBottom: 24 }}>
        <img src="/naga-vox-logo.png" alt="Naga Vox" className="brand-logo-img" />
      </Link>
      <AuthPanel path={path} />
    </main>
  );
}
