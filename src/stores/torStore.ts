import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { atom, effect, onMount } from 'nanostores';
import { NetworkStatus } from '../interfaces/networkStatus';

export const $isTorDialogOpened = atom(false);
export const $torStatus = atom<NetworkStatus>(NetworkStatus.Offline);
export const $torBootstrapProgress = atom(0);
export const $torError = atom<string | null>(null);

export async function connectToTor() {
    $torStatus.set(NetworkStatus.Pending);
    try {
        if (await invoke('bootstrap_tor')) {
            $torStatus.set(NetworkStatus.Online);
        }
    } catch (error) {
        console.error(error);
        $torStatus.set(NetworkStatus.Error);
        $torError.set(`${error}`);
    }
}

onMount($torStatus, () => {
    listen(
        'tor-bootstrap-status',
        (event: { payload: { progress: number } }) => {
            $torBootstrapProgress.set(event.payload.progress);
            if (event.payload.progress >= 100) {
                $torStatus.set(NetworkStatus.Online);
            }
        },
    );
});

effect($torStatus, () => {
    $torError.set(null);
});
