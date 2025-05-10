// src/lib/stores/GunStore.ts
import { writable } from 'svelte/store';
import { invalidate } from '$app/navigation';

// Define the types
interface GunData {
    id: string;
    name: string;
    type?: string|null;
    manufacturer?: string|null;
    model?: string|null;
    caliber?: string|null;
    caliberMm?: number|null;
    barrelLength?: number|string|null;
    barrelLengthUnit?: 'metric' | 'imperial' | null | undefined;
    barrelTwist?: string|null;
    barrelTwistUnit?: 'metric' | 'imperial' | null;
    stock?: string|null;
    note?: string|null;
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
    guns: GunData[];
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
        set,
        subscribe,
        setGuns: (guns: GunData[]) => update(state => ({ ...state, guns })),
        addGun: (gun: GunData) => update(state => ({ 
            ...state, 
            guns: [...state.guns, gun] 
        })),
        // updateGun: (updatedGun: CompleteGunData | GunData) => {
        //     update(store => {
        //         // Determine the ID based on the structure
        //         let gunId: string | undefined;
                
        //         if (isCompleteGunData(updatedGun)) {
        //             gunId = updatedGun.id;
        //         } else if (isGunData(updatedGun)) {
        //             gunId = updatedGun.id;
        //         }
                
        //         if (!gunId) {
        //             console.error('Cannot update gun without ID');
        //             return store;
        //         }
                
        //         const index = store.guns.findIndex(gun => gun.id === gunId);
                
        //         if (index !== -1) {
        //             // Preserve the nested structure
        //             if (isCompleteGunData(updatedGun)) {
        //                 // It's already a CompleteGunData
        //                 store.guns[index] = {
        //                     ...store.guns[index],
        //                     ...updatedGun
        //                 };
        //             } else if (isGunData(updatedGun)) {
        //                 // It's just the GunData part
        //                 store.guns[index] = {
        //                     ...store.guns[index],
        //                     gun_data: {
        //                         ...store.guns[index].gun_data,
        //                         ...updatedGun
        //                     }
        //                 };
        //             }
        //         } else {
        //             // For new guns, ensure the proper structure
        //             let newGun: CompleteGunData;
                    
        //             if (isCompleteGunData(updatedGun)) {
        //                 // It's already a CompleteGunData
        //                 newGun = updatedGun;
        //             } else if (isGunData(updatedGun)) {
        //                 // It's just the GunData part
        //                 newGun = { 
        //                     id: updatedGun.id,
        //                     gun_data: updatedGun,
        //                     targets: [],
        //                     averages: {}
        //                 };
        //             } else {
        //                 console.error('Invalid gun data format');
        //                 return store;
        //             }
                    
        //             store.guns = [...store.guns, newGun];
        //         }
                
        //         return store;
        //     });
        // },
        updateGun: (updatedGun: GunData) => {
            update(store => {
                // Make a copy of the guns array
                const updatedGuns = [...store.guns];
                
                // Check if the gun already exists
                const index = updatedGuns.findIndex(gun => gun.id === updatedGun.id);
                
                if (index !== -1) {
                    // Update existing gun
                    updatedGuns[index] = {
                        ...updatedGuns[index],
                        ...updatedGun
                    };
                } else {
                    // Add new gun
                    updatedGuns.push(updatedGun);
                }
                
                return {
                    ...store,
                    guns: updatedGuns,
                    loading: false,
                    error: null
                };
            });
            
            invalidate('pixi');
        }
    };
}

export const GunStore = createGunStore();