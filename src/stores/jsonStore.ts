import { load } from '@tauri-apps/plugin-store';
import { atom, onMount } from 'nanostores';
import type { Locality } from '../interfaces/localitysrv';

export const $storeLocalities = atom<Locality[]>([]);
export const $storeDeviceId = atom<string>('');
export const $storeSetupDone = atom<boolean | null>(null);

onMount($storeSetupDone, () => {
    load('store.json').then(async (store) => {
        await Promise.all([
            store
                .get<Locality[]>('active_localities')
                .then((val) => $storeLocalities.set(val ?? [])),
            store
                .get<string>('device_id')
                .then((val) => $storeDeviceId.set(val ?? '')),
            store
                .get<boolean>('setup_done')
                .then((val) => $storeSetupDone.set(val ?? false)),
        ]);
    });
});

export async function setStoreLocalities(localities: Locality[]) {
    const store = await load('store.json');
    await store.set('active_localities', localities);
    $storeLocalities.set(localities);
    await store.save();
}

export async function setStoreDeviceId(deviceId: string) {
    const store = await load('store.json');
    await store.set('device_id', deviceId);
    $storeDeviceId.set(deviceId);
    await store.save();
}

export async function setStoreSetupDone(setupDone: boolean) {
    const store = await load('store.json');
    await store.set('setup_done', setupDone);
    $storeSetupDone.set(setupDone);
    await store.save();
}
