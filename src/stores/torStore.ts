import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { atom, effect, onMount } from 'nanostores';
import { TorStatus } from '../interfaces/tor.ts';

export const $isTorDialogOpened = atom(false);
export const $torStatus = atom<TorStatus>(TorStatus.Offline);
export const $torBootstrapProgress = atom(0);
export const $torError = atom<string | null>(null);

export async function connectToTor() {
    $torStatus.set(TorStatus.Pending);
    try {
        if (await invoke('bootstrap_tor')) {
            $torStatus.set(TorStatus.Online);
        }
    } catch (error) {
        console.error(error);
        $torStatus.set(TorStatus.Error);
        $torError.set(`${error}`);
    }
}

onMount($torStatus, () => {
    listen(
        'tor-bootstrap-status',
        (event: { payload: { progress: number } }) => {
            $torBootstrapProgress.set(event.payload.progress);
            if (event.payload.progress >= 100) {
                $torStatus.set(TorStatus.Online);
            }
        },
    );
});

effect($torStatus, () => {
    $torError.set(null);
});
