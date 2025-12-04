import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Server, Shield, AlertTriangle, CheckCircle2, ExternalLink } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function SMTPSetup() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">SMTP Setup</h1>
            <p className="text-muted-foreground mt-1">
              Configure email delivery for Two-Factor Authentication
            </p>
          </div>
        </div>
      </div>

      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
          <CardDescription>
            Why SMTP configuration is required
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            CodeCrow requires SMTP configuration to send emails for Two-Factor Authentication (2FA) via email. 
            When users enable 2FA, verification codes are sent to their registered email address.
          </p>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Important</AlertTitle>
            <AlertDescription>
              Without proper SMTP configuration, users will not be able to use email-based 2FA. 
              Make sure to test your configuration before enabling 2FA features in production.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Quick Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-primary" />
            <CardTitle>Quick Configuration</CardTitle>
          </div>
          <CardDescription>
            Add these properties to your application.properties file
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
            <pre className="text-xs">{`# SMTP Configuration
spring.mail.host=smtp.example.com
spring.mail.port=587
spring.mail.username=your-email@example.com
spring.mail.password=your-app-password

# TLS Settings (recommended)
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
spring.mail.properties.mail.smtp.starttls.required=true

# Optional: Connection timeouts
spring.mail.properties.mail.smtp.connectiontimeout=5000
spring.mail.properties.mail.smtp.timeout=5000
spring.mail.properties.mail.smtp.writetimeout=5000

# Frontend URL (for email templates)
codecrow.frontend.url=https://your-frontend-domain.com`}</pre>
          </div>

          <div className="grid gap-3">
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">host</Badge>
              <span className="text-sm text-muted-foreground">SMTP server hostname (e.g., smtp.gmail.com)</span>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">port</Badge>
              <span className="text-sm text-muted-foreground">SMTP port (587 for TLS, 465 for SSL, 25 for plain)</span>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">username</Badge>
              <span className="text-sm text-muted-foreground">Email address or username for authentication</span>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">password</Badge>
              <span className="text-sm text-muted-foreground">Password or app-specific password</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Provider Guides */}
      <Card>
        <CardHeader>
          <CardTitle>Provider Configuration Guides</CardTitle>
          <CardDescription>
            Step-by-step setup for popular email providers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="gmail" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4 h-auto">
              <TabsTrigger value="gmail" className="py-2">Gmail</TabsTrigger>
              <TabsTrigger value="ses" className="py-2">Amazon SES</TabsTrigger>
              <TabsTrigger value="sendgrid" className="py-2">SendGrid</TabsTrigger>
              <TabsTrigger value="mailgun" className="py-2">Mailgun</TabsTrigger>
            </TabsList>

            {/* Gmail */}
            <TabsContent value="gmail" className="space-y-4">
              <div className="space-y-3">
                <h3 className="font-semibold">Gmail / Google Workspace</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Enable 2-Step Verification on your Google Account</li>
                  <li>Generate an App Password at <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">Google App Passwords <ExternalLink className="h-3 w-3" /></a></li>
                  <li>Use the generated 16-character password in your configuration</li>
                </ol>
                <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <pre className="text-xs">{`spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your-email@gmail.com
spring.mail.password=xxxx-xxxx-xxxx-xxxx  # App Password
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true`}</pre>
                </div>
              </div>
            </TabsContent>

            {/* Amazon SES */}
            <TabsContent value="ses" className="space-y-4">
              <div className="space-y-3">
                <h3 className="font-semibold">Amazon Simple Email Service (SES)</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Create SMTP credentials in the AWS SES Console</li>
                  <li>Verify your sender email address or domain</li>
                  <li>Request production access if needed (sandbox mode has limitations)</li>
                </ol>
                <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <pre className="text-xs">{`spring.mail.host=email-smtp.us-east-1.amazonaws.com  # Use your region
spring.mail.port=587
spring.mail.username=YOUR_SES_SMTP_USERNAME
spring.mail.password=YOUR_SES_SMTP_PASSWORD
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true`}</pre>
                </div>
              </div>
            </TabsContent>

            {/* SendGrid */}
            <TabsContent value="sendgrid" className="space-y-4">
              <div className="space-y-3">
                <h3 className="font-semibold">SendGrid</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Create an API key with Mail Send permissions</li>
                  <li>Verify your sender identity (email or domain)</li>
                  <li>Use "apikey" as the username and your API key as the password</li>
                </ol>
                <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <pre className="text-xs">{`spring.mail.host=smtp.sendgrid.net
spring.mail.port=587
spring.mail.username=apikey
spring.mail.password=SG.xxxxxxxxxxxxxxxxxxxx  # Your API Key
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true`}</pre>
                </div>
              </div>
            </TabsContent>

            {/* Mailgun */}
            <TabsContent value="mailgun" className="space-y-4">
              <div className="space-y-3">
                <h3 className="font-semibold">Mailgun</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Add and verify your domain in Mailgun</li>
                  <li>Get SMTP credentials from the Domain Settings</li>
                  <li>Use the provided SMTP username and password</li>
                </ol>
                <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <pre className="text-xs">{`spring.mail.host=smtp.mailgun.org
spring.mail.port=587
spring.mail.username=postmaster@your-domain.mailgun.org
spring.mail.password=your-mailgun-smtp-password
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true`}</pre>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Security Best Practices */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>Security Best Practices</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium">Use Environment Variables</span>
                <p className="text-sm text-muted-foreground">Never commit SMTP credentials to version control. Use environment variables or secrets management.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium">Enable TLS/SSL</span>
                <p className="text-sm text-muted-foreground">Always use encrypted connections (port 587 with STARTTLS or port 465 with SSL).</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium">Use App-Specific Passwords</span>
                <p className="text-sm text-muted-foreground">For services like Gmail, use app passwords instead of your main account password.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium">Restrict Sender Address</span>
                <p className="text-sm text-muted-foreground">Configure SPF, DKIM, and DMARC records for your sending domain to prevent spoofing.</p>
              </div>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Testing */}
      <Card>
        <CardHeader>
          <CardTitle>Testing Your Configuration</CardTitle>
          <CardDescription>
            Verify that emails are being sent correctly
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            After configuring SMTP, you can test email delivery by:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Starting the CodeCrow web-server with your SMTP configuration</li>
            <li>Creating a test user account or using an existing one</li>
            <li>Navigating to User Settings → Security → Two-Factor Authentication</li>
            <li>Enabling email-based 2FA to trigger a verification email</li>
            <li>Checking the server logs for any email delivery errors</li>
          </ol>
          
          <Alert variant="default">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Tip</AlertTitle>
            <AlertDescription>
              Check server logs for detailed error messages if emails are not being delivered. 
              Common issues include incorrect credentials, blocked ports, or unverified sender addresses.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Troubleshooting */}
      <Card>
        <CardHeader>
          <CardTitle>Troubleshooting</CardTitle>
          <CardDescription>
            Common issues and solutions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-l-2 border-destructive pl-4">
              <h4 className="font-medium">Authentication Failed</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Verify your username and password. For Gmail, ensure you're using an App Password, not your regular password.
              </p>
            </div>
            <div className="border-l-2 border-destructive pl-4">
              <h4 className="font-medium">Connection Timeout</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Check if outbound SMTP ports (587, 465, 25) are blocked by your firewall or cloud provider.
              </p>
            </div>
            <div className="border-l-2 border-destructive pl-4">
              <h4 className="font-medium">Emails Not Received</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Check spam folders. Verify sender domain has proper SPF/DKIM records. For SES, ensure you're out of sandbox mode.
              </p>
            </div>
            <div className="border-l-2 border-destructive pl-4">
              <h4 className="font-medium">TLS Handshake Error</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Ensure your Java runtime has up-to-date certificates. Try using port 465 with SSL instead of 587 with STARTTLS.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
