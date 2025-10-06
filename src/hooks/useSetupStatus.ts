import { load } from '@tauri-apps/plugin-store';
import { useEffect, useState } from 'react';

export function useSetupStatus() {
    const [isSetupDone, setIsSetupDone] = useState<boolean | null>(null);

    useEffect(() => {
        const checkSetupStatus = async () => {
            const store = await load('store.json');
            const setupDone = await store.get<boolean>('setup_done');
            setIsSetupDone(setupDone ?? false);
        };

        checkSetupStatus();
    }, []);

    const setSetupDone = async () => {
        const store = await load('store.json');
        await store.set('setup_done', true);
        await store.save();
        setIsSetupDone(true);
    };

    return { isSetupDone, setSetupDone };
}
