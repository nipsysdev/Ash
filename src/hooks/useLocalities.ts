import { load } from '@tauri-apps/plugin-store';
import { useEffect, useState } from 'react';
import type { Locality } from '../interfaces/locality.ts';

export function useLocalities() {
    const [localities, setLocalities] = useState<Locality[]>([]);
    const [selectedLocality, setSelectedLocality] = useState<Locality | null>(
        null,
    );
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadLocalities = async () => {
            try {
                const store = await load('store.json');
                const storedLocalities =
                    (await store.get<Locality[]>('active_localities')) ?? [];
                setLocalities(storedLocalities);

                // Set the first locality as selected by default if none is selected
                if (storedLocalities.length > 0 && !selectedLocality) {
                    setSelectedLocality(storedLocalities[0]);
                }
            } catch (error) {
                console.error('Failed to load localities:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadLocalities();
    }, [selectedLocality]);

    return {
        localities,
        selectedLocality,
        setSelectedLocality,
        isLoading,
    };
}
