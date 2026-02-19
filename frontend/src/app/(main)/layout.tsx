
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"

export default function MainLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex h-screen overflow-hidden bg-background">
            {/* 
        Persistent Sidebar 
        - Collapsible (handled internally)
        - Sticky/Fixed behavior due to flex layout
      */}
            <Sidebar className="hidden md:flex" />

            {/* Main Content Area */}
            <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
                {/* Sticky Header */}
                <Header />

                {/* Page Content */}
                <main className="flex-1 w-full mx-auto p-4 md:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    )
}
