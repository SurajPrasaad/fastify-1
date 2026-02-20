import { RegisterForm } from "@/features/auth/components/RegisterForm";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Create Account",
    description: "Join our platform today",
};

export default function RegisterPage() {
    return <RegisterForm />;
}
