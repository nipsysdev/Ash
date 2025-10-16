import { load, type Store } from '@tauri-apps/plugin-store';
import { atom, onMount } from 'nanostores';
import type { Group } from '../interfaces/group';
import type { Locality } from '../interfaces/localitysrv';

export const $storeLocalities = atom<Locality[]>([]);
export const $storeDeviceId = atom<string>('');
export const $storeSetupDone = atom<boolean | null>(null);
export const $storeGroups = atom<Group[]>([]);
export const $storeSelectedGroup = atom<Group | null>(null);

onMount($storeSetupDone, () => {
    loadStore().then(async (store) => {
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
            store
                .get<Group[]>('groups')
                .then((val) => $storeGroups.set(val ?? [])),
            store
                .get<Group | undefined | null>('selected_group')
                .then((val) => $storeSelectedGroup.set(val ?? null)),
        ]);
    });
});

function loadStore(): Promise<Store> {
    return load('store.json');
}

export async function setStoreLocalities(localities: Locality[]) {
    const store = await loadStore();
    await store.set('active_localities', localities);
    $storeLocalities.set(localities);
    await store.save();
}

export async function setStoreDeviceId(deviceId: string) {
    const store = await loadStore();
    await store.set('device_id', deviceId);
    $storeDeviceId.set(deviceId);
    await store.save();
}

export async function setStoreSetupDone(setupDone: boolean) {
    const store = await loadStore();
    await store.set('setup_done', setupDone);
    $storeSetupDone.set(setupDone);
    await store.save();
}

export async function setStoreGroups(groups: Group[]) {
    const store = await loadStore();
    await store.set('groups', groups);
    $storeGroups.set(groups);
    await store.save();
}

export async function setStoreSelectedGroup(group: Group | null) {
    const store = await loadStore();
    await store.set('selected_group', group);
    $storeSelectedGroup.set(group);
    await store.save();
}
