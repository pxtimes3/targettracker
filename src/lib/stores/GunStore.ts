// src/lib/stores/GunStore.ts
import { writable } from 'svelte/store';

// Define the types
interface GunData {
    id: string;
    name: string;
    type?: string;
    manufacturer?: string;
    model?: string;
    caliber?: string;
    caliberMm?: number;
    barrelLength?: string;
    barrelLengthUnit?: 'metric' | 'imperial';
    barrelTwist?: string;
    barrelTwistUnit?: 'metric' | 'imperial';
    stock?: string;
    note?: string;
    [key: string]: any; // For any additional properties
}

interface CompleteGunData {
    id: string;
    gun_data: GunData;
    targets: any[];
    averages: Record<string, any>;
    [key: string]: any; // For any additional properties
}

interface GunStoreState {
    guns: CompleteGunData[];
    loading: boolean;
    error: null | string;
}

// Type guard functions
function isCompleteGunData(gun: any): gun is CompleteGunData {
    return gun && typeof gun === 'object' && 'gun_data' in gun && 'id' in gun;
}

function isGunData(gun: any): gun is GunData {
    return gun && typeof gun === 'object' && 'id' in gun && !('gun_data' in gun);
}

// Define the initial state
const initialState: GunStoreState = {
    guns: [],
    loading: false,
    error: null
};

// Create the store
function createGunStore() {
    const { subscribe, set, update } = writable<GunStoreState>(initialState);
    
    return {
        subscribe,
        setGuns: (guns: CompleteGunData[]) => update(state => ({ ...state, guns })),
        addGun: (gun: CompleteGunData) => update(state => ({ 
            ...state, 
            guns: [...state.guns, gun] 
        })),
        updateGun: (updatedGun: CompleteGunData | GunData) => {
            update(store => {
                // Determine the ID based on the structure
                let gunId: string | undefined;
                
                if (isCompleteGunData(updatedGun)) {
                    gunId = updatedGun.id;
                } else if (isGunData(updatedGun)) {
                    gunId = updatedGun.id;
                }
                
                if (!gunId) {
                    console.error('Cannot update gun without ID');
                    return store;
                }
                
                const index = store.guns.findIndex(gun => gun.id === gunId);
                
                if (index !== -1) {
                    // Preserve the nested structure
                    if (isCompleteGunData(updatedGun)) {
                        // It's already a CompleteGunData
                        store.guns[index] = {
                            ...store.guns[index],
                            ...updatedGun
                        };
                    } else if (isGunData(updatedGun)) {
                        // It's just the GunData part
                        store.guns[index] = {
                            ...store.guns[index],
                            gun_data: {
                                ...store.guns[index].gun_data,
                                ...updatedGun
                            }
                        };
                    }
                } else {
                    // For new guns, ensure the proper structure
                    let newGun: CompleteGunData;
                    
                    if (isCompleteGunData(updatedGun)) {
                        // It's already a CompleteGunData
                        newGun = updatedGun;
                    } else if (isGunData(updatedGun)) {
                        // It's just the GunData part
                        newGun = { 
                            id: updatedGun.id,
                            gun_data: updatedGun,
                            targets: [],
                            averages: {}
                        };
                    } else {
                        console.error('Invalid gun data format');
                        return store;
                    }
                    
                    store.guns = [...store.guns, newGun];
                }
                
                return store;
            });
        },
    };
}

export const GunStore = createGunStore();