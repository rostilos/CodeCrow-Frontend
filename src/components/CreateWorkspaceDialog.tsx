import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/context/WorkspaceContext";
import {
    workspaceService,
    CreateWorkspaceRequest,
} from "@/api_service/workspace/workspaceService";
import { useToast } from "@/hooks/use-toast";
import { ROUTES } from "@/lib/routes";

interface CreateWorkspaceDialogProps {
    onSuccess?: () => void;
    onCancel: () => void;
    idSuffix?: string;
}

export function CreateWorkspaceDialog({ onSuccess, onCancel, idSuffix = "" }: CreateWorkspaceDialogProps) {
    const navigate = useNavigate();
    const { refreshWorkspaces, setCurrentWorkspace } = useWorkspace();
    const { toast } = useToast();

    const [createLoading, setCreateLoading] = useState(false);
    const [newWorkspace, setNewWorkspace] = useState<CreateWorkspaceRequest>({
        slug: "",
        name: "",
        description: "",
    });
    const [slugError, setSlugError] = useState<string>("");

    const validateSlug = (slug: string): boolean => {
        const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
        if (!slug.trim()) {
            setSlugError("Workspace slug is required");
            return false;
        }
        if (slug.length < 3 || slug.length > 64) {
            setSlugError("Slug must be between 3 and 64 characters");
            return false;
        }
        if (!slugPattern.test(slug)) {
            setSlugError(
                "Slug must contain only lowercase letters, numbers, and hyphens"
            );
            return false;
        }
        setSlugError("");
        return true;
    };

    const handleCreateWorkspace = async () => {
        if (!newWorkspace.slug.trim() || !validateSlug(newWorkspace.slug)) {
            toast({
                title: "Validation Error",
                description: slugError || "Workspace slug is required",
                variant: "destructive",
            });
            return;
        }
        if (!newWorkspace.name.trim()) {
            toast({
                title: "Validation Error",
                description: "Workspace name is required",
                variant: "destructive",
            });
            return;
        }

        try {
            setCreateLoading(true);
            const created = await workspaceService.createWorkspace(newWorkspace);
            await refreshWorkspaces();
            setCurrentWorkspace(created);

            setNewWorkspace({ slug: "", name: "", description: "" });
            setSlugError("");
            toast({
                title: "Success",
                description: "Workspace created successfully",
            });

            if (onSuccess) {
                onSuccess();
            }

            navigate(ROUTES.PROJECTS(created.slug));
        } catch (error: any) {
            toast({
                title: "Failed to create workspace",
                description: error.message || "Could not create workspace",
                variant: "destructive",
            });
        } finally {
            setCreateLoading(false);
        }
    };

    return (
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Create New Workspace</DialogTitle>
                <DialogDescription>
                    Set up a workspace for your team and projects
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor={`workspace-slug${idSuffix}`}>Workspace Slug</Label>
                    <Input
                        id={`workspace-slug${idSuffix}`}
                        value={newWorkspace.slug}
                        onChange={(e) => {
                            setNewWorkspace({
                                ...newWorkspace,
                                slug: e.target.value.toLowerCase(),
                            });
                            if (e.target.value) validateSlug(e.target.value.toLowerCase());
                        }}
                        placeholder="my-workspace"
                        className={slugError ? "border-destructive" : ""}
                    />
                    {slugError && <p className="text-sm text-destructive">{slugError}</p>}
                    <p className="text-xs text-muted-foreground">
                        Lowercase letters, numbers, and hyphens only (3-64 chars)
                    </p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor={`workspace-name${idSuffix}`}>Workspace Name</Label>
                    <Input
                        id={`workspace-name${idSuffix}`}
                        value={newWorkspace.name}
                        onChange={(e) =>
                            setNewWorkspace({ ...newWorkspace, name: e.target.value })
                        }
                        placeholder="My Workspace"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor={`workspace-description${idSuffix}`}>
                        Description (Optional)
                    </Label>
                    <Textarea
                        id={`workspace-description${idSuffix}`}
                        value={newWorkspace.description}
                        onChange={(e) =>
                            setNewWorkspace({ ...newWorkspace, description: e.target.value })
                        }
                        placeholder="What is this workspace for?"
                        rows={3}
                    />
                </div>
            </div>
            <div className="flex gap-3">
                <Button
                    variant="outline"
                    onClick={onCancel}
                    className="flex-1"
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleCreateWorkspace}
                    disabled={createLoading}
                    className="flex-1"
                >
                    {createLoading ? "Creating..." : "Create"}
                </Button>
            </div>
        </DialogContent>
    );
}
