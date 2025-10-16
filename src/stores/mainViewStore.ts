import { atom, effect } from 'nanostores';
import type { Locality } from '../interfaces/localitysrv';
import { $storeLocalities } from './jsonStore';

export const $isSheetOpened = atom(false);
export const $isNewGroupDialogOpened = atom(false);
export const $isGroupInviteDialogOpened = atom(false);
export const $isGroupJoinDialogOpened = atom(false);
export const $mapSelectedLocality = atom<Locality | null>(null);

effect($storeLocalities, (localities) => {
    if (localities.length) {
        $mapSelectedLocality.set(localities[0]);
    }
});
