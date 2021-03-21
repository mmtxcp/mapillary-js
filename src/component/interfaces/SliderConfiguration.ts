import { ComponentConfiguration } from "./ComponentConfiguration";

/**
 * Enumeration for slider mode.
 *
 * @enum {number}
 * @readonly
 *
 * @description Modes for specifying how transitions
 * between nodes are performed in slider mode. Only
 * applicable when the slider component determines
 * that transitions with motion is possilble. When it
 * is not, the stationary mode will be applied.
 */
export enum SliderConfigurationMode {
    /**
     * Transitions with motion.
     *
     * @description The slider component moves the
     * camera between the node origins.
     *
     * In this mode it is not possible to zoom or pan.
     *
     * The slider component falls back to stationary
     * mode when it determines that the pair of nodes
     * does not have a strong enough relation.
     */
    Motion,

    /**
     * Stationary transitions.
     *
     * @description The camera is stationary.
     *
     * In this mode it is possible to zoom and pan.
     */
    Stationary,
}

/**
 * Interface for configuration of slider ids.
 *
 * @interface
 */
export interface SliderConfigurationIds {
    /**
     * Id for the image plane in the background.
     */
    background: string;

    /**
     * Id for the image plane in the foreground.
     */
    foreground: string;
}

/**
 * Interface for configuration of slider component.
 *
 * @interface
 * ```
 * var viewer = new Mapillary.Viewer({
 *     ...
 *     component: {
 *         slider: {
 *             initialPosition: 0.5,
 *             ids: {
 *                 background: '<background-id>',
 *                 foreground: '<foreground-id>',
 *             },
 *             sliderVisible: true,
 *         },
 *     },
 *     ...
 * });
 * ```
 */
export interface SliderConfiguration extends ComponentConfiguration {
    /**
     * Initial position of the slider on the interval [0, 1].
     *
     * @default 1
     */
    initialPosition?: number;

    /**
     * Slider ids.
     */
    ids?: SliderConfigurationIds;

    /**
     * Value indicating whether the slider should be visible.
     *
     * @default true
     */
    sliderVisible?: boolean;

    /**
     * Mode used for image pair transitions.
     */
    mode?: SliderConfigurationMode;
}