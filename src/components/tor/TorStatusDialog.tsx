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
import { TorStatus } from '../../interfaces/tor.ts';
import {
    $isTorDialogOpened,
    $torBootstrapProgress,
    $torError,
    $torStatus,
} from '../../stores/torStore.ts';

export default function TorDialog() {
    const isTorDialogOpened = useStore($isTorDialogOpened);
    const torStatus = useStore($torStatus);
    const torError = useStore($torError);
    const torBootstrapProgress = useStore($torBootstrapProgress);

    effect([$torStatus], (torStatus) => {
        if (torStatus === TorStatus.Online) {
            setTimeout(() => $isTorDialogOpened.set(false), 2000);
        }
    });

    return (
        <AlertDialog
            open={isTorDialogOpened}
            onOpenChange={() => $isTorDialogOpened.set(false)}
        >
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        Tor Status:{' '}
                        <span className="capitalize">{torStatus}</span>
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {torStatus === TorStatus.Pending &&
                            'Tor is being initialized'}
                        {torStatus === TorStatus.Online &&
                            'Connected to Tor successfully'}
                        {torStatus === TorStatus.Error && torError}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <Progress value={torBootstrapProgress} />
            </AlertDialogContent>
        </AlertDialog>
    );
}
