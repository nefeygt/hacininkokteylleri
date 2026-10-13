import { redirect } from "next/navigation";
import { adminSession } from "@/lib/admin";
import AuthCard from "../AuthCard";
import EnrollTotp from "./EnrollTotp";

// First sign-in of an admin: connect an authenticator app (ADR-011).
export default async function EnrollPage() {
  const { state } = await adminSession();
  if (state === "ok") redirect("/");
  if (state === "verify") redirect("/verify");
  if (state !== "enroll") redirect("/login");

  return (
    <AuthCard
      title="İki adımlı doğrulama"
      subtitle="Panele girmek için şifrenin yanında telefonundaki bir doğrulama uygulamasının ürettiği kod da gerekiyor. Bir kez kurman yeterli."
      showSignOut
    >
      <EnrollTotp />
    </AuthCard>
  );
}
