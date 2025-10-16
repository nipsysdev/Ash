import { useStore } from '@nanostores/react';
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
import { useCallback, useState } from 'react';
import { $storeLocalities } from '../../stores/jsonStore';

interface MapDownloadStepProps {
    onStepChange: (stepChange: number) => void;
    onSetupComplete?: () => void;
}

export type DownloadEvent =
    | {
          event: 'progress';
          data: {
              chunk_length: number;
          };
      }
    | {
          event: 'finished';
      };

export default function MapDownloadStep({
    onStepChange,
    onSetupComplete,
}: MapDownloadStepProps) {
    const storeLocalities = useStore($storeLocalities);
    const [downloadProgress, setDownloadProgress] = useState<
        Record<string, number>
    >({});
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadedCount, setDownloadedCount] = useState(0);

    const downloadMaps = useCallback(async () => {
        if (isDownloading) return;

        setIsDownloading(true);
        setDownloadedCount(0);
        setDownloadProgress({});

        for (const locality of storeLocalities) {
            const onEvent = new Channel<DownloadEvent>();

            onEvent.onmessage = (message) => {
                if (message.event === 'progress') {
                    setDownloadProgress((prev) => {
                        const currentProgress =
                            prev[locality.id.toString()] || 0;
                        return {
                            ...prev,
                            [locality.id.toString()]:
                                currentProgress + message.data.chunk_length,
                        };
                    });
                } else if (message.event === 'finished') {
                    setDownloadedCount((prev) => prev + 1);
                }
            };

            try {
                await invoke('download_map', {
                    onionLink: locality.onion_link,
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
    }, [storeLocalities, isDownloading]);

    function bytesToMB(bytes: number, decimals: number = 2): string {
        const mb = bytes / (1024 * 1024);
        return `${mb.toFixed(decimals)} MB`;
    }

    function bytesToKb(bytes: number): string {
        const kb = bytes / 1024;
        return `${kb.toFixed(2)} KB`;
    }

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
                            Downloaded: {downloadedCount}/
                            {storeLocalities.length}
                        </CardDescription>
                        <CardAction>
                            <Button
                                size="sm"
                                variant="outlined"
                                onClick={downloadMaps}
                                disabled={
                                    isDownloading ||
                                    storeLocalities.length === 0 ||
                                    downloadedCount === storeLocalities.length
                                }
                            >
                                {isDownloading
                                    ? 'Downloading'
                                    : downloadedCount === storeLocalities.length
                                      ? 'Done'
                                      : 'Start'}
                            </Button>
                        </CardAction>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-y-5">
                        {storeLocalities.map((locality) => (
                            <div
                                key={locality.id}
                                className="flex flex-col gap-y-2"
                            >
                                <div className="flex justify-between">
                                    <Typography variant="body2">
                                        {locality.name}
                                    </Typography>
                                    <Typography variant="body2">
                                        {locality.file_size < 100000
                                            ? bytesToKb(locality.file_size)
                                            : bytesToMB(locality.file_size)}
                                    </Typography>
                                </div>
                                <Progress
                                    value={
                                        locality.file_size > 0
                                            ? ((downloadProgress[
                                                  locality.id.toString()
                                              ] || 0) /
                                                  locality.file_size) *
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
                    disabled={downloadedCount < storeLocalities.length}
                >
                    End setup
                </Button>
            </div>
        </div>
    );
}
