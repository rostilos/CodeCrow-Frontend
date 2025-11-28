import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { PasswordInput } from "@/components/ui/password-input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Zap, Key, Link, AlertCircle, CheckCircle, Settings, Ticket } from "lucide-react";

export default function TaskSettings() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Zap className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold">Task Management Settings</h1>
      </div>
      
      <Tabs defaultValue="jira" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="jira">Jira</TabsTrigger>
          <TabsTrigger value="asana" disabled>Asana (Coming Soon)</TabsTrigger>
          <TabsTrigger value="trello" disabled>Trello (Coming Soon)</TabsTrigger>
        </TabsList>
        
        <TabsContent value="jira" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Connection Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Link className="h-5 w-5" />
                  <span>Jira Connection</span>
                </CardTitle>
                <CardDescription>
                  Manage your Jira integration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-success" />
                    <span className="font-medium">Connected</span>
                  </div>
                  <Badge className="bg-success text-success-foreground">Active</Badge>
                </div>
                
                <div className="space-y-2">
                  <Label>Jira Instance</Label>
                  <span className="text-sm font-medium">acme-corp.atlassian.net</span>
                </div>
                
                <div className="space-y-2">
                  <Label>Connected User</Label>
                  <span className="text-sm text-muted-foreground">john.doe@acme-corp.com</span>
                </div>
                
                <div className="space-y-2">
                  <Label>Last Sync</Label>
                  <span className="text-sm text-muted-foreground">5 minutes ago</span>
                </div>
                
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">Test Connection</Button>
                  <Button variant="destructive" size="sm">Disconnect</Button>
                </div>
              </CardContent>
            </Card>

            {/* Authentication */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Key className="h-5 w-5" />
                  <span>Authentication</span>
                </CardTitle>
                <CardDescription>
                  Configure API token and permissions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="jiraUrl">Jira URL</Label>
                  <Input 
                    id="jiraUrl" 
                    placeholder="https://your-domain.atlassian.net"
                    value="https://acme-corp.atlassian.net"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="jiraEmail">Email</Label>
                  <Input 
                    id="jiraEmail" 
                    type="email" 
                    placeholder="your-email@domain.com"
                    value="john.doe@acme-corp.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="jiraToken">API Token</Label>
                  <PasswordInput 
                    id="jiraToken" 
                    placeholder="••••••••••••••••"
                  />
                  <p className="text-sm text-muted-foreground">
                    Generate an API token from your Jira account settings
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Read Issues</Label>
                      <p className="text-sm text-muted-foreground">
                        Access to read issue details
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Create Comments</Label>
                      <p className="text-sm text-muted-foreground">
                        Add comments to issues
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Update Status</Label>
                      <p className="text-sm text-muted-foreground">
                        Update issue status
                      </p>
                    </div>
                    <Switch />
                  </div>
                </div>
                
                <Button className="w-full">Update Authentication</Button>
              </CardContent>
            </Card>

            {/* Project Configuration */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Project Configuration</span>
                </CardTitle>
                <CardDescription>
                  Configure project mappings and issue tracking
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="defaultProject">Default Project</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACME">ACME Project</SelectItem>
                        <SelectItem value="DEV">Development</SelectItem>
                        <SelectItem value="QA">Quality Assurance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="issueType">Default Issue Type</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select issue type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bug">Bug</SelectItem>
                        <SelectItem value="task">Task</SelectItem>
                        <SelectItem value="story">Story</SelectItem>
                        <SelectItem value="epic">Epic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <Label className="text-base font-medium">Integration Settings</Label>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Auto-create issues</Label>
                        <p className="text-sm text-muted-foreground">
                          Create Jira issues from code review findings
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Link PR to issues</Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically link pull requests to Jira issues
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Status synchronization</Label>
                        <p className="text-sm text-muted-foreground">
                          Sync issue status with PR status
                        </p>
                      </div>
                      <Switch />
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <Label className="text-base font-medium">Active Projects</Label>
                  
                  <div className="space-y-3">
                    {[
                      { key: "ACME", name: "ACME Project", issues: 23 },
                      { key: "DEV", name: "Development", issues: 45 },
                      { key: "QA", name: "Quality Assurance", issues: 12 },
                    ].map((project) => (
                      <div key={project.key} className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Ticket className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <span className="font-medium">{project.name}</span>
                            <p className="text-sm text-muted-foreground">{project.key}</p>
                          </div>
                          <Badge variant="secondary">{project.issues} issues</Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm">Configure</Button>
                          <Button variant="ghost" size="sm">View Issues</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <Button variant="outline" className="w-full">
                    Add Project
                  </Button>
                </div>
                
                <Button className="w-full">Save Configuration</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="asana">
          <Card>
            <CardContent className="p-12 text-center">
              <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Asana Integration Coming Soon</h3>
              <p className="text-muted-foreground">
                We're working on Asana integration. It will be available in the next update.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="trello">
          <Card>
            <CardContent className="p-12 text-center">
              <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Trello Integration Coming Soon</h3>
              <p className="text-muted-foreground">
                We're working on Trello integration. It will be available in the next update.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}