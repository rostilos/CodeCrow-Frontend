import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {Button} from "@/components/ui/button.tsx";
import {Input} from "@/components/ui/input.tsx";
import {Label} from "@/components/ui/label.tsx";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar.tsx";
import {Loader2, User} from "lucide-react";
import {useState, useEffect} from "react";
import {useNavigate} from "react-router-dom";
import {useToast} from "@/hooks/use-toast.ts";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import {userDataService} from "@/api_service/user/userDataService.ts";
import {Form,FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form.tsx";

const userDataSchema = z.object({
    username: z.string(),
    email: z.string().email("Invalid email address"),
    company: z.string()
});

type UserDataForm = z.infer<typeof userDataSchema>;

interface CurrentUserData {
    username: string;
    email: string;
    company: string;
}

export default function ProfileInformation() {
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingData, setIsFetchingData] = useState(true);
    const navigate = useNavigate();
    const {toast} = useToast();

    const form = useForm<UserDataForm>({
        resolver: zodResolver(userDataSchema),
        defaultValues: {
            username: "",
            email: "",
            company: ""
        },
    });

    // Fetch current user data
    useEffect(() => {
        const fetchCurrentUserData = async () => {
            try {
                const userData = await userDataService.getCurrentUserData();

                form.reset({
                    username: userData.username || "",
                    email: userData.email || "",
                    company: userData.company || ""
                });

            } catch (error: any) {
                toast({
                    title: "Failed to load user data",
                    description: error.message || "Could not retrieve current user information",
                    variant: "destructive",
                });
            } finally {
                setIsFetchingData(false);
            }
        };

        fetchCurrentUserData();
    }, [form, toast]);

    const onSubmit = async (data: UserDataForm) => {
        setIsLoading(true);
        try {
            const updatedUserData = await userDataService.saveUserData(data as {
                username: string;
                email: string,
                company: string
            });

            form.reset({
                username: updatedUserData.username || "",
                email: updatedUserData.email || "",
                company: updatedUserData.company || ""
            });

            toast({
                title: "User data successfully updated"
            });

        } catch (error: any) {
            toast({
                title: "An error occurred while updating user data.",
                description: error.message || "Invalid data",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (isFetchingData) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2"/>
                    <span>Loading profile information...</span>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5"/>
                    <span>Profile Information</span>
                </CardTitle>
                <CardDescription>
                    Update your personal information and profile details
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                        <div className="flex items-center space-x-4">
                            <Avatar className="h-20 w-20">
                                <AvatarImage src="/placeholder-user.jpg"/>
                                <AvatarFallback className="bg-gradient-primary text-2xl">
                                    {form.watch('username')?.charAt(0)?.toUpperCase() || 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <Button variant="outline" size="sm">Change Photo</Button>
                                <p className="text-sm text-muted-foreground mt-1">
                                    JPG, PNG up to 10MB
                                </p>
                            </div>
                        </div>

                        <FormField
                            control={form.control}
                            name="username"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>Username</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="WildHorse"
                                            type="text"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />


                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="john@example.com"
                                {...form.register("email")}
                            />
                            {form.formState.errors.email && (
                                <p className="text-sm text-red-500">
                                    {form.formState.errors.email.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="company">Company</Label>
                            <Input
                                id="company"
                                placeholder="Acme Corp"
                                {...form.register("company")}
                            />
                            {form.formState.errors.company && (
                                <p className="text-sm text-red-500">
                                    {form.formState.errors.company.message}
                                </p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isLoading}
                            variant="gradient"
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Save Changes
                        </Button>

                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}