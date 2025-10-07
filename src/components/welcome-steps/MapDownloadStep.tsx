import {
    Button,
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    Progress,
    Typography,
} from '@nipsysdev/lsd-react';
import { Channel, invoke } from '@tauri-apps/api/core';
import { load } from '@tauri-apps/plugin-store';
import { useCallback, useEffect, useState } from 'react';
import type { DownloadEvent } from '../../interfaces/download.ts';
import type { Locality } from '../../interfaces/locality.ts';

interface MapDownloadStepProps {
    onStepChange: (stepChange: number) => void;
    onSetupComplete?: () => void;
}

export default function MapDownloadStep({
    onStepChange,
    onSetupComplete,
}: MapDownloadStepProps) {
    const [hasLoadedLocalities, setHasLoadedLocalities] = useState(false);
    const [localities, setLocalities] = useState<Locality[]>([]);
    const [downloadProgress, setDownloadProgress] = useState<
        Record<string, number>
    >({});
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadedCount, setDownloadedCount] = useState(0);

    const loadLocalities = useCallback(async () => {
        const store = await load('store.json');
        setLocalities((await store.get<Locality[]>('active_localities')) ?? []);
    }, []);

    const downloadMaps = useCallback(async () => {
        if (isDownloading) return;

        setIsDownloading(true);
        setDownloadedCount(0);

        for (const locality of localities) {
            const onEvent = new Channel<DownloadEvent>();

            onEvent.onmessage = (message) => {
                if (message.event === 'started') {
                    setDownloadProgress((prev) => ({
                        ...prev,
                        [locality.id.toString()]: 0,
                    }));
                } else if (message.event === 'progress') {
                    setDownloadProgress((prev) => {
                        const currentProgress =
                            prev[locality.id.toString()] || 0;
                        return {
                            ...prev,
                            [locality.id.toString()]:
                                currentProgress + message.data.chunkLength,
                        };
                    });
                } else if (message.event === 'finished') {
                    setDownloadedCount((prev) => prev + 1);
                }
            };

            try {
                await invoke('download_map', {
                    countryId: locality.country,
                    localityId: locality.id.toString(),
                    onEvent,
                });
            } catch (error) {
                console.error(
                    `Failed to download map for ${locality.name}:`,
                    error,
                );
            }
        }

        setIsDownloading(false);
    }, [localities, isDownloading]);

    function bytesToMB(bytes: number, decimals: number = 2): string {
        const mb = bytes / (1024 * 1024);
        return `${mb.toFixed(decimals)} MB`;
    }

    function bytesToKb(bytes: number): string {
        const kb = bytes / 1024;
        return `${kb.toFixed(2)} KB`;
    }

    useEffect(() => {
        if (hasLoadedLocalities) return;
        loadLocalities();
        setHasLoadedLocalities(true);
    }, [loadLocalities, hasLoadedLocalities]);

    return (
        <div className="flex flex-col gap-y-10 size-full">
            <div className="flex-auto flex flex-col">
                <div className="mb-5">
                    <Typography variant="h3" className="pb-2">
                        Fetching what we need
                    </Typography>
                    <Typography variant="subtitle2">
                        Downloading map data for the localities you selected
                    </Typography>
                </div>

                <Card className="flex-auto">
                    <CardHeader>
                        <CardTitle>Map data download</CardTitle>
                        <CardDescription>
                            Downloaded: {downloadedCount}/{localities.length}
                        </CardDescription>
                        <CardAction>
                            <Button
                                size="sm"
                                variant="outlined"
                                onClick={downloadMaps}
                                disabled={
                                    isDownloading ||
                                    localities.length === 0 ||
                                    downloadedCount === localities.length
                                }
                            >
                                {isDownloading
                                    ? 'Downloading'
                                    : downloadedCount === localities.length
                                      ? 'Done'
                                      : 'Start'}
                            </Button>
                        </CardAction>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-y-5">
                        {localities.map((locality) => (
                            <div
                                key={locality.id}
                                className="flex flex-col gap-y-2"
                            >
                                <div className="flex justify-between">
                                    <Typography variant="body2">
                                        {locality.name}
                                    </Typography>
                                    <Typography variant="body2">
                                        {locality.fileSize < 100000
                                            ? bytesToKb(locality.fileSize)
                                            : bytesToMB(locality.fileSize)}
                                    </Typography>
                                </div>
                                <Progress
                                    value={
                                        locality.fileSize > 0
                                            ? ((downloadProgress[
                                                  locality.id.toString()
                                              ] || 0) /
                                                  locality.fileSize) *
                                              100
                                            : 0
                                    }
                                />
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-between">
                <Button variant="outlined" onClick={() => onStepChange(-1)}>
                    Previous
                </Button>
                <Button
                    onClick={async () => {
                        if (onSetupComplete) {
                            onSetupComplete();
                        }
                    }}
                    variant="filled"
                    disabled={downloadedCount < localities.length}
                >
                    End setup
                </Button>
            </div>
        </div>
    );
}
