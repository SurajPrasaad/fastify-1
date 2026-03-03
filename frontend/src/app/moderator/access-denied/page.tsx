"use client";

import Link from "next/link";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function ModeratorAccessDeniedPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="w-full max-w-md border-border bg-card">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <ShieldX className="h-6 w-6 text-destructive" aria-hidden />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Access Denied</h1>
          <p className="text-sm text-muted-foreground">
            You don&apos;t have permission to view this section. Contact your administrator if you believe this is an error.
          </p>
        </CardHeader>
        <CardContent className="flex justify-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/moderator">Back to Moderator Dashboard</Link>
          </Button>
          <Button asChild>
            <Link href="/">Go to Home</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
