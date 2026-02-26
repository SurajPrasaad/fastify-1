"use client";

import React, { useEffect, useRef } from "react";
import { useCall } from "../context/CallContext";
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Maximize2, Minimize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const CallModal = () => {
    const {
        status, incomingCall, acceptCall, rejectCall, endCall,
        localStream, remoteStream, isMuted, isCameraOff, toggleMute, toggleCamera
    } = useCall();

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    if (status === "idle") return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
            >
                <div className="relative w-full max-w-4xl aspect-video bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl border border-white/10">

                    {/* Remote Video (Full Screen) */}
                    <div className="absolute inset-0 bg-zinc-800 flex items-center justify-center">
                        {remoteStream ? (
                            <video
                                ref={remoteVideoRef}
                                autoPlay
                                playsInline
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="flex flex-col items-center gap-6">
                                <Avatar className="w-32 h-32 border-4 border-primary/20 bg-zinc-700">
                                    <AvatarImage src={incomingCall?.callerAvatar || ""} />
                                    <AvatarFallback className="text-4xl">
                                        {incomingCall?.callerName?.[0] || "?"}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="text-center space-y-2">
                                    <h2 className="text-3xl font-bold text-white">
                                        {status === "ringing" ? incomingCall?.callerName : "Connecting..."}
                                    </h2>
                                    <p className="text-zinc-400 animate-pulse">
                                        {status === "ringing" ? "Incoming Call" : "Stable connection..."}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Local Video (Picture in Picture) */}
                    {localStream && (
                        <motion.div
                            drag
                            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                            className="absolute top-6 right-6 w-48 aspect-video bg-black rounded-xl overflow-hidden shadow-xl border border-white/20 z-10 cursor-move"
                        >
                            {!isCameraOff ? (
                                <video
                                    ref={localVideoRef}
                                    autoPlay
                                    muted
                                    playsInline
                                    className="w-full h-full object-cover mirror"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                                    <VideoOff className="w-8 h-8 text-zinc-600" />
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Controls Overlay */}
                    <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black/80 to-transparent flex flex-col items-center gap-6">

                        <div className="flex items-center gap-4">
                            {status === "ringing" ? (
                                <>
                                    <Button
                                        size="lg"
                                        variant="destructive"
                                        onClick={rejectCall}
                                        className="h-16 w-16 rounded-full shadow-lg"
                                    >
                                        <PhoneOff className="w-8 h-8" />
                                    </Button>
                                    <Button
                                        size="lg"
                                        onClick={acceptCall}
                                        className="h-16 w-16 rounded-full bg-green-500 hover:bg-green-600 shadow-xl"
                                    >
                                        <Phone className="w-8 h-8 text-white" />
                                    </Button>
                                </>
                            ) : (
                                <div className="flex items-center gap-6 bg-white/5 backdrop-blur-xl p-4 rounded-3xl border border-white/10">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={toggleMute}
                                        className={cn("h-12 w-12 rounded-full", isMuted && "bg-destructive/20 text-destructive")}
                                    >
                                        {isMuted ? <MicOff /> : <Mic />}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={toggleCamera}
                                        className={cn("h-12 w-12 rounded-full", isCameraOff && "bg-destructive/20 text-destructive")}
                                    >
                                        {isCameraOff ? <VideoOff /> : <Video />}
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        onClick={endCall}
                                        className="h-14 w-14 rounded-full shadow-lg"
                                    >
                                        <PhoneOff className="w-7 h-7" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
