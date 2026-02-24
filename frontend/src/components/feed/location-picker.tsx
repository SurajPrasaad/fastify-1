"use client"

import * as React from "react"
import { MapPin, Search, X, Loader2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface LocationPickerProps {
    onSelect: (location: string | null) => void
    onClose: () => void
}

export function LocationPicker({ onSelect, onClose }: LocationPickerProps) {
    const [search, setSearch] = React.useState("")
    const [locations, setLocations] = React.useState<string[]>([])
    const [loading, setLoading] = React.useState(false)

    const getCurrentLocation = () => {
        setLoading(true)
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${position.coords.latitude}&lon=${position.coords.longitude}&format=json`)
                    const data = await res.json()
                    const display = data.address.city || data.address.town || data.address.village || data.address.suburb || "Unknown area"
                    onSelect(display)
                    onClose()
                } catch (error) {
                    console.error("Failed to get address:", error)
                    onSelect("Current Location")
                    onClose()
                } finally {
                    setLoading(false)
                }
            }, (error) => {
                console.error("Geolocation error:", error)
                setLoading(false)
            })
        }
    }

    // Mock recent locations or popular ones
    const popularLocations = [
        "San Francisco, CA",
        "New York City, NY",
        "London, UK",
        "Tokyo, JP",
        "Paris, FR",
        "Berlin, DE"
    ]

    return (
        <div className="absolute bottom-full left-0 mb-2 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col z-50 animate-in fade-in slide-in-from-bottom-2">
            <div className="p-3 border-b border-slate-800 flex items-center gap-2">
                <Search className="text-slate-500" size={18} />
                <input
                    autoFocus
                    placeholder="Search for a location"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-slate-500"
                />
                <button onClick={onClose} className="text-slate-500 hover:text-white">
                    <X size={18} />
                </button>
            </div>

            <div className="p-2">
                <button
                    onClick={getCurrentLocation}
                    disabled={loading}
                    className="w-full flex items-center gap-3 p-3 hover:bg-slate-800 rounded-xl transition-colors text-sm text-primary font-medium disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <MapPin size={18} />}
                    Allow location access
                </button>
            </div>

            <ScrollArea className="flex-1 p-2 max-h-48 border-t border-slate-800">
                <div className="flex flex-col gap-1">
                    {popularLocations.filter(loc => loc.toLowerCase().includes(search.toLowerCase())).map((loc) => (
                        <button
                            key={loc}
                            onClick={() => {
                                onSelect(loc)
                                onClose()
                            }}
                            className="text-left p-3 hover:bg-slate-800 rounded-xl transition-colors text-sm"
                        >
                            {loc}
                        </button>
                    ))}
                </div>
            </ScrollArea>
        </div>
    )
}
