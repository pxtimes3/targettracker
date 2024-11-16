import { type TargetStoreInterface } from "@/stores/TargetImageStore";
import { UserSettingsStore } from "@/stores/UserSettingsStore";
import { get } from 'svelte/store';

export function calculateReferenceValues(ref: TargetStoreInterface['reference'], target: TargetStoreInterface['target']): {cm: number, px: number}|undefined
{

    if (!ref.measurement || !ref.a || !ref.x || !ref.linelength || !target.image.originalsize[0]) return;
    if (!ref.a[0] || !ref.a[1] || !ref.x[0] || !ref.x[1] ) return;

    const imageDimensions = target.image.originalsize;
    const userSettings = get(UserSettingsStore);

    const pixeldistance = ref.x[0] - ref.a[0];

    // convert length to mm
    let length: number = ref.measurement * 10;
    // convert length to mm if imperial
    if (!userSettings.isometrics) {
        length = length * 2.54;
    }

    const mmToPixels = (mm: number) => {if (!ref.linelength) return; return (mm * ref.linelength) / length};
    const pxToMm = (pixels: number) => {if (!ref.linelength) return; return (pixels * length) / ref.linelength};

    /*
    const linePercentOfTarget = (ref.linelength / target.image.originalsize[0]);
    const totalWidthInMm = (target.image.originalsize[0] * length) / ref.linelength;
    // ---//
    console.log('length:', length); // mm
    console.log('reflinelength:', ref.linelength); // length of referenceline in pixels
    console.log('image.x:', target.image.originalsize[0]); // pixels
    console.log(`line is ${linePercentOfTarget * 100}% of target`);
    console.log(`if line(px) is ${length}mm then the entire image is ${totalWidthInMm} mm wide.`);
    console.log(`then 46mm is ${mmToPixels(46)} px`);
    console.log(`and 100px is ${pxToMm(100)} mm`);
    */

    let result: {cm: number, px: number} = {cm: mmToPixels(10) || 0, px: pxToMm(100) || 0}

    return result;
}
