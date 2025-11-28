import { useState } from "react";
import { Check, ChevronsUpDown, Plus, Building } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useNavigate } from "react-router-dom";

export function WorkspaceSwitcher() {
  const [open, setOpen] = useState(false);
  const { currentWorkspace, workspaces, setCurrentWorkspace } = useWorkspace();
  const navigate = useNavigate();

  const handleWorkspaceSelect = (workspace: any) => {
    setCurrentWorkspace(workspace);
    setOpen(false);
  };

  const handleCreateWorkspace = () => {
    setOpen(false);
    navigate("/workspace");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select workspace"
          className="w-[200px] justify-between"
        >
          <div className="flex items-center space-x-2 text-xs md:text-sm">
            <Building className="h-4 w-4" />
            <span className="truncate">
              {currentWorkspace?.name || "Select workspace"}
            </span>
          </div>
          <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search workspace..." />
          <CommandList>
            <CommandEmpty>No workspace found.</CommandEmpty>
            <CommandGroup heading="Workspaces">
              {workspaces?.map((workspace) => (
                <CommandItem
                  key={workspace.id}
                  value={workspace.name}
                  onSelect={() => handleWorkspaceSelect(workspace)}
                  className="text-sm"
                >
                  <Building className="mr-2 h-4 w-4" />
                  <span className="truncate">{workspace.name}</span>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      currentWorkspace?.id === workspace.id
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem onSelect={handleCreateWorkspace}>
                <Plus className="mr-2 h-4 w-4" />
                Create workspace
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}