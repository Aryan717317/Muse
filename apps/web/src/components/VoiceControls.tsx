'use client';

import { memo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Phone, PhoneOff, Users } from 'lucide-react';
import { useVoiceChat } from '@/hooks/useVoiceChat';

interface VoiceControlsProps {
    className?: string;
}

export const VoiceControls = memo(function VoiceControls({ className = '' }: VoiceControlsProps) {
    const { 
        voiceEnabled, 
        isMuted, 
        voicePeers,
        enableVoice, 
        disableVoice, 
        toggleMute 
    } = useVoiceChat();
    
    const [isEnabling, setIsEnabling] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleToggleVoice = useCallback(async () => {
        setError(null);
        
        if (voiceEnabled) {
            disableVoice();
        } else {
            setIsEnabling(true);
            try {
                await enableVoice();
            } catch (err: any) {
                console.error('[VoiceControls] Failed to enable voice:', err);
                if (err.name === 'NotAllowedError') {
                    setError('Microphone access denied');
                } else if (err.name === 'NotFoundError') {
                    setError('No microphone found');
                } else {
                    setError('Failed to enable voice');
                }
            } finally {
                setIsEnabling(false);
            }
        }
    }, [voiceEnabled, enableVoice, disableVoice]);

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            {/* Voice toggle button */}
            <motion.button
                onClick={handleToggleVoice}
                disabled={isEnabling}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    voiceEnabled
                        ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                        : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                } ${isEnabling ? 'opacity-50 cursor-wait' : ''}`}
                whileTap={{ scale: 0.95 }}
                title={voiceEnabled ? 'Leave voice chat' : 'Join voice chat'}
            >
                {voiceEnabled ? (
                    <>
                        <Phone className="h-4 w-4" />
                        <span className="hidden sm:inline">Voice On</span>
                    </>
                ) : (
                    <>
                        <PhoneOff className="h-4 w-4" />
                        <span className="hidden sm:inline">{isEnabling ? 'Joining...' : 'Join Voice'}</span>
                    </>
                )}
            </motion.button>

            {/* Mute button (only shown when voice is enabled) */}
            <AnimatePresence>
                {voiceEnabled && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={toggleMute}
                        className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${
                            isMuted
                                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                : 'bg-white/10 text-white/60 hover:bg-white/20'
                        }`}
                        whileTap={{ scale: 0.9 }}
                        title={isMuted ? 'Unmute' : 'Mute'}
                    >
                        {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Connected peers indicator */}
            <AnimatePresence>
                {voiceEnabled && voicePeers.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="flex items-center gap-1 rounded-full bg-white/5 px-3 py-1.5 text-xs text-white/50"
                        title={voicePeers.map(p => p.name).join(', ')}
                    >
                        <Users className="h-3 w-3" />
                        <span>{voicePeers.length} connected</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Error message */}
            <AnimatePresence>
                {error && (
                    <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-xs text-red-400"
                    >
                        {error}
                    </motion.span>
                )}
            </AnimatePresence>
        </div>
    );
});
