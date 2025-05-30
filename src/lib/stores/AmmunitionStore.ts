// src/lib/stores/AmmunitionStore.ts
import { writable } from 'svelte/store';
import { invalidate } from '$app/navigation';

interface AmmunitionStoreState {
    ammunition: AmmunitionData[];
    loading: boolean;
    error: null | string;
}

const initialState: AmmunitionStoreState = {
    ammunition: [],
    loading: false,
    error: null
};

function createAmmunitionStore() {
    const { subscribe, set, update } = writable<AmmunitionStoreState>(initialState);
    
    return {
        set,
        subscribe,
        setAmmunition: (ammo: AmmunitionData[]) => update(state => ({ ...state, ammo })),
        addAmmunition: (ammo: AmmunitionData) => update(state => ({ 
            ...state, 
            ammunition: [...state.ammunition, ammo] 
        })),
        updateAmmunition: (updatedAmmo: AmmunitionData) => {
            update(store => {
                const updatedAmmunition = [...store.ammunition];
                
                const index = updatedAmmunition.findIndex(ammunition => ammunition.id === updatedAmmo.id);
                
                if (index !== -1) {
                    updatedAmmunition[index] = {
                        ...updatedAmmunition[index],
                        ...updatedAmmo
                    };
                } else {
                    updatedAmmunition.push(updatedAmmo);
                }
                
                return {
                    ...store,
                    ammunition: updatedAmmunition,
                    loading: false,
                    error: null
                };
            });
            
            invalidate('pixi');
        }
    };
}

export const AmmunitionStore = createAmmunitionStore();