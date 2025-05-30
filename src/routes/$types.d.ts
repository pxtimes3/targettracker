import { z } from 'zod';
import type { Ammunition, Gun, User, ammunitionTypeEnum, PrimerType } from '@/server/db/schema';
import { loadVariation, measurementsEnum, angleUnitEnum, weightEnum } from '../lib/server/db/schema';
import type { UUIDTypes } from 'uuid';
import type { v4 as uuidv4 } from 'uuid';
import { v4 as uuidv4 } from 'uuid';

declare global {
    // imports av enums från schema.ts
    type AmmunitionType = import('@/server/db/schema').AmmunitionType;
    type PrimerType = import('@/server/db/schema').PrimerType;
    type GunType = import('@/server/db/schema').GunType;
    type MeasurementsType = import('@/server/db/schema').MeasurementsType; 
    type AngleUnitType = import('@/server/db/schema').AngleUnitType;
    type WeightType = import('@/server/db/schema').WeightType;

    interface Caliber {
        id: string;
        name: string;
        category: string;
        mm: string;
        in: string;
        aliases: string[];
    }

    interface PageData {
        activated: boolean;
        error: string | null;
    }

    interface Invites {
        "id": string,
        "code": string,
        "user": string,
        "invitee_email": string|null,
        "invite_sent": Date,
        "accepted": boolean,
        "active": boolean
    }

    interface SendInviteData {
        recipient: string;
        inviteCode: string;
        senderUserName: string;
    }

    type AnalysisDbType = z.infer<typeof AnalysisSchema>;
    type AnalysisRequest = z.infer<typeof AnalysisRequestSchema>;

    interface AddEditGunProps {
        data: GunData;
        gunTypes: GunType;
        onSuccess?: (id: string) => void;
    }

    interface GunData extends Gun {
        type: GunData<type>|undefined;
        error: { message: string };
    };
    

    interface EventData {};
    interface TargetData {};
    
    interface BaseRecipe {
        id: string|undefined;
        userId: string,
        createdAt: string,
        name: string,
        isFactory: boolean,
        caliber: string,
        caliberMm: number,
        caliberUnit: MeasurementsType,
        manufacturerCase: string,
        caseName: string,
        manufacturerBullet: string,
        bulletId?: string,
        bulletName: string,
        bulletWeight: number,
        bulletWeightUnit: WeightType,
        bulletBcG1: number,
        bulletBcG7: number,
        bulletSd: number,
        manufacturerPropellant: string,
        propellantName: string,
        note: string;
        date: string;
        type: AmmunitionType|undefined;
    }

    interface LoadVariation {
        id: string;
        recipeId: string;
        createdAt: string;
        name: string;
        propellantCharge: number|null;
        propellantWeightUnit: WeightType;
        manufacturerPrimer: string,
        primerType: PrimerType,
        primerName: string,
        cartridgeOal: number;
        cartridgeOalUnit: MeasurementsType;
        lotNumber: string;
        date: string;
        note: string;
        type: string|undefined;
    }

    interface AmmunitionData {
        baseRecipe: BaseRecipe;
        loadVariation: LoadVariation;
    }

    interface GunEditPageServerData {
        user: User;
        gundata: GunData;
        gunTypes: GunType;
    }

    interface AmmunuitionAddEditPageServerData {
        user: User;
        data: AmmunitionData;
        ammunitionTypes: AmmunitionType;
    }

    interface BulletData {
        "id": string,
        "manufacturer": string,
        "name": string,
        "caliber": number,
        "caliberMm": number,
        "weight": number,
        "weightMetric": number,
        "sd": number,
        "bc1": number,
        "bc7": number,
        "type": string
    }

    interface InfoPanelData {
        data: User;
        gunsEvents: any;
    }

    // src/routes/pixi
    type GunWithTarget = {
        gun: Gun;
        target: Targets | null; // null om inga targets -.-
    }
    
    type EventWithTarget = {
        event: Events;
        targets: Targets | null;
    }
    
    interface GunsEvents {
        guns: Gun[];
        events: Events[];
        ammunition: Ammunition[];
    }
}

const AnalysisSchema = z.object({
    id: z.string().uuid(),
    submitted: z.date(),
    updated: z.date(),
    user_id: z.string().uuid(),
    image_name: z.string().uuid()
});

const AnalysisRequestSchema = z.object({
    user_id: z.string(),
    imagename: z.string().uuid(),
});

