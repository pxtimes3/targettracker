import { EditorStore, type EditorStoreInterface } from "@/stores/EditorStore";
import { Application, Container, Graphics, type Container as ContainerType } from "pixi.js";
import { get } from "svelte/store";
import { UserSettingsStore, type SettingsInterface } from '../../stores/UserSettingsStore';

export class EditorCrosshair {
    public app: Application;
    public targetContainer: ContainerType;
    public editorStore: EditorStoreInterface;
    public userSettings: SettingsInterface;
    public position: { x: number, y: number };
    public visible: boolean;

    constructor(targetContainer: ContainerType, app: Application) {
        this.app = app;
        this.targetContainer = targetContainer;
        this.editorStore = get(EditorStore);
        this.userSettings = get(UserSettingsStore);
        this.position = {x: 0, y: 0};
        this.visible = true;

        this.initialize()
    }

    public initialize(): void
    {
		const crosshairContainer = new Container();
        crosshairContainer.label = 'editorCrosshair'

        console.log(`UserSettings crosshair: ${this.userSettings.editorcrosshair}`)

		this.targetContainer.addChild(crosshairContainer);

		const nLine = new Graphics();
		nLine.label = 'N-Line';
		crosshairContainer.addChild(nLine);

		const sLine = new Graphics();
		sLine.label = 'S-Line';
		crosshairContainer.addChild(sLine);

		const eLine = new Graphics();
		eLine.label = 'E-Line';
		crosshairContainer.addChild(eLine);

		const wLine = new Graphics();
		wLine.label = 'W-Line';
		crosshairContainer.addChild(wLine);

		this.app.ticker.add(() => {
			if (this.userSettings.editorcrosshair) {
                nLine.visible = true;
                sLine.visible = true;
                wLine.visible = true;
                eLine.visible = true;

				nLine.clear();
				nLine.beginPath();
				nLine.setStrokeStyle({
					width: 4,
					color: 0x000000,
					alpha: 0.3,
					cap: 'round',
					join: 'round'
				});
				const nStartPoint = this.targetContainer.toLocal({x: this.position.x + 0, y: this.position.y - 5});
				const nEndPos = this.targetContainer.toLocal({x: this.position.x + 0, y: this.position.y - 3000});
				nLine.moveTo(nStartPoint.x, nStartPoint.y)
						.lineTo(nEndPos.x, nEndPos.y)
						.stroke();

				sLine.clear();
				sLine.beginPath();
				sLine.setStrokeStyle({
					width: 4,
					color: 0x000000,
					alpha: 0.3,
					cap: 'round',
					join: 'round'
				});
				const sStartPoint = this.targetContainer.toLocal({x: this.position.x + 0, y: this.position.y + 5});
				const sEndPos = this.targetContainer.toLocal({x: this.position.x + 0, y: this.position.y + 3000});
				sLine.moveTo(sStartPoint.x, sStartPoint.y)
						.lineTo(sEndPos.x, sEndPos.y)
						.stroke();

				wLine.clear();
				wLine.beginPath();
				wLine.setStrokeStyle({
					width: 4,
					color: 0x000000,
					alpha: 0.3,
					cap: 'round',
					join: 'round'
				});
				const wStartPoint = this.targetContainer.toLocal({x: this.position.x - 5, y: this.position.y + 0});
				const wEndPos = this.targetContainer.toLocal({x: this.position.x - 3000, y: this.position.y + 0});
				wLine.moveTo(wStartPoint.x, wStartPoint.y)
						.lineTo(wEndPos.x, wEndPos.y)
						.stroke();

				eLine.clear();
				eLine.beginPath();
				eLine.setStrokeStyle({
					width: 4,
					color: 0x000000,
					alpha: 0.3,
					cap: 'round',
					join: 'round'
				});
				const eStartPoint = this.targetContainer.toLocal({x: this.position.x + 5, y: this.position.y + 0});
				const eEndPos = this.targetContainer.toLocal({x: this.position.x + 3000, y: this.position.y + 0});
				eLine.moveTo(eStartPoint.x, eStartPoint.y)
						.lineTo(eEndPos.x, eEndPos.y)
						.stroke();
			} else {
                nLine.visible = false;
                sLine.visible = false;
                wLine.visible = false;
                eLine.visible = false;
            }
		});
	}
}