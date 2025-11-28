import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Progress } from "@/components/ui/progress.tsx";
import { CreditCard, Crown, Zap, Shield, Users, Check, X } from "lucide-react";

export default function BillingSettings() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <CreditCard className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold">Plan & Billing</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Plan */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Crown className="h-5 w-5 text-primary" />
              <span>Current Plan</span>
            </CardTitle>
            <CardDescription>
              Your current subscription and usage details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">Professional Plan</h3>
                <p className="text-muted-foreground">Perfect for growing teams</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">$49</p>
                <p className="text-sm text-muted-foreground">per month</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>API Requests</span>
                  <span>8,742 / 10,000</span>
                </div>
                <Progress value={87} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Repositories</span>
                  <span>12 / 25</span>
                </div>
                <Progress value={48} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Team Members</span>
                  <span>5 / 10</span>
                </div>
                <Progress value={50} className="h-2" />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Next billing date</p>
                <p className="font-medium">February 15, 2024</p>
              </div>
              <Badge className="bg-success text-success-foreground">Auto-renewal On</Badge>
            </div>
            
            <div className="flex space-x-2">
              <Button variant="outline" className="flex-1">
                Manage Subscription
              </Button>
              <Button className="flex-1">
                Upgrade Plan
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Billing History */}
        <Card>
          <CardHeader>
            <CardTitle>Billing History</CardTitle>
            <CardDescription>
              Recent payments and invoices
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { date: "Jan 15, 2024", amount: "$49.00", status: "Paid" },
              { date: "Dec 15, 2023", amount: "$49.00", status: "Paid" },
              { date: "Nov 15, 2023", amount: "$49.00", status: "Paid" },
              { date: "Oct 15, 2023", amount: "$29.00", status: "Paid" },
            ].map((invoice, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div>
                  <p className="font-medium">{invoice.amount}</p>
                  <p className="text-sm text-muted-foreground">{invoice.date}</p>
                </div>
                <div className="text-right">
                  <Badge variant="secondary">{invoice.status}</Badge>
                </div>
              </div>
            ))}
            
            <Button variant="outline" className="w-full">
              View All Invoices
            </Button>
          </CardContent>
        </Card>
      </div>
      
      {/* Plans Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Available Plans</CardTitle>
          <CardDescription>
            Choose the plan that best fits your needs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Starter Plan */}
            <div className="border border-border rounded-lg p-6 relative">
              <div className="text-center mb-6">
                <Zap className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold">Starter</h3>
                <p className="text-muted-foreground">For individual developers</p>
                <div className="mt-4">
                  <span className="text-3xl font-bold">$19</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </div>
              
              <ul className="space-y-3 mb-6">
                <li className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-success" />
                  <span className="text-sm">5,000 API requests</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-success" />
                  <span className="text-sm">5 repositories</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-success" />
                  <span className="text-sm">2 team members</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-success" />
                  <span className="text-sm">Basic integrations</span>
                </li>
                <li className="flex items-center space-x-2">
                  <X className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Priority support</span>
                </li>
              </ul>
              
              <Button variant="outline" className="w-full">
                Select Plan
              </Button>
            </div>

            {/* Professional Plan */}
            <div className="border-2 border-primary rounded-lg p-6 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground">Current Plan</Badge>
              </div>
              
              <div className="text-center mb-6">
                <Crown className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold">Professional</h3>
                <p className="text-muted-foreground">For growing teams</p>
                <div className="mt-4">
                  <span className="text-3xl font-bold">$49</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </div>
              
              <ul className="space-y-3 mb-6">
                <li className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-success" />
                  <span className="text-sm">10,000 API requests</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-success" />
                  <span className="text-sm">25 repositories</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-success" />
                  <span className="text-sm">10 team members</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-success" />
                  <span className="text-sm">All integrations</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-success" />
                  <span className="text-sm">Priority support</span>
                </li>
              </ul>
              
              <Button variant="gradient" className="w-full">
                Current Plan
              </Button>
            </div>

            {/* Enterprise Plan */}
            <div className="border border-border rounded-lg p-6 relative">
              <div className="text-center mb-6">
                <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold">Enterprise</h3>
                <p className="text-muted-foreground">For large organizations</p>
                <div className="mt-4">
                  <span className="text-3xl font-bold">$99</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </div>
              
              <ul className="space-y-3 mb-6">
                <li className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-success" />
                  <span className="text-sm">Unlimited API requests</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-success" />
                  <span className="text-sm">Unlimited repositories</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-success" />
                  <span className="text-sm">Unlimited team members</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-success" />
                  <span className="text-sm">Custom integrations</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-success" />
                  <span className="text-sm">Dedicated support</span>
                </li>
              </ul>
              
              <Button variant="outline" className="w-full">
                Upgrade to Enterprise
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Payment Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
            <CardDescription>
              Manage your payment information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border border-border rounded-lg">
              <div className="flex items-center space-x-3">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">**** **** **** 4242</p>
                  <p className="text-sm text-muted-foreground">Expires 12/2025</p>
                </div>
              </div>
              <Badge>Default</Badge>
            </div>
            
            <div className="flex space-x-2">
              <Button variant="outline" className="flex-1">
                Update Payment Method
              </Button>
              <Button variant="outline" className="flex-1">
                Add New Card
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Billing Settings</CardTitle>
            <CardDescription>
              Configure your billing preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-renewal</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically renew subscription
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email receipts</Label>
                <p className="text-sm text-muted-foreground">
                  Send receipts to your email
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Usage alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Alert when approaching limits
                </p>
              </div>
              <Switch />
            </div>
            
            <Button className="w-full">
              Save Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}