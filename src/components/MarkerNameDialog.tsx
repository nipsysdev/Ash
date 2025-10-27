import { useStore } from '@nanostores/react';
import {
    Button,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    Input,
} from '@nipsysdev/lsd-react';
import { useState } from 'react';
import { $isMarkerNameDialogOpened } from '../stores/mainViewStore';

interface MarkerNameDialogProps {
    onMarkerNameSubmit: (markerName: string) => void;
}

export default function MarkerNameDialog({
    onMarkerNameSubmit,
}: MarkerNameDialogProps) {
    const isDialogOpened = useStore($isMarkerNameDialogOpened);
    const [markerName, setMarkerName] = useState('');

    function handleSubmit() {
        if (!markerName) return;
        onMarkerNameSubmit(markerName);
        setMarkerName('');
        $isMarkerNameDialogOpened.set(false);
    }

    return (
        <Dialog
            open={isDialogOpened}
            onOpenChange={(open) => $isMarkerNameDialogOpened.set(open)}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Marker</DialogTitle>
                    <DialogDescription>
                        Enter a name for this marker
                    </DialogDescription>
                </DialogHeader>

                <Input
                    value={markerName}
                    label="Marker name"
                    placeholder="Enter a name for this marker"
                    onChange={(e) => setMarkerName(e.target.value)}
                    autoFocus
                />

                <DialogFooter>
                    <div className="text-right mt-4">
                        <Button disabled={!markerName} onClick={handleSubmit}>
                            Add Marker
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
