import { LatLon } from "../../api/interfaces/LatLon";
import { Component } from "../../component/Component";
import { ComponentConfiguration }
    from "../../component/interfaces/ComponentConfiguration";
import { NavigationDirection } from "../../graph/edge/NavigationDirection";
import { FilterExpression } from "../../graph/FilterExpression";
import { Node } from "../../graph/Node";
import { RenderMode } from "../../render/RenderMode";
import { TransitionMode } from "../../state/TransitionMode";
import { ViewerEvent } from "../events/ViewerEvent";

import { ICustomRenderer } from "./ICustomRenderer";
import { PointOfView } from "./PointOfView";

export interface IViewer {
    readonly isNavigable: boolean;
    activateCombinedPanning(): void;
    activateComponent(name: string): void;
    activateCover(): void;
    addCustomRenderer(renderer: ICustomRenderer): void;
    deactivateCombinedPanning(): void;
    deactivateComponent(name: string): void;
    deactivateCover(): void;
    fire<T>(
        type: ViewerEvent,
        event: T): void;
    getBearing(): Promise<number>;
    getCanvas(): HTMLCanvasElement;
    getCanvasContainer(): HTMLDivElement;
    getCenter(): Promise<number[]>;
    getComponent<TComponent extends Component<ComponentConfiguration>>(
        name: string): TComponent;
    getContainer(): HTMLElement;
    getFieldOfView(): Promise<number>;
    getPointOfView(): Promise<PointOfView>;
    getPosition(): Promise<LatLon>;
    getZoom(): Promise<number>;
    hasCustomRenderer(rendererId: string): boolean;
    moveDir(direction: NavigationDirection): Promise<Node>;
    moveTo(imageId: string): Promise<Node>;
    off<T>(
        type: ViewerEvent,
        handler: (event: T) => void): void;
    on<T>(
        type: ViewerEvent,
        handler: (event: T) => void): void;
    project(latLon: LatLon): Promise<number[]>;
    projectFromBasic(basicPoint: number[]): Promise<number[]>;
    remove(): void;
    removeCustomRenderer(rendererId: string): void;
    resize(): void;
    setCenter(center: number[]): void;
    setFieldOfView(fov: number): void;
    setFilter(filter: FilterExpression): Promise<void>;
    setRenderMode(renderMode: RenderMode): void;
    setTransitionMode(transitionMode: TransitionMode): void;
    setUserToken(userToken?: string): Promise<void>;
    setZoom(zoom: number): void;
    triggerRerender(): void;
    unproject(pixelPoint: number[]): Promise<LatLon>;
    unprojectToBasic(pixelPoint: number[]): Promise<number[]>;
}