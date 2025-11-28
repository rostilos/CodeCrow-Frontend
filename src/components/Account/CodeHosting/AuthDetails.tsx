
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Key } from "lucide-react";

interface AuthDetailsProps {
  apiKey: string;
  webhookSecret: string;
  onApiKeyChange: (value: string) => void;
  onWebhookSecretChange: (value: string) => void;
}

export default function AuthDetails({ 
  apiKey, 
  webhookSecret, 
  onApiKeyChange, 
  onWebhookSecretChange 
}: AuthDetailsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Key className="h-5 w-5" />
          <span>Authentication</span>
        </CardTitle>
        <CardDescription>
          Configure API keys and credentials
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="apiKey">API Key *</Label>
          <Input
            id="apiKey"
            type="password"
            placeholder="Enter your Bitbucket API key"
            value={apiKey}
            onChange={(e) => onApiKeyChange(e.target.value)}
            required
          />
          <p className="text-sm text-muted-foreground">
            Your Bitbucket API key for repository access
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="webhookSecret">Webhook Secret</Label>
          <Input
            id="webhookSecret"
            type="password"
            placeholder="Optional webhook secret"
            value={webhookSecret}
            onChange={(e) => onWebhookSecretChange(e.target.value)}
          />
          <p className="text-sm text-muted-foreground">
            Secret for webhook verification (optional)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}