import { useStore } from '@nanostores/react';
import {
    Button,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    Input,
} from '@nipsysdev/lsd-react';
import { nanoid } from 'nanoid';
import { useState } from 'react';
import type { Group } from '../interfaces/group';
import {
    $storeGroups,
    setStoreGroups,
    setStoreSelectedGroup,
} from '../stores/jsonStore';
import { $isNewGroupDialogOpened } from '../stores/mainViewStore';

export default function NetworkStatusDialog() {
    const storeGroups = useStore($storeGroups);
    const isNewGroupDialogOpened = useStore($isNewGroupDialogOpened);
    const [groupName, setGroupName] = useState('');

    async function createGroup() {
        if (!groupName) return;
        const group: Group = {
            id: nanoid(5),
            name: groupName,
            mapData: {},
            chatHistory: [],
        };
        setStoreGroups([...storeGroups, group]);
        setStoreSelectedGroup(group);
        $isNewGroupDialogOpened.set(false);
    }

    return (
        <Dialog
            open={isNewGroupDialogOpened}
            onOpenChange={(open) => $isNewGroupDialogOpened.set(open)}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>New Group</DialogTitle>
                    <DialogDescription>
                        Chat and share map data with others
                    </DialogDescription>
                </DialogHeader>

                <div className="flex justify-between items-end">
                    <Input
                        value={groupName}
                        label="Group name"
                        placeholder="Enter a name for this new group"
                        onChange={(e) => setGroupName(e.target.value)}
                        autoFocus
                    />

                    <Button disabled={!groupName} onClick={createGroup}>
                        Create
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
