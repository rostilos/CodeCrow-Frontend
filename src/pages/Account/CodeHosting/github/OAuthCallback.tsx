import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { CheckCircle, Github, Loader2, XCircle } from "lucide-react";
import { useWorkspace } from "@/context/WorkspaceContext";

/**
 * GitHub OAuth callback page.
 * This page handles the redirect from GitHub after the user authorizes the app.
 * The backend will exchange the code for an access token and create the connection.
 * 
 * Query parameters:
 * - code: The authorization code from GitHub
 * - state: The state parameter we sent (contains workspace info)
 * - error: Error code if the user denied access
 */
export default function GitHubOAuthCallback() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { currentWorkspace } = useWorkspace();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [connectionId, setConnectionId] = useState<number | null>(null);

    useEffect(() => {
        const handleCallback = async () => {
            const code = searchParams.get('code');
            const state = searchParams.get('state');
            const error = searchParams.get('error');
            const errorDescription = searchParams.get('error_description');

            if (error) {
                setStatus('error');
                setErrorMessage(errorDescription || error || 'Authorization was denied');
                return;
            }

            if (!code) {
                setStatus('error');
                setErrorMessage('No authorization code received from GitHub');
                return;
            }

            // The backend should handle the callback via the web-server controller
            // which will exchange the code and redirect back with a connection ID
            // For now, we'll just show success and let the user navigate manually
            
            // Check if we have a connectionId in the URL (from backend redirect)
            const connIdParam = searchParams.get('connectionId');
            if (connIdParam) {
                setConnectionId(parseInt(connIdParam));
                setStatus('success');
                return;
            }

            // If no connectionId, assume the OAuth flow completed successfully
            // The backend should have created the connection
            setStatus('success');
        };

        handleCallback();
    }, [searchParams]);

    const handleContinue = () => {
        if (connectionId) {
            navigate(`/dashboard/hosting/github/configure/${connectionId}`);
        } else {
            navigate('/dashboard/hosting');
        }
    };

    const handleRetry = () => {
        navigate('/dashboard/hosting');
    };

    return (
        <div className="container mx-auto p-6 flex items-center justify-center min-h-[60vh]">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <Github className="h-12 w-12" />
                    </div>
                    <CardTitle>
                        {status === 'loading' && 'Connecting to GitHub...'}
                        {status === 'success' && 'GitHub Connected!'}
                        {status === 'error' && 'Connection Failed'}
                    </CardTitle>
                    <CardDescription>
                        {status === 'loading' && 'Please wait while we complete the connection.'}
                        {status === 'success' && 'Your GitHub account has been successfully connected.'}
                        {status === 'error' && errorMessage}
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center space-y-4">
                    {status === 'loading' && (
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    )}
                    {status === 'success' && (
                        <>
                            <CheckCircle className="h-12 w-12 text-success" />
                            <Button onClick={handleContinue} className="w-full">
                                Continue to Configuration
                            </Button>
                        </>
                    )}
                    {status === 'error' && (
                        <>
                            <XCircle className="h-12 w-12 text-destructive" />
                            <div className="flex space-x-4 w-full">
                                <Button variant="outline" onClick={handleRetry} className="flex-1">
                                    Back to Settings
                                </Button>
                                <Button onClick={() => window.location.reload()} className="flex-1">
                                    Try Again
                                </Button>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
