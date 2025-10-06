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
import { load } from '@tauri-apps/plugin-store';
import { useCallback, useEffect, useState } from 'react';
import type { Locality } from '../../interfaces/locality.ts';

interface MapDownloadStepProps {
    onStepChange: (stepChange: number) => void;
}

export default function MapDownloadStep({
    onStepChange,
}: MapDownloadStepProps) {
    const [hasLoadedLocalities, setHasLoadedLocalities] = useState(false);
    const [localities, setLocalities] = useState<Locality[]>([]);

    const loadLocalities = useCallback(async () => {
        const store = await load('store.json');
        setLocalities((await store.get<Locality[]>('active_localities')) ?? []);
    }, []);

    /* const test = async () => {
        const file = await create('config.json', {
            baseDir: BaseDirectory.AppData,
        });
        await file.write(new TextEncoder().encode('Hello world'));
        await file.close();
    }; */

    function bytesToMB(bytes: number, decimals: number = 2): string {
        console.log(bytes);
        const mb = bytes / (1024 * 1024);
        return `${mb.toFixed(decimals)} MB`;
    }

    function bytesToKb(bytes: number): string {
        const kb = bytes / 1024;
        return `${kb.toFixed(2)} KB`;
    }

    useEffect(() => {
        if (hasLoadedLocalities) return;
        console.log('test');
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
                            Downloaded: 0/{localities.length}
                        </CardDescription>
                        <CardAction>
                            <Button size="sm" variant="outlined">
                                Start
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
                                <Progress />
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
                    onClick={() => onStepChange(1)}
                    variant="filled"
                    disabled
                >
                    End setup
                </Button>
            </div>
        </div>
    );
}
