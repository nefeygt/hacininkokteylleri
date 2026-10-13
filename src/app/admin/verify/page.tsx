import { redirect } from "next/navigation";
import { adminSession } from "@/lib/admin";
import AuthCard from "../AuthCard";
import VerifyForm from "./VerifyForm";

// Every sign-in after the first: the code from the authenticator app (ADR-011).
export default async function VerifyPage() {
  const { state } = await adminSession();
  if (state === "ok") redirect("/");
  if (state === "enroll") redirect("/setup-2fa");
  if (state !== "verify") redirect("/login");

  return (
    <AuthCard
      title="Doğrulama kodu"
      subtitle="Telefonundaki doğrulama uygulamasında haci (eski kurulumlarda Hacı'nın Kokteylleri) için görünen kodu gir."
      showSignOut
    >
      <VerifyForm />
    </AuthCard>
  );
}
