import { atom, effect } from 'nanostores';
import type { Locality } from '../interfaces/localitysrv';
import { $storeLocalities } from './jsonStore';

export const $mapSelectedLocality = atom<Locality | null>(null);

effect($storeLocalities, (localities) => {
    if (localities.length) {
        $mapSelectedLocality.set(localities[0]);
    }
});
