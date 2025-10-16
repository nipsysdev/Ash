import { useStore } from '@nanostores/react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    Typography,
} from '@nipsysdev/lsd-react';
import QRCode from 'react-qr-code';
import { $storeSelectedGroup } from '../stores/jsonStore';
import { $isGroupInviteDialogOpened } from '../stores/mainViewStore';

export default function NetworkStatusDialog() {
    const selectedGroup = useStore($storeSelectedGroup);
    const isGroupInviteDialogOpened = useStore($isGroupInviteDialogOpened);

    return (
        <Dialog
            open={isGroupInviteDialogOpened}
            onOpenChange={(open) => $isGroupInviteDialogOpened.set(open)}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Group invite</DialogTitle>
                    <DialogDescription>
                        Invite others to join your group
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center">
                    <QRCode
                        value={JSON.stringify({
                            id: selectedGroup?.id,
                        })}
                    />
                    <Typography variant="h5" className="mt-2">
                        {selectedGroup?.id}
                    </Typography>
                </div>
            </DialogContent>
        </Dialog>
    );
}
