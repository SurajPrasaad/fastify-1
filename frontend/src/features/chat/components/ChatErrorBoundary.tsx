
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCcw } from 'lucide-react';

interface Props {
    children: React.ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ChatErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Chat Error Boundary caught:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-card/10">
                    <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                        <AlertCircle className="h-8 w-8 text-destructive" />
                    </div>
                    <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
                    <p className="text-sm text-muted-foreground mb-6 max-w-md">
                        There was an error loading the chat. This could be due to a connection issue or an internal system error.
                    </p>
                    <Button
                        onClick={() => window.location.reload()}
                        className="gap-2"
                    >
                        <RefreshCcw className="h-4 w-4" />
                        Reload Chat
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}
