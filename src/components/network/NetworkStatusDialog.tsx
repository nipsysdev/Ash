import { useStore } from '@nanostores/react';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogTitle,
    Progress,
} from '@nipsysdev/lsd-react';
import { effect } from 'nanostores';
import { useRef } from 'react';
import { NetworkStatus, NetworkType } from '../../interfaces/networkStatus';
import {
    $isTorDialogOpened,
    $torBootstrapProgress,
    $torError,
    $torStatus,
} from '../../stores/torStore';
import {
    $isWakuDialogOpened,
    $wakuError,
    $wakuStatus,
} from '../../stores/wakuStore';

export default function NetworkStatusDialog() {
    const isTorDialogOpened = useStore($isTorDialogOpened);
    const torStatus = useStore($torStatus);
    const torError = useStore($torError);
    const torBootstrapProgress = useStore($torBootstrapProgress);

    const isWakuDialogOpened = useStore($isWakuDialogOpened);
    const wakuStatus = useStore($wakuStatus);
    const wakuError = useStore($wakuError);

    const activeNetwork = useRef<NetworkType | null>(null);

    const isDialogOpen = isTorDialogOpened || isWakuDialogOpened;
    const status =
        activeNetwork.current === NetworkType.Tor ? torStatus : wakuStatus;
    const error =
        activeNetwork.current === NetworkType.Tor ? torError : wakuError;
    const progress =
        activeNetwork.current === NetworkType.Tor ? torBootstrapProgress : 0;

    effect(
        [$isTorDialogOpened, $isWakuDialogOpened],
        (isTorDialogOpened, isWakuDialogOpened) => {
            if (isTorDialogOpened) {
                activeNetwork.current = NetworkType.Tor;
            }
            if (isWakuDialogOpened) {
                activeNetwork.current = NetworkType.Waku;
            }
        },
    );

    effect([$torStatus], (torStatus) => {
        if (torStatus === NetworkStatus.Online) {
            setTimeout(() => $isTorDialogOpened.set(false), 2000);
        }
    });

    effect([$wakuStatus], (wakuStatus) => {
        if (wakuStatus === NetworkStatus.Online) {
            setTimeout(() => $isWakuDialogOpened.set(false), 2000);
        }
    });

    const getNetworkName = (type: NetworkType | null) => {
        return type === NetworkType.Tor ? 'Tor' : 'Waku';
    };

    const getStatusDescription = (
        status: NetworkStatus,
        networkType: NetworkType | null,
    ) => {
        const networkName = getNetworkName(networkType);

        if (status === NetworkStatus.Pending) {
            return `${networkName} is being initialized`;
        }
        if (status === NetworkStatus.Online) {
            return `Connected to ${networkName} successfully`;
        }
        if (status === NetworkStatus.Error && error) {
            return error;
        }
        return '';
    };

    return (
        <AlertDialog
            open={isDialogOpen}
            onOpenChange={() => {
                if (activeNetwork.current === NetworkType.Tor) {
                    $isTorDialogOpened.set(false);
                } else {
                    $isWakuDialogOpened.set(false);
                }
            }}
        >
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        {getNetworkName(activeNetwork.current)} Status:{' '}
                        <span className="capitalize">{status}</span>
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {getStatusDescription(status, activeNetwork.current)}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                {activeNetwork.current === NetworkType.Tor && (
                    <Progress
                        value={status === NetworkStatus.Online ? 100 : progress}
                    />
                )}
                {activeNetwork.current === NetworkType.Waku && (
                    <Progress
                        indeterminate={status === NetworkStatus.Pending}
                        value={
                            status === NetworkStatus.Online ? 100 : undefined
                        }
                    />
                )}
            </AlertDialogContent>
        </AlertDialog>
    );
}
