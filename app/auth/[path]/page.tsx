import { AuthPanel } from "@/components/auth-panel";

// Sign-in, sign-up and password recovery pages, rendered by the Neon Auth UI.
export default async function AuthPage({ params }: { params: Promise<{ path: string }> }) {
  const { path } = await params;
  return (
    <main style={{ maxWidth: 420, margin: "48px auto", padding: "0 16px" }}>
      <AuthPanel path={path} />
    </main>
  );
}
