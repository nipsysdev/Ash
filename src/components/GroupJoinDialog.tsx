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
import {
    checkPermissions,
    Format,
    requestPermissions,
    scan,
} from '@tauri-apps/plugin-barcode-scanner';
import { useState } from 'react';
import type { Group } from '../interfaces/group';
import {
    $storeGroups,
    setStoreGroups,
    setStoreSelectedGroup,
} from '../stores/jsonStore';
import { $isGroupJoinDialogOpened } from '../stores/mainViewStore';

export default function GroupJoinDialog() {
    const isDialogOpened = useStore($isGroupJoinDialogOpened);
    const storeGroups = useStore($storeGroups);
    const [groupId, setGroupId] = useState('');
    const [groupName, setGroupName] = useState('');

    async function scanGroupId() {
        let permissionStatus = await checkPermissions();
        if (permissionStatus !== 'granted') {
            permissionStatus = await requestPermissions();
            if (permissionStatus !== 'granted') {
                return;
            }
        }

        const scanned = await scan({
            windowed: false,
            formats: [Format.QRCode],
        });
        setGroupId(scanned.content);
    }

    async function joinGroup() {
        if (!groupName) return;
        const group: Group = {
            id: groupId,
            name: groupName,
            mapData: {},
            chatHistory: [],
        };
        setStoreGroups([...storeGroups, group]);
        setStoreSelectedGroup(group);
        $isGroupJoinDialogOpened.set(false);
    }

    return (
        <Dialog
            open={isDialogOpened}
            onOpenChange={(open) => $isGroupJoinDialogOpened.set(open)}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Join group</DialogTitle>
                    <DialogDescription>
                        Join someone else group
                    </DialogDescription>
                </DialogHeader>

                <div className="flex justify-between items-end mb-5">
                    <Input
                        value={groupId}
                        label="Group ID"
                        placeholder="Enter the ID of the group"
                        onChange={(e) => setGroupId(e.target.value)}
                        autoFocus
                    />

                    <Button variant="outlined" onClick={scanGroupId}>
                        Scan
                    </Button>
                </div>

                <Input
                    value={groupName}
                    label="Group name"
                    placeholder="Enter a name for this group"
                    onChange={(e) => setGroupName(e.target.value)}
                    autoFocus
                />

                <DialogFooter>
                    <div className="text-right mt-10">
                        <Button
                            disabled={!groupId || !groupName}
                            onClick={joinGroup}
                        >
                            Join the group
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
