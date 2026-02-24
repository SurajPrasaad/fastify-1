import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type AccentColor = 'Blue' | 'Purple' | 'Pink' | 'Orange' | 'Green';

interface AppearanceState {
    accentColor: AccentColor;
    fontSize: number;
    isCompact: boolean;
    setAccentColor: (color: AccentColor) => void;
    setFontSize: (size: number) => void;
    setIsCompact: (compact: boolean) => void;
    resetAppearance: () => void;
}

const initialState = {
    accentColor: 'Blue' as AccentColor,
    fontSize: 50,
    isCompact: false,
};

export const useAppearanceStore = create<AppearanceState>()(
    persist(
        (set) => ({
            ...initialState,
            setAccentColor: (color) => set({ accentColor: color }),
            setFontSize: (size) => set({ fontSize: size }),
            setIsCompact: (compact) => set({ isCompact: compact }),
            resetAppearance: () => set(initialState),
        }),
        {
            name: 'appearance-storage',
        }
    )
);
