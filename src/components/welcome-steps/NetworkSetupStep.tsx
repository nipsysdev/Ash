import { useStore } from '@nanostores/react';
import { Button, Progress, Separator, Typography } from '@nipsysdev/lsd-react';
import { computed } from 'nanostores';
import { useEffect, useRef } from 'react';
import { NetworkStatus } from '../../interfaces/networkStatus.ts';
import {
    $torBootstrapProgress,
    $torStatus,
    connectToTor,
} from '../../stores/torStore.ts';
import {
    $wakuServerChannel,
    $wakuStatus,
    createWakuServerChannel,
} from '../../stores/wakuStore.ts';

interface NetworkSetupStepProps {
    onStepChange: (stepChange: number) => void;
}

export default function NetworkSetupStep({
    onStepChange,
}: NetworkSetupStepProps) {
    const isReady = useStore(
        computed(
            [$torStatus, $wakuStatus, $wakuServerChannel],
            (torStatus, wakuStatus, wakuServerChannel) =>
                torStatus === NetworkStatus.Online &&
                wakuStatus === NetworkStatus.Online &&
                wakuServerChannel !== null,
        ),
    );
    const torStatus = useStore($torStatus);
    const torBootstrapProgress = useStore($torBootstrapProgress);
    const wakuStatus = useStore($wakuStatus);
    const wakuServerChannel = useStore($wakuServerChannel);

    const hasRequestedTorConnect = useRef(false);
    const hasRequestedWakuSrvChannel = useRef(false);

    useEffect(() => {
        if (
            !hasRequestedTorConnect.current &&
            torStatus === NetworkStatus.Offline
        ) {
            hasRequestedTorConnect.current = true;
            connectToTor();
        }
    }, [torStatus]);

    useEffect(() => {
        if (
            wakuStatus === NetworkStatus.Online &&
            !hasRequestedWakuSrvChannel.current &&
            torStatus === NetworkStatus.Online
        ) {
            hasRequestedWakuSrvChannel.current = true;
            createWakuServerChannel();
        }
    }, [torStatus, wakuStatus]);

    return (
        <div className="flex flex-col gap-y-10 size-full">
            <div className="flex-auto flex flex-col ">
                <div className="mb-10">
                    <Typography variant="h3" className="pb-2">
                        Network setup
                    </Typography>
                    <Typography variant="subtitle2">
                        Setting up Tor and Waku communications
                    </Typography>
                </div>

                <div className="flex-auto flex flex-col gap-y-15">
                    <div>
                        <Typography variant="h4">Tor connection</Typography>
                        <Separator className="my-1" />
                        <Typography variant="subtitle3">
                            Map data download happens over Tor.
                        </Typography>

                        <div className="text-center mt-3">
                            <Typography variant="body2">
                                Status: {torStatus}
                            </Typography>
                            <Progress
                                value={
                                    torStatus === NetworkStatus.Online
                                        ? 100
                                        : torBootstrapProgress
                                }
                            />
                        </div>
                    </div>

                    <div>
                        <Typography variant="h4">Waku connection</Typography>
                        <Separator className="my-1" />
                        <Typography variant="subtitle3">
                            Communication with backend and group members happens
                            over Waku.
                        </Typography>

                        <div className="text-center mt-3">
                            <Typography variant="body2">
                                Status: {wakuStatus}
                            </Typography>
                            <Progress
                                indeterminate={
                                    wakuStatus === NetworkStatus.Pending
                                }
                                value={
                                    wakuStatus === NetworkStatus.Online
                                        ? 100
                                        : undefined
                                }
                            />
                        </div>

                        {wakuStatus === NetworkStatus.Online && (
                            <div className="text-center mt-3">
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
                    </div>
                </div>
            </div>

            <div className="flex justify-between">
                <Button variant="outlined" onClick={() => onStepChange(-1)}>
                    Previous
                </Button>
                <Button
                    onClick={() => onStepChange(1)}
                    variant="filled"
                    disabled={!isReady}
                >
                    Next
                </Button>
            </div>
        </div>
    );
}
