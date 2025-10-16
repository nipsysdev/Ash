import { useStore } from '@nanostores/react';
import {
    Badge,
    Button,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Sheet,
    SheetContent,
    SheetTrigger,
    Typography,
} from '@nipsysdev/lsd-react';
import { MessageSquare } from 'lucide-react';
import MapComponent from '../components/MapComponent.tsx';
import { useLocalities } from '../hooks/useLocalities.ts';
import { $isWakuDialogOpened, $wakuStatus } from '../stores/wakuStore.ts';

export default function MainView() {
    const wakuStatus = useStore($wakuStatus);

    const { localities, selectedLocality, setSelectedLocality, isLoading } =
        useLocalities();

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (!selectedLocality) {
        return <div>No locality selected</div>;
    }

    return (
        <Sheet>
            <div className="size-full flex flex-col">
                <MapComponent locality={selectedLocality} />

                <div className="absolute top-0 left-0 p-5 mt-[env(safe-area-inset-top)] flex w-full justify-between items-center">
                    <SheetTrigger asChild>
                        <Button variant="outlined">Menu</Button>
                    </SheetTrigger>

                    <div className="flex gap-x-2">
                        <Badge
                            variant="outlined"
                            size="sm"
                            onClick={() => $isWakuDialogOpened.set(true)}
                        >
                            Waku: {wakuStatus}
                        </Badge>
                    </div>
                </div>

                <Dialog>
                    <DialogTrigger asChild>
                        <Button
                            variant="outlined-icon"
                            size="icon-xl"
                            aria-label="Add"
                            className="absolute bottom-1/12 right-5 mb-[env(safe-area-inset-bottom)]"
                        >
                            <MessageSquare size={20} />
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Group Chat</DialogTitle>
                            <DialogDescription>
                                Communicate safely and privately through Waku.
                            </DialogDescription>
                        </DialogHeader>
                        {/* <GroupChat /> */}
                    </DialogContent>
                </Dialog>

                <div className="absolute bottom-0 mb-[env(safe-area-inset-top)] left-5 opacity-80">
                    <Typography variant="subtitle4" color="secondary">
                        © MapLibre © Protomaps © OpenStreetMap
                    </Typography>
                </div>
            </div>
            <SheetContent side="left">
                <Select
                    value={selectedLocality.id.toString()}
                    onValueChange={(value) => {
                        const locality = localities.find(
                            (l) => l.id.toString() === value,
                        );
                        if (locality) {
                            setSelectedLocality(locality);
                        }
                    }}
                >
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select a locality" />
                    </SelectTrigger>
                    <SelectContent>
                        {localities.map((locality) => (
                            <SelectItem
                                key={locality.id}
                                value={locality.id.toString()}
                            >
                                {locality.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </SheetContent>
        </Sheet>
    );
}
