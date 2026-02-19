"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, X, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { ChatService } from "@/services/chat.service"
import { UserService } from "@/services/user.service"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const createChatSchema = z.object({
    name: z.string().optional(),
    type: z.enum(["DIRECT", "GROUP"]),
    participants: z.array(z.string()).min(1, "Select at least one participant"),
})

type CreateChatFormValues = z.infer<typeof createChatSchema>

export function CreateChatDialog({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const queryClient = useQueryClient()

    const form = useForm<CreateChatFormValues>({
        resolver: zodResolver(createChatSchema),
        defaultValues: {
            name: "",
            type: "DIRECT",
            participants: [],
        },
    })

    // Watch type to toggle UI
    const chatType = form.watch("type");

    // Search users query (mock implementation for now - replace with actual search endpoint if available)
    // Assuming UserService.searchUsers exists or finding a way to search. 
    // If searchUsers doesn't exist, we might need to add it or use a known user for test.
    // For now, let's use UserService.getProfile as a hacky way if we type exact username, 
    // or better, implement a search endpoint in backend user module.
    // Wait, the backend has `getProfile(username)` but no search.
    // Let's implement a rudimentary search here if we can't search. 
    // Ideally, we need a search endpoint.
    // Let's assume we can search by username for now with getProfile if typical search doesn't exist.
    // OR just fetch suggestions based on tech stack or followers?
    // Let's add a search method to UserService mock/real.
    // Actually, looking at `user.repository.ts`, there is `findByUsername`.
    // Let's just try to fetch a specific user by username for the demo.

    const { data: searchResults, isLoading: isSearching } = useQuery({
        queryKey: ["search-users", searchQuery],
        queryFn: async () => {
            if (!searchQuery) return [];
            // Try fetching specific profile
            try {
                const profile = await UserService.getProfile(searchQuery);
                return [profile];
            } catch (e) {
                return [];
            }
        },
        enabled: searchQuery.length > 2,
    })

    const createChatMutation = useMutation({
        mutationFn: ChatService.createRoom,
        onSuccess: () => {
            setOpen(false)
            form.reset()
            queryClient.invalidateQueries({ queryKey: ["chat-rooms"] })
            toast.success("Chat created successfully")
        },
        onError: () => {
            toast.error("Failed to create chat")
        },
    })

    function onSubmit(data: CreateChatFormValues) {
        // Validation: Group chat needs name
        if (data.type === "GROUP" && !data.name) {
            form.setError("name", { message: "Group name is required" })
            return
        }
        createChatMutation.mutate(data)
    }

    const toggleParticipant = (userId: string) => {
        const current = form.getValues("participants")
        const isSelected = current.includes(userId)

        if (isSelected) {
            form.setValue("participants", current.filter(id => id !== userId))
        } else {
            if (chatType === "DIRECT") {
                // Direct chat only allows 1 other participant
                form.setValue("participants", [userId])
            } else {
                form.setValue("participants", [...current, userId])
            }
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>New Message</DialogTitle>
                    <DialogDescription>
                        Start a new conversation with a user or group.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem className="space-y-3">
                                    <FormLabel>Chat Type</FormLabel>
                                    <FormControl>
                                        <RadioGroup
                                            onValueChange={(val) => {
                                                field.onChange(val)
                                                form.setValue("participants", []) // Reset participants on type change
                                            }}
                                            defaultValue={field.value}
                                            className="flex space-x-4"
                                        >
                                            <FormItem className="flex items-center space-x-2 space-y-0">
                                                <FormControl>
                                                    <RadioGroupItem value="DIRECT" />
                                                </FormControl>
                                                <Label className="font-normal">Direct Message</Label>
                                            </FormItem>
                                            <FormItem className="flex items-center space-x-2 space-y-0">
                                                <FormControl>
                                                    <RadioGroupItem value="GROUP" />
                                                </FormControl>
                                                <Label className="font-normal">Group Chat</Label>
                                            </FormItem>
                                        </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {chatType === "GROUP" && (
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Group Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Tech Team..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <div className="space-y-2">
                            <Label>Participants</Label>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search users by username..."
                                    className="pl-8"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <ScrollArea className="h-[200px] rounded-md border p-2">
                                {isSearching && <div className="text-sm p-2 text-muted-foreground">Searching...</div>}
                                {searchResults?.map(user => (
                                    <div
                                        key={user.id}
                                        className={cn(
                                            "flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-accent",
                                            form.getValues("participants").includes(user.id) && "bg-accent"
                                        )}
                                        onClick={() => toggleParticipant(user.id)}
                                    >
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={user.avatarUrl || undefined} />
                                            <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">{user.name}</span>
                                            <span className="text-xs text-muted-foreground">@{user.username}</span>
                                        </div>
                                    </div>
                                ))}
                                {!isSearching && (!searchResults || searchResults.length === 0) && (
                                    <div className="text-sm p-4 text-center text-muted-foreground">
                                        {searchQuery.length < 3 ? "Type at least 3 chars to search" : "No users found"}
                                    </div>
                                )}
                            </ScrollArea>
                            {form.formState.errors.participants && (
                                <p className="text-sm font-medium text-destructive">
                                    {form.formState.errors.participants.message}
                                </p>
                            )}
                        </div>

                        <DialogFooter>
                            <Button type="submit" disabled={createChatMutation.isPending}>
                                {createChatMutation.isPending ? "Creating..." : "Create Chat"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
