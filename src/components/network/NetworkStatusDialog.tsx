import { useStore } from '@nanostores/react';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogTitle,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    Progress,
    Typography,
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
    $wakuServerChannel,
    $wakuStatus,
} from '../../stores/wakuStore';

export default function NetworkStatusDialog() {
    const isTorDialogOpened = useStore($isTorDialogOpened);
    const torStatus = useStore($torStatus);
    const torError = useStore($torError);
    const torBootstrapProgress = useStore($torBootstrapProgress);

    const isWakuDialogOpened = useStore($isWakuDialogOpened);
    const wakuStatus = useStore($wakuStatus);
    const wakuServerChannel = useStore($wakuServerChannel);
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
        <Dialog
            open={isDialogOpen}
            onOpenChange={() => {
                if (activeNetwork.current === NetworkType.Tor) {
                    $isTorDialogOpened.set(false);
                } else {
                    $isWakuDialogOpened.set(false);
                }
            }}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {getNetworkName(activeNetwork.current)} Status:{' '}
                        <span className="capitalize">{status}</span>
                    </DialogTitle>
                    <DialogDescription>
                        {getStatusDescription(status, activeNetwork.current)}
                    </DialogDescription>
                </DialogHeader>
                {activeNetwork.current === NetworkType.Tor && (
                    <Progress
                        value={status === NetworkStatus.Online ? 100 : progress}
                    />
                )}
                {activeNetwork.current === NetworkType.Waku && (
                    <>
                        <Progress
                            indeterminate={status === NetworkStatus.Pending}
                            value={
                                status === NetworkStatus.Online
                                    ? 100
                                    : undefined
                            }
                        />

                        {wakuStatus === NetworkStatus.Online && (
                            <div className="text-center">
                                <Typography variant="body2">
                                    {wakuServerChannel === null
                                        ? 'Initializing backend channel'
                                        : 'Backend channel ready'}
                                </Typography>
                                <Progress
                                    indeterminate={wakuServerChannel === null}
                                    value={
                                        wakuServerChannel !== null
                                            ? 100
                                            : undefined
                                    }
                                />
                            </div>
                        )}
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
