
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { AuthGuard } from "@/features/auth/components/AuthGuard"

export default function MainLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <AuthGuard>
            <div className="flex h-screen overflow-hidden bg-background">
                <Sidebar className="hidden md:flex" />

                <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
                    <Header />

                    <main className="flex-1 w-full mx-auto p-4 md:p-6 lg:p-8">
                        {children}
                    </main>
                </div>
            </div>
        </AuthGuard>
    )
}
