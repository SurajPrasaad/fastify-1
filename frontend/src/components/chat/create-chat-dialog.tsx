"use client"

import { useState, useEffect } from "react"
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

    const [debouncedSearch, setDebouncedSearch] = useState("")

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery)
        }, 500)
        return () => clearTimeout(timer)
    }, [searchQuery])

    const { data: searchResults, isLoading: isSearching } = useQuery({
        queryKey: ["search-users", debouncedSearch],
        queryFn: async () => {
            if (!debouncedSearch) return [];
            // Try fetching specific profile
            try {
                const profile = await UserService.getProfile(debouncedSearch);
                return [profile];
            } catch (e) {
                return [];
            }
        },
        enabled: debouncedSearch.length > 2,
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
            <DialogContent className="w-[95vw] max-h-[90dvh] overflow-y-auto custom-scrollbar sm:max-w-[480px] p-0 border-none bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl rounded-3xl">
                <DialogHeader className="p-5 sm:p-8 pb-0 pt-6">
                    <DialogTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-br from-slate-900 to-slate-500 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
                        New Message
                    </DialogTitle>
                    <DialogDescription className="text-slate-500 dark:text-slate-400">
                        Start a new conversation with a user or group.
                    </DialogDescription>
                </DialogHeader>

                <div className="p-5 sm:p-8 pt-4 sm:pt-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 sm:space-y-8">
                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <FormLabel className="text-xs font-bold uppercase tracking-widest text-slate-400">Chat Type</FormLabel>
                                            <FormMessage />
                                        </div>
                                        <FormControl>
                                            <RadioGroup
                                                onValueChange={(val) => {
                                                    field.onChange(val)
                                                    form.setValue("participants", [])
                                                }}
                                                defaultValue={field.value}
                                                className="grid grid-cols-2 gap-4"
                                            >
                                                <div className="relative">
                                                    <RadioGroupItem value="DIRECT" id="direct" className="peer sr-only" />
                                                    <Label
                                                        htmlFor="direct"
                                                        className="flex flex-col items-center justify-between rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 hover:bg-slate-50 dark:hover:bg-slate-900 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 transition-all cursor-pointer group"
                                                    >
                                                        <span className="material-symbols-outlined text-3xl mb-2 text-slate-400 group-hover:text-primary group-data-[state=checked]:text-primary transition-colors">person</span>
                                                        <span className="text-sm font-bold tracking-tight">Direct</span>
                                                    </Label>
                                                </div>
                                                <div className="relative">
                                                    <RadioGroupItem value="GROUP" id="group" className="peer sr-only" />
                                                    <Label
                                                        htmlFor="group"
                                                        className="flex flex-col items-center justify-between rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 hover:bg-slate-50 dark:hover:bg-slate-900 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 transition-all cursor-pointer group"
                                                    >
                                                        <span className="material-symbols-outlined text-3xl mb-2 text-slate-400 group-hover:text-primary group-data-[state=checked]:text-primary transition-colors">groups</span>
                                                        <span className="text-sm font-bold tracking-tight">Group</span>
                                                    </Label>
                                                </div>
                                            </RadioGroup>
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            {chatType === "GROUP" && (
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem className="space-y-2">
                                            <FormLabel className="text-xs font-bold uppercase tracking-widest text-slate-400">Group Name</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Enter group name..."
                                                    className="h-12 rounded-xl bg-slate-100/50 dark:bg-slate-800/50 border-none px-4 focus-visible:ring-primary/30"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            <div className="space-y-4">
                                <FormLabel className="text-xs font-bold uppercase tracking-widest text-slate-400">Search Participants</FormLabel>
                                <div className="group/search relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 transition-colors group-focus-within/search:text-primary" />
                                    <Input
                                        placeholder="Search by username..."
                                        className="h-12 pl-11 rounded-xl bg-slate-100/50 dark:bg-slate-800/50 border-none focus-visible:ring-primary/30"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>

                                <ScrollArea className="h-[200px] sm:h-[240px] rounded-2xl bg-slate-100/30 dark:bg-slate-800/10 p-2 overflow-hidden">
                                    {isSearching && (
                                        <div className="flex flex-col items-center justify-center h-full p-8 space-y-3 opacity-50">
                                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                            <span className="text-xs font-medium">Searching users...</span>
                                        </div>
                                    )}
                                    <div className="space-y-1">
                                        {searchResults?.map(user => {
                                            const isSelected = form.getValues("participants").includes(user.id);
                                            return (
                                                <div
                                                    key={user.id}
                                                    className={cn(
                                                        "group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all",
                                                        isSelected
                                                            ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[0.99]"
                                                            : "hover:bg-white dark:hover:bg-slate-800"
                                                    )}
                                                    onClick={() => toggleParticipant(user.id)}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-10 w-10 border-2 border-transparent group-hover:border-primary/20 transition-all">
                                                            <AvatarImage src={user.avatarUrl || undefined} />
                                                            <AvatarFallback className={cn(isSelected ? "bg-white/20" : "bg-primary/10 text-primary")}>
                                                                {user.username[0].toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold">{user.name}</span>
                                                            <span className={cn("text-xs", isSelected ? "text-white/70" : "text-slate-500")}>@{user.username}</span>
                                                        </div>
                                                    </div>
                                                    {isSelected && (
                                                        <span className="material-symbols-outlined text-xl">check_circle</span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                        {!isSearching && (!searchResults || searchResults.length === 0) && (
                                            <div className="flex flex-col items-center justify-center h-full py-12 px-4 space-y-4 opacity-40">
                                                <span className="material-symbols-outlined text-4xl">search_off</span>
                                                <p className="text-xs font-medium text-center">
                                                    {searchQuery.length < 3 ? "Type at least 3 characters to search for users" : "We couldn't find any users with that name"}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                                {form.formState.errors.participants && (
                                    <p className="text-sm font-medium text-destructive">
                                        {form.formState.errors.participants.message}
                                    </p>
                                )}
                            </div>

                            <DialogFooter className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                <Button
                                    type="submit"
                                    size="lg"
                                    disabled={createChatMutation.isPending}
                                    className="w-full h-14 rounded-2xl bg-gradient-to-r from-primary to-primary/80 hover:scale-[1.02] active:scale-[0.98] transition-all font-bold shadow-xl shadow-primary/20"
                                >
                                    {createChatMutation.isPending ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            <span>Creating Chat...</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined">send</span>
                                            <span>Create Conversation</span>
                                        </div>
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    )
}
