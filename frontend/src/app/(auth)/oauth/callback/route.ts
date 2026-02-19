
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/dashboard';

    if (!code) {
        // If no code, redirect to login with error
        return NextResponse.redirect(new URL('/login?error=OAuthCallbackError', request.url));
    }

    try {
        // Exchange code for session (Implementation Pending)
        // await exchangeCodeForSession(code);

        // Redirect to next page on success
        return NextResponse.redirect(new URL(next, request.url));
    } catch (error) {
        console.error('OAuth Callback Error:', error);
        return NextResponse.redirect(new URL('/login?error=OAuthCallbackFailed', request.url));
    }
}
