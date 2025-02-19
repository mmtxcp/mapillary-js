import { bootstrap } from "../Bootstrap";
bootstrap();

import {
    from as observableFrom,
    of as observableOf,
    Subject,
} from "rxjs";

import {
    take,
    first,
    skip,
} from "rxjs/operators";

import { ImageHelper } from "../helper/ImageHelper";

import { Image } from "../../src/graph/Image";
import { APIWrapper } from "../../src/api/APIWrapper";
import { CoreImageEnt } from "../../src/api/ents/CoreImageEnt";
import { Graph } from "../../src/graph/Graph";
import { GraphMode } from "../../src/graph/GraphMode";
import { GraphService } from "../../src/graph/GraphService";
import { NavigationEdgeStatus } from "../../src/graph/interfaces/NavigationEdgeStatus";
import { Sequence } from "../../src/graph/Sequence";
import { DataProvider } from "../helper/ProviderHelper";
import { LngLat } from "../../src/api/interfaces/LngLat";
import { ProviderEventType } from "../../src/api/events/ProviderEventType";
import { GraphMapillaryError } from "../../src/error/GraphMapillaryError";

describe("GraphService.ctor", () => {
    it("should create a graph service", () => {
        const api: APIWrapper = new APIWrapper(new DataProvider());
        const graph: Graph = new Graph(api);

        const graphService: GraphService = new GraphService(graph);

        expect(graphService).toBeDefined();
    });
});

describe("GraphService.cacheBoundingBox$", () => {
    it("should call cache bounding box on graph", (done: Function) => {
        const api: APIWrapper = new APIWrapper(new DataProvider());
        const graph: Graph = new Graph(api);

        const cacheBoundingBoxSpy: jasmine.Spy = spyOn(graph, "cacheBoundingBox$");
        cacheBoundingBoxSpy.and.returnValue(observableOf([]));

        const graphService: GraphService = new GraphService(graph);

        const sw: LngLat = { lat: 0, lng: 1 };
        const ne: LngLat = { lat: 2, lng: 3 };

        graphService.cacheBoundingBox$(sw, ne)
            .subscribe(
                (): void => {
                    expect(cacheBoundingBoxSpy.calls.count()).toBe(1);
                    expect(cacheBoundingBoxSpy.calls.argsFor(0)[0].lat).toBe(0);
                    expect(cacheBoundingBoxSpy.calls.argsFor(0)[0].lng).toBe(1);
                    expect(cacheBoundingBoxSpy.calls.argsFor(0)[1].lat).toBe(2);
                    expect(cacheBoundingBoxSpy.calls.argsFor(0)[1].lng).toBe(3);

                    done();
                });
    });
});

describe("GraphService.cacheCell$", () => {
    it("should call cache cell on graph", (done: Function) => {
        const api = new APIWrapper(new DataProvider());
        const graph = new Graph(api);

        const cacheCellSpy = spyOn(graph, "cacheCell$");
        cacheCellSpy.and.returnValue(observableOf([]));

        const graphService = new GraphService(graph);

        graphService.cacheCell$("cellId")
            .subscribe(
                (): void => {
                    expect(cacheCellSpy.calls.count()).toBe(1);
                    expect(cacheCellSpy.calls.argsFor(0)[0]).toBe("cellId");

                    done();
                });
    });
});


describe("GraphService.dataAdded$", () => {
    it("should call graph", (done: Function) => {
        const dataProvider = new DataProvider();
        const api = new APIWrapper(dataProvider);
        const graph = new Graph(api);

        const updateCellsSpy = spyOn(graph, "updateCells$");
        updateCellsSpy.and.returnValue(observableOf("cellId"));

        const resetSpatialEdgesSpy =
            spyOn(graph, "resetSpatialEdges").and.stub();

        const graphService = new GraphService(graph);

        graphService.dataAdded$
            .subscribe(
                (cellId): void => {
                    expect(cellId).toBe("cellId");

                    expect(updateCellsSpy.calls.count()).toBe(1);
                    expect(resetSpatialEdgesSpy.calls.count()).toBe(1);

                    done();
                });

        dataProvider.fire("datacreate", {
            type: "datacreate",
            target: dataProvider,
            cellIds: ["cellId"],
        });
    });

    it("should reset spatial edges for each updated cell", (done: Function) => {
        const dataProvider = new DataProvider();
        const api = new APIWrapper(dataProvider);
        const graph = new Graph(api);

        const updateCellsSpy = spyOn(graph, "updateCells$");
        const cellIds = ["cellId1", "cellId2"];
        updateCellsSpy.and.returnValue(observableFrom(cellIds.slice()));

        const resetSpatialEdgesSpy =
            spyOn(graph, "resetSpatialEdges").and.stub();

        const graphService = new GraphService(graph);

        let count = 0;
        graphService.dataAdded$
            .subscribe(
                (cellId): void => {
                    count++;
                    expect(cellIds.includes(cellId)).toBe(true);

                    expect(updateCellsSpy.calls.count()).toBe(1);
                    expect(resetSpatialEdgesSpy.calls.count()).toBe(count);

                    if (count === 2) { done(); }
                });

        const type: ProviderEventType = "datacreate";
        dataProvider.fire(type, {
            type,
            target: dataProvider,
            cellIds: cellIds.slice(),
        });
    });
});

describe("GraphService.cacheSequence$", () => {
    it("should cache sequence when graph does not have sequence", () => {
        const api: APIWrapper = new APIWrapper(new DataProvider());
        const graph: Graph = new Graph(api);

        spyOn(graph, "isCachingSequence").and.returnValue(false);
        spyOn(graph, "hasSequence").and.returnValue(false);

        const cacheSequence$: Subject<Graph> = new Subject<Graph>();
        const cacheSequenceSpy: jasmine.Spy = spyOn(graph, "cacheSequence$");
        cacheSequenceSpy.and.returnValue(cacheSequence$);

        const getSequenceSpy: jasmine.Spy = spyOn(graph, "getSequence");
        getSequenceSpy.and.returnValue(graph);

        const graphService: GraphService = new GraphService(graph);

        graphService.cacheSequence$("sequenceId").subscribe(() => { /*noop*/ });

        cacheSequence$.next(graph);

        expect(cacheSequenceSpy.calls.count()).toBe(1);
        expect(getSequenceSpy.calls.count()).toBe(1);
    });

    it("should cache sequence when graph is caching sequence", () => {
        const api: APIWrapper = new APIWrapper(new DataProvider());
        const graph: Graph = new Graph(api);

        spyOn(graph, "isCachingSequence").and.returnValue(true);
        spyOn(graph, "hasSequence").and.returnValue(false);

        const cacheSequence$: Subject<Graph> = new Subject<Graph>();
        const cacheSequenceSpy: jasmine.Spy = spyOn(graph, "cacheSequence$");
        cacheSequenceSpy.and.returnValue(cacheSequence$);

        const getSequenceSpy: jasmine.Spy = spyOn(graph, "getSequence");
        getSequenceSpy.and.returnValue(graph);

        const graphService: GraphService = new GraphService(graph);

        graphService.cacheSequence$("sequenceId").subscribe(() => { /*noop*/ });

        cacheSequence$.next(graph);

        expect(cacheSequenceSpy.calls.count()).toBe(1);
        expect(getSequenceSpy.calls.count()).toBe(1);
    });

    it("should not cache sequence when graph have sequence", () => {
        const api: APIWrapper = new APIWrapper(new DataProvider());
        const graph: Graph = new Graph(api);

        spyOn(graph, "isCachingSequence").and.returnValue(false);
        spyOn(graph, "hasSequence").and.returnValue(true);

        const cacheSequence$: Subject<Graph> = new Subject<Graph>();
        const cacheSequenceSpy: jasmine.Spy = spyOn(graph, "cacheSequence$");
        cacheSequenceSpy.and.returnValue(cacheSequence$);

        const getSequenceSpy: jasmine.Spy = spyOn(graph, "getSequence");
        getSequenceSpy.and.returnValue(graph);

        const graphService: GraphService = new GraphService(graph);

        graphService.cacheSequence$("sequenceId").subscribe(() => { /*noop*/ });

        cacheSequence$.next(graph);

        expect(cacheSequenceSpy.calls.count()).toBe(0);
        expect(getSequenceSpy.calls.count()).toBe(1);
    });
});

describe("GraphService.cacheSequenceNodes$", () => {
    it("should cache sequence images when graph does not have sequence images", () => {
        const api: APIWrapper = new APIWrapper(new DataProvider());
        const graph: Graph = new Graph(api);

        spyOn(graph, "isCachingSequence").and.returnValue(false);
        spyOn(graph, "hasSequence").and.returnValue(true);
        spyOn(graph, "isCachingSequenceNodes").and.returnValue(false);
        spyOn(graph, "hasSequenceNodes").and.returnValue(false);

        const cacheSequenceNodes$: Subject<Graph> = new Subject<Graph>();
        const cacheSequenceNodesSpy: jasmine.Spy = spyOn(graph, "cacheSequenceNodes$");
        cacheSequenceNodesSpy.and.returnValue(cacheSequenceNodes$);

        const getSequenceSpy: jasmine.Spy = spyOn(graph, "getSequence");
        getSequenceSpy.and.returnValue(new Sequence({ id: "skey", image_ids: [] }));

        const graphService: GraphService = new GraphService(graph);

        graphService.cacheSequenceImages$("sequenceId").subscribe(() => { /*noop*/ });

        cacheSequenceNodes$.next(graph);

        expect(cacheSequenceNodesSpy.calls.count()).toBe(1);
        expect(getSequenceSpy.calls.count()).toBe(1);
    });

    it("should cache sequence images when graph is caching sequence images", () => {
        const api: APIWrapper = new APIWrapper(new DataProvider());
        const graph: Graph = new Graph(api);

        spyOn(graph, "isCachingSequence").and.returnValue(false);
        spyOn(graph, "hasSequence").and.returnValue(true);
        spyOn(graph, "isCachingSequenceNodes").and.returnValue(true);
        spyOn(graph, "hasSequenceNodes").and.returnValue(false);

        const cacheSequenceNodes$: Subject<Graph> = new Subject<Graph>();
        const cacheSequenceNodesSpy: jasmine.Spy = spyOn(graph, "cacheSequenceNodes$");
        cacheSequenceNodesSpy.and.returnValue(cacheSequenceNodes$);

        const getSequenceSpy: jasmine.Spy = spyOn(graph, "getSequence");
        getSequenceSpy.and.returnValue(new Sequence({ id: "skey", image_ids: [] }));

        const graphService: GraphService = new GraphService(graph);

        graphService.cacheSequenceImages$("sequenceId").subscribe(() => { /*noop*/ });

        cacheSequenceNodes$.next(graph);

        expect(cacheSequenceNodesSpy.calls.count()).toBe(1);
        expect(getSequenceSpy.calls.count()).toBe(1);
    });

    it("should not cache sequence images when graph has sequence images", () => {
        const api: APIWrapper = new APIWrapper(new DataProvider());
        const graph: Graph = new Graph(api);

        spyOn(graph, "isCachingSequence").and.returnValue(false);
        spyOn(graph, "hasSequence").and.returnValue(true);
        spyOn(graph, "isCachingSequenceNodes").and.returnValue(false);
        spyOn(graph, "hasSequenceNodes").and.returnValue(true);

        const cacheSequenceNodes$: Subject<Graph> = new Subject<Graph>();
        const cacheSequenceNodesSpy: jasmine.Spy = spyOn(graph, "cacheSequenceNodes$");
        cacheSequenceNodesSpy.and.returnValue(cacheSequenceNodes$);

        const getSequenceSpy: jasmine.Spy = spyOn(graph, "getSequence");
        getSequenceSpy.and.returnValue(new Sequence({ id: "skey", image_ids: [] }));

        const graphService: GraphService = new GraphService(graph);

        graphService.cacheSequenceImages$("sequenceId").subscribe(() => { /*noop*/ });

        cacheSequenceNodes$.next(graph);

        expect(cacheSequenceNodesSpy.calls.count()).toBe(0);
        expect(getSequenceSpy.calls.count()).toBe(1);
    });

    it("should supply reference image key if present", () => {
        const api: APIWrapper = new APIWrapper(new DataProvider());
        const graph: Graph = new Graph(api);

        spyOn(graph, "isCachingSequence").and.returnValue(false);
        spyOn(graph, "hasSequence").and.returnValue(true);
        spyOn(graph, "isCachingSequenceNodes").and.returnValue(true);
        spyOn(graph, "hasSequenceNodes").and.returnValue(false);

        const cacheSequenceNodes$: Subject<Graph> = new Subject<Graph>();
        const cacheSequenceNodesSpy: jasmine.Spy = spyOn(graph, "cacheSequenceNodes$");
        cacheSequenceNodesSpy.and.returnValue(cacheSequenceNodes$);

        const getSequenceSpy: jasmine.Spy = spyOn(graph, "getSequence");
        getSequenceSpy.and.returnValue(new Sequence({ id: "skey", image_ids: [] }));

        const graphService: GraphService = new GraphService(graph);

        const sequenceKey: string = "sequenceId";
        const referenceNodeKey: string = "referenceNodeKey";
        graphService.cacheSequenceImages$(sequenceKey, referenceNodeKey).subscribe(() => { /*noop*/ });

        cacheSequenceNodes$.next(graph);

        expect(cacheSequenceNodesSpy.calls.count()).toBe(1);
        expect(cacheSequenceNodesSpy.calls.first().args[0]).toBe(sequenceKey);
        expect(cacheSequenceNodesSpy.calls.first().args[1]).toBe(referenceNodeKey);
        expect(getSequenceSpy.calls.count()).toBe(1);
    });
});

describe("GraphService.graphMode$", () => {
    it("should start in spatial graph mode", (done: () => void) => {
        const api: APIWrapper = new APIWrapper(new DataProvider());
        const graph: Graph = new Graph(api);

        const graphService: GraphService = new GraphService(graph);

        graphService.graphMode$.pipe(
            first())
            .subscribe(
                (mode: GraphMode): void => {
                    expect(mode).toBe(GraphMode.Spatial);
                    done();
                });
    });

    it("should set sequence mode", (done: () => void) => {
        const api: APIWrapper = new APIWrapper(new DataProvider());
        const graph: Graph = new Graph(api);

        const graphService: GraphService = new GraphService(graph);

        graphService.graphMode$.pipe(
            skip(1),
            first())
            .subscribe(
                (mode: GraphMode): void => {
                    expect(mode).toBe(GraphMode.Sequence);
                    done();
                });

        graphService.setGraphMode(GraphMode.Sequence);
    });

    it("should not apply mode if same as current", (done: () => void) => {
        const api: APIWrapper = new APIWrapper(new DataProvider());
        const graph: Graph = new Graph(api);

        const graphService: GraphService = new GraphService(graph);

        let firstEmit: boolean = true;
        graphService.graphMode$.pipe(
            skip(1),
            take(2))
            .subscribe(
                (mode: GraphMode): void => {
                    if (firstEmit) {
                        expect(mode).toBe(GraphMode.Sequence);
                        firstEmit = false;
                    } else {
                        expect(mode).toBe(GraphMode.Spatial);
                        done();
                    }
                });

        graphService.setGraphMode(GraphMode.Sequence);
        graphService.setGraphMode(GraphMode.Sequence);
        graphService.setGraphMode(GraphMode.Spatial);
    });

    it("should cancel spatial edge caching when setting graph mode to sequence", () => {
        spyOn(console, "error").and.stub();

        const api: APIWrapper = new APIWrapper(new DataProvider());
        const graph: Graph = new Graph(api);

        spyOn(graph, "isCachingFull").and.returnValue(false);
        spyOn(graph, "hasNode").and.returnValues(false, true);

        const cacheFull$: Subject<Graph> = new Subject<Graph>();
        const cacheFullSpy: jasmine.Spy = spyOn(graph, "cacheFull$");
        cacheFullSpy.and.returnValue(cacheFull$);

        spyOn(graph, "hasInitializedCache").and.returnValue(false);
        spyOn(graph, "initializeCache").and.stub();

        spyOn(graph, "isCachingNodeSequence").and.returnValue(false);
        spyOn(graph, "hasNodeSequence").and.returnValue(false);

        const cacheNodeSequence$: Subject<Graph> = new Subject<Graph>();
        spyOn(graph, "cacheNodeSequence$").and.returnValue(cacheNodeSequence$);

        spyOn(graph, "hasTiles").and.returnValue(false);

        const cacheTiles$: Subject<Graph>[] = [new Subject<Graph>()];
        spyOn(graph, "cacheTiles$").and.returnValue(cacheTiles$);

        const hasSpatialAreaSpy: jasmine.Spy = spyOn(graph, "hasSpatialArea").and.stub();

        const graphService: GraphService = new GraphService(graph);

        let helper: ImageHelper = new ImageHelper();
        const image: TestNode = new TestNode(helper.createCoreImageEnt());
        image.spatialEdges.cached = false;

        const cacheAssets$: Subject<Image> = new Subject<Image>();
        const cacheAssetsSpy: jasmine.Spy = spyOn(image, "cacheAssets$");
        cacheAssetsSpy.and.returnValue(cacheAssets$);

        spyOn(graph, "getNode").and.returnValue(image);

        graphService.cacheImage$(image.id)
            .subscribe(
                (n: Image): void => {
                    expect(n).toBeDefined();
                });

        cacheFull$.next(graph);

        image.assetsCached = true;
        cacheAssets$.next(image);

        graphService.setGraphMode(GraphMode.Sequence);

        cacheTiles$[0].next(graph);

        expect(hasSpatialAreaSpy.calls.count()).toBe(0);
    });
});

class TestNode extends Image {
    private _assetsCached: boolean;
    private _sequenceEdges: NavigationEdgeStatus;
    private _spatialEdges: NavigationEdgeStatus;

    constructor(core: CoreImageEnt) {
        super(core);

        this._assetsCached = false;
        this._sequenceEdges = { cached: false, edges: [] };
        this._spatialEdges = { cached: false, edges: [] };
    }

    public get assetsCached(): boolean {
        return this._assetsCached;
    }

    public set assetsCached(value: boolean) {
        this._assetsCached = value;
    }

    public get sequenceEdges(): NavigationEdgeStatus {
        return this._sequenceEdges;
    }

    public get spatialEdges(): NavigationEdgeStatus {
        return this._spatialEdges;
    }
}

describe("GraphService.cacheNode$", () => {
    let helper: ImageHelper;

    beforeEach(() => {
        helper = new ImageHelper();
    });

    it("should throw if node did not exist", (done: Function) => {
        spyOn(console, "error").and.stub();

        const api = new APIWrapper(new DataProvider());
        const graph = new Graph(api);

        spyOn(graph, "isCachingFull").and.returnValue(false);
        const hasNodeSpy = spyOn(graph, "hasNode")
            .and.returnValues(false, false);

        const cacheFull$ = new Subject<Graph>();
        const cacheFullSpy = spyOn(graph, "cacheFull$");
        cacheFullSpy.and.returnValue(cacheFull$);

        const graphService = new GraphService(graph);

        const image = new TestNode(helper.createCoreImageEnt());

        graphService.cacheImage$(image.id)
            .subscribe(
                (): void => fail(),
                (error): void => {
                    expect(error).toBeInstanceOf(GraphMapillaryError);
                    expect(cacheFullSpy.calls.count()).toBe(1);
                    expect(hasNodeSpy.calls.count()).toBe(2);

                    done();
                });

        cacheFull$.next(graph);
    });


    it("should cache and return image", (done: Function) => {
        const api: APIWrapper = new APIWrapper(new DataProvider());
        const graph: Graph = new Graph(api);

        spyOn(graph, "isCachingFull").and.returnValue(false);
        spyOn(graph, "hasNode").and.returnValues(false, true);

        const cacheFull$: Subject<Graph> = new Subject<Graph>();
        const cacheFullSpy: jasmine.Spy = spyOn(graph, "cacheFull$");
        cacheFullSpy.and.returnValue(cacheFull$);

        spyOn(graph, "hasInitializedCache").and.returnValue(false);
        const initializeCacheSpy: jasmine.Spy = spyOn(graph, "initializeCache").and.stub();

        spyOn(graph, "isCachingNodeSequence").and.returnValue(false);
        spyOn(graph, "hasNodeSequence").and.returnValue(false);

        const cacheNodeSequence$: Subject<Graph> = new Subject<Graph>();
        spyOn(graph, "cacheNodeSequence$").and.returnValue(cacheNodeSequence$);

        spyOn(graph, "hasTiles").and.returnValue(false);

        const cacheTiles$: Subject<Graph>[] = [new Subject<Graph>()];
        spyOn(graph, "cacheTiles$").and.returnValue(cacheTiles$);

        const graphService: GraphService = new GraphService(graph);

        const image: TestNode = new TestNode(helper.createCoreImageEnt());

        const cacheAssets$: Subject<Image> = new Subject<Image>();
        const cacheAssetsSpy: jasmine.Spy = spyOn(image, "cacheAssets$");
        cacheAssetsSpy.and.returnValue(cacheAssets$);

        spyOn(graph, "getNode").and.returnValue(image);

        graphService.cacheImage$(image.id)
            .subscribe(
                (): void => {
                    expect(cacheFullSpy.calls.count()).toBe(1);
                    expect(initializeCacheSpy.calls.count()).toBe(1);
                    expect(cacheAssetsSpy.calls.count()).toBe(1);

                    done();
                });

        cacheFull$.next(graph);

        image.assetsCached = true;
        cacheAssets$.next(image);
    });

    it("should fill and return image", (done: Function) => {
        const api: APIWrapper = new APIWrapper(new DataProvider());
        const graph: Graph = new Graph(api);

        spyOn(graph, "isCachingFull").and.returnValue(false);
        spyOn(graph, "hasNode").and.returnValue(true);
        spyOn(graph, "isCachingFill").and.returnValue(false);

        const cacheFill$: Subject<Graph> = new Subject<Graph>();
        const cacheFillSpy: jasmine.Spy = spyOn(graph, "cacheFill$");
        cacheFillSpy.and.returnValue(cacheFill$);

        spyOn(graph, "hasInitializedCache").and.returnValue(false);
        spyOn(graph, "initializeCache").and.stub();

        spyOn(graph, "isCachingNodeSequence").and.returnValue(false);
        spyOn(graph, "hasNodeSequence").and.returnValue(false);

        const cacheNodeSequence$: Subject<Graph> = new Subject<Graph>();
        spyOn(graph, "cacheNodeSequence$").and.returnValue(cacheNodeSequence$);

        spyOn(graph, "hasTiles").and.returnValue(false);

        const cacheTiles$: Subject<Graph>[] = [new Subject<Graph>()];
        spyOn(graph, "cacheTiles$").and.returnValue(cacheTiles$);

        const graphService: GraphService = new GraphService(graph);

        const image: TestNode = new TestNode(helper.createCoreImageEnt());

        const cacheAssets$: Subject<Image> = new Subject<Image>();
        const cacheAssetsSpy: jasmine.Spy = spyOn(image, "cacheAssets$");
        cacheAssetsSpy.and.returnValue(cacheAssets$);

        spyOn(graph, "getNode").and.returnValue(image);

        graphService.cacheImage$(image.id)
            .subscribe(
                (): void => {
                    expect(cacheFillSpy.calls.count()).toBe(1);

                    done();
                });

        cacheFill$.next(graph);

        image.assetsCached = true;
        cacheAssets$.next(image);
    });

    it("should cache image sequence and sequence edges", () => {
        const api: APIWrapper = new APIWrapper(new DataProvider());
        const graph: Graph = new Graph(api);

        spyOn(graph, "isCachingFull").and.returnValue(false);
        spyOn(graph, "hasNode").and.returnValues(false, true);

        const cacheFull$: Subject<Graph> = new Subject<Graph>();
        spyOn(graph, "cacheFull$").and.returnValue(cacheFull$);

        spyOn(graph, "hasInitializedCache").and.returnValue(false);
        spyOn(graph, "initializeCache").and.stub();

        spyOn(graph, "isCachingNodeSequence").and.returnValue(false);
        spyOn(graph, "hasNodeSequence").and.returnValue(false);

        const cacheNodeSequence$: Subject<Graph> = new Subject<Graph>();
        const cacheNodeSequenceSpy: jasmine.Spy = spyOn(graph, "cacheNodeSequence$");
        cacheNodeSequenceSpy.and.returnValue(cacheNodeSequence$);

        const cacheSequenceEdgesSpy: jasmine.Spy = spyOn(graph, "cacheSequenceEdges").and.stub();

        spyOn(graph, "hasTiles").and.returnValue(false);

        const cacheTiles$: Subject<Graph>[] = [new Subject<Graph>()];
        spyOn(graph, "cacheTiles$").and.returnValue(cacheTiles$);

        const graphService: GraphService = new GraphService(graph);

        const image: TestNode = new TestNode(helper.createCoreImageEnt());

        const cacheAssets$: Subject<Image> = new Subject<Image>();
        spyOn(image, "cacheAssets$").and.returnValue(cacheAssets$);

        spyOn(graph, "getNode").and.returnValue(image);

        graphService.cacheImage$(image.id).subscribe(() => { /*noop*/ });

        cacheFull$.next(graph);

        cacheNodeSequence$.next(graph);

        expect(cacheNodeSequenceSpy.calls.count()).toBe(1);
        expect(cacheNodeSequenceSpy.calls.first().args.length).toBe(1);
        expect(cacheNodeSequenceSpy.calls.first().args[0]).toBe(image.id);

        expect(cacheSequenceEdgesSpy.calls.count()).toBe(1);
        expect(cacheSequenceEdgesSpy.calls.first().args.length).toBe(1);
        expect(cacheSequenceEdgesSpy.calls.first().args[0]).toBe(image.id);
    });

    it("should cache spatial edges", () => {
        const api: APIWrapper = new APIWrapper(new DataProvider());
        const graph: Graph = new Graph(api);

        spyOn(graph, "isCachingFull").and.returnValue(false);
        spyOn(graph, "hasNode").and.returnValues(false, true);

        const cacheFull$: Subject<Graph> = new Subject<Graph>();
        spyOn(graph, "cacheFull$").and.returnValue(cacheFull$);

        spyOn(graph, "hasInitializedCache").and.returnValue(true);

        spyOn(graph, "isCachingNodeSequence").and.returnValue(false);
        spyOn(graph, "hasNodeSequence").and.returnValue(true);

        spyOn(graph, "hasTiles").and.returnValue(true);
        spyOn(graph, "hasSpatialArea").and.returnValue(true);

        const cacheSpatialEdgesSpy: jasmine.Spy = spyOn(graph, "cacheSpatialEdges").and.stub();

        const graphService: GraphService = new GraphService(graph);

        const image: TestNode = new TestNode(helper.createCoreImageEnt());
        image.sequenceEdges.cached = true;

        const cacheAssets$: Subject<Image> = new Subject<Image>();
        spyOn(image, "cacheAssets$").and.returnValue(cacheAssets$);

        spyOn(graph, "getNode").and.returnValue(image);

        graphService.cacheImage$(image.id).subscribe(() => { /*noop*/ });

        cacheFull$.next(graph);

        expect(cacheSpatialEdgesSpy.calls.count()).toBe(1);
        expect(cacheSpatialEdgesSpy.calls.first().args.length).toBe(1);
        expect(cacheSpatialEdgesSpy.calls.first().args[0]).toBe(image.id);
    });

    it("should cache spatial edges if in spatial mode", () => {
        const api: APIWrapper = new APIWrapper(new DataProvider());
        const graph: Graph = new Graph(api);

        spyOn(graph, "isCachingFull").and.returnValue(false);
        spyOn(graph, "hasNode").and.returnValues(false, true);

        const cacheFull$: Subject<Graph> = new Subject<Graph>();
        spyOn(graph, "cacheFull$").and.returnValue(cacheFull$);

        spyOn(graph, "hasInitializedCache").and.returnValue(true);

        spyOn(graph, "isCachingNodeSequence").and.returnValue(false);
        spyOn(graph, "hasNodeSequence").and.returnValue(true);

        const hasTilesSpy: jasmine.Spy = spyOn(graph, "hasTiles");
        hasTilesSpy.and.returnValue(true);

        spyOn(graph, "hasSpatialArea").and.returnValue(true);

        const cachesSpatialEdgesSpy: jasmine.Spy = spyOn(graph, "cacheSpatialEdges").and.stub();

        const graphService: GraphService = new GraphService(graph);

        const image: TestNode = new TestNode(helper.createCoreImageEnt());
        image.sequenceEdges.cached = true;

        const cacheAssets$: Subject<Image> = new Subject<Image>();
        spyOn(image, "cacheAssets$").and.returnValue(cacheAssets$);

        spyOn(graph, "getNode").and.returnValue(image);

        graphService.setGraphMode(GraphMode.Spatial);

        graphService.cacheImage$(image.id).subscribe(() => { /*noop*/ });

        cacheFull$.next(graph);

        expect(hasTilesSpy.calls.count()).toBe(1);
        expect(cachesSpatialEdgesSpy.calls.count()).toBe(1);
    });

    it("should not cache spatial edges if in sequence mode", () => {
        const api: APIWrapper = new APIWrapper(new DataProvider());
        const graph: Graph = new Graph(api);

        spyOn(graph, "isCachingFull").and.returnValue(false);
        spyOn(graph, "hasNode").and.returnValues(false, true);

        const cacheFull$: Subject<Graph> = new Subject<Graph>();
        spyOn(graph, "cacheFull$").and.returnValue(cacheFull$);

        spyOn(graph, "hasInitializedCache").and.returnValue(true);

        spyOn(graph, "isCachingNodeSequence").and.returnValue(false);
        spyOn(graph, "hasNodeSequence").and.returnValue(true);

        const hasTilesSpy: jasmine.Spy = spyOn(graph, "hasTiles").and.stub();

        const graphService: GraphService = new GraphService(graph);

        const image: TestNode = new TestNode(helper.createCoreImageEnt());
        image.sequenceEdges.cached = true;

        const cacheAssets$: Subject<Image> = new Subject<Image>();
        spyOn(image, "cacheAssets$").and.returnValue(cacheAssets$);

        spyOn(graph, "getNode").and.returnValue(image);

        graphService.setGraphMode(GraphMode.Sequence);

        graphService.cacheImage$(image.id).subscribe(() => { /*noop*/ });

        cacheFull$.next(graph);

        expect(hasTilesSpy.calls.count()).toBe(0);
    });
});

describe("GraphService.reset$", () => {
    let helper: ImageHelper;

    beforeEach(() => {
        helper = new ImageHelper();
    });

    it("should abort image caching and throw", () => {
        spyOn(console, "error").and.stub();

        const api: APIWrapper = new APIWrapper(new DataProvider());
        const graph: Graph = new Graph(api);

        spyOn(graph, "isCachingFull").and.returnValue(false);
        spyOn(graph, "hasNode").and.returnValues(false, true);

        const cacheFull$: Subject<Graph> = new Subject<Graph>();
        const cacheFullSpy: jasmine.Spy = spyOn(graph, "cacheFull$");
        cacheFullSpy.and.returnValue(cacheFull$);

        spyOn(graph, "hasInitializedCache").and.returnValue(false);
        const initializeCacheSpy: jasmine.Spy = spyOn(graph, "initializeCache").and.stub();

        spyOn(graph, "isCachingNodeSequence").and.returnValue(false);
        spyOn(graph, "hasNodeSequence").and.returnValue(false);

        const cacheNodeSequence$: Subject<Graph> = new Subject<Graph>();
        spyOn(graph, "cacheNodeSequence$").and.returnValue(cacheNodeSequence$);

        spyOn(graph, "hasTiles").and.returnValue(false);

        const cacheTiles$: Subject<Graph>[] = [new Subject<Graph>()];
        spyOn(graph, "cacheTiles$").and.returnValue(cacheTiles$);

        const graphService: GraphService = new GraphService(graph);

        const image: TestNode = new TestNode(helper.createCoreImageEnt());

        const cacheAssets$: Subject<Image> = new Subject<Image>();
        const cacheAssetsSpy: jasmine.Spy = spyOn(image, "cacheAssets$");
        cacheAssetsSpy.and.returnValue(cacheAssets$);

        spyOn(graph, "getNode").and.returnValue(image);

        graphService.cacheImage$(image.id)
            .subscribe(
                (): void => { return; },
                (e: Error): void => {
                    expect(e).toBeDefined();
                });

        graphService.reset$([]);

        cacheFull$.next(graph);

        image.assetsCached = true;
        cacheAssets$.next(image);

        expect(cacheFullSpy.calls.count()).toBe(1);
        expect(initializeCacheSpy.calls.count()).toBe(0);
        expect(cacheAssetsSpy.calls.count()).toBe(0);
    });

    it("should cancel sequence edge caching", () => {
        spyOn(console, "error").and.stub();

        const api: APIWrapper = new APIWrapper(new DataProvider());
        const graph: Graph = new Graph(api);

        spyOn(graph, "isCachingFull").and.returnValue(false);
        spyOn(graph, "hasNode").and.returnValues(false, true);

        const cacheFull$: Subject<Graph> = new Subject<Graph>();
        const cacheFullSpy: jasmine.Spy = spyOn(graph, "cacheFull$");
        cacheFullSpy.and.returnValue(cacheFull$);

        spyOn(graph, "hasInitializedCache").and.returnValue(false);
        spyOn(graph, "initializeCache").and.stub();

        spyOn(graph, "isCachingNodeSequence").and.returnValue(false);
        spyOn(graph, "hasNodeSequence").and.returnValue(false);

        const cacheNodeSequence$: Subject<Graph> = new Subject<Graph>();
        spyOn(graph, "cacheNodeSequence$").and.returnValue(cacheNodeSequence$);

        const cacheSequenceEdgesSpy: jasmine.Spy = spyOn(graph, "cacheSequenceEdges").and.stub();

        spyOn(graph, "hasTiles").and.returnValue(false);

        const cacheTiles$: Subject<Graph>[] = [new Subject<Graph>()];
        spyOn(graph, "cacheTiles$").and.returnValue(cacheTiles$);

        const graphService: GraphService = new GraphService(graph);

        const image: TestNode = new TestNode(helper.createCoreImageEnt());
        image.spatialEdges.cached = false;

        const cacheAssets$: Subject<Image> = new Subject<Image>();
        const cacheAssetsSpy: jasmine.Spy = spyOn(image, "cacheAssets$");
        cacheAssetsSpy.and.returnValue(cacheAssets$);

        spyOn(graph, "getNode").and.returnValue(image);

        graphService.cacheImage$(image.id)
            .subscribe(
                (n: Image): void => {
                    expect(n).toBeDefined();
                });

        cacheFull$.next(graph);

        image.assetsCached = true;
        cacheAssets$.next(image);

        graphService.reset$([]);

        cacheNodeSequence$.next(graph);

        expect(cacheSequenceEdgesSpy.calls.count()).toBe(0);
    });

    it("should cancel spatial edge caching", () => {
        spyOn(console, "error").and.stub();

        const api: APIWrapper = new APIWrapper(new DataProvider());
        const graph: Graph = new Graph(api);

        spyOn(graph, "isCachingFull").and.returnValue(false);
        spyOn(graph, "hasNode").and.returnValues(false, true);

        const cacheFull$: Subject<Graph> = new Subject<Graph>();
        const cacheFullSpy: jasmine.Spy = spyOn(graph, "cacheFull$");
        cacheFullSpy.and.returnValue(cacheFull$);

        spyOn(graph, "hasInitializedCache").and.returnValue(false);
        spyOn(graph, "initializeCache").and.stub();

        spyOn(graph, "isCachingNodeSequence").and.returnValue(false);
        spyOn(graph, "hasNodeSequence").and.returnValue(false);

        const cacheNodeSequence$: Subject<Graph> = new Subject<Graph>();
        spyOn(graph, "cacheNodeSequence$").and.returnValue(cacheNodeSequence$);

        spyOn(graph, "hasTiles").and.returnValue(false);

        const cacheTiles$: Subject<Graph>[] = [new Subject<Graph>()];
        spyOn(graph, "cacheTiles$").and.returnValue(cacheTiles$);

        const hasSpatialAreaSpy: jasmine.Spy = spyOn(graph, "hasSpatialArea").and.stub();

        const graphService: GraphService = new GraphService(graph);

        const image: TestNode = new TestNode(helper.createCoreImageEnt());
        image.spatialEdges.cached = false;

        const cacheAssets$: Subject<Image> = new Subject<Image>();
        const cacheAssetsSpy: jasmine.Spy = spyOn(image, "cacheAssets$");
        cacheAssetsSpy.and.returnValue(cacheAssets$);

        spyOn(graph, "getNode").and.returnValue(image);

        graphService.cacheImage$(image.id)
            .subscribe(
                (n: Image): void => {
                    expect(n).toBeDefined();
                });

        cacheFull$.next(graph);

        image.assetsCached = true;
        cacheAssets$.next(image);

        graphService.reset$([]);

        cacheTiles$[0].next(graph);

        expect(hasSpatialAreaSpy.calls.count()).toBe(0);
    });
});

describe("GraphService.setFilter$", () => {
    let helper: ImageHelper;

    beforeEach(() => {
        helper = new ImageHelper();
    });

    it("should reset spatial edges and set filter", () => {
        const api: APIWrapper = new APIWrapper(new DataProvider());
        const graph: Graph = new Graph(api);

        const resetSpatialEdgesSpy: jasmine.Spy = spyOn(graph, "resetSpatialEdges").and.stub();
        const setFilterSpy: jasmine.Spy = spyOn(graph, "setFilter").and.stub();

        const graphService: GraphService = new GraphService(graph);

        graphService.setFilter$(["==", "sequenceId", "skey"]).subscribe(() => { /*noop*/ });

        expect(resetSpatialEdgesSpy.calls.count()).toBe(1);

        expect(setFilterSpy.calls.count()).toBe(1);
        expect(setFilterSpy.calls.first().args.length).toBe(1);
        expect(setFilterSpy.calls.first().args[0].length).toBe(3);
        expect(setFilterSpy.calls.first().args[0][0]).toBe("==");
        expect(setFilterSpy.calls.first().args[0][1]).toBe("sequenceId");
        expect(setFilterSpy.calls.first().args[0][2]).toBe("skey");
    });

    it("should cancel spatial subscriptions", () => {
        const api: APIWrapper = new APIWrapper(new DataProvider());
        const graph: Graph = new Graph(api);

        spyOn(graph, "isCachingFull").and.returnValue(false);
        spyOn(graph, "hasNode").and.returnValues(false, true);

        const cacheFull$: Subject<Graph> = new Subject<Graph>();
        const cacheFullSpy: jasmine.Spy = spyOn(graph, "cacheFull$");
        cacheFullSpy.and.returnValue(cacheFull$);

        spyOn(graph, "hasInitializedCache").and.returnValue(false);
        spyOn(graph, "initializeCache").and.stub();

        spyOn(graph, "isCachingNodeSequence").and.returnValue(false);
        spyOn(graph, "hasNodeSequence").and.returnValue(false);

        const cacheNodeSequence$: Subject<Graph> = new Subject<Graph>();
        spyOn(graph, "cacheNodeSequence$").and.returnValue(cacheNodeSequence$);

        spyOn(graph, "hasTiles").and.returnValue(false);

        const cacheTiles$: Subject<Graph>[] = [new Subject<Graph>()];
        spyOn(graph, "cacheTiles$").and.returnValue(cacheTiles$);

        const hasSpatialAreaSpy: jasmine.Spy = spyOn(graph, "hasSpatialArea").and.stub();

        spyOn(graph, "resetSpatialEdges").and.stub();
        spyOn(graph, "setFilter").and.stub();

        const graphService: GraphService = new GraphService(graph);

        const image: TestNode = new TestNode(helper.createCoreImageEnt());
        image.spatialEdges.cached = false;

        const cacheAssets$: Subject<Image> = new Subject<Image>();
        const cacheAssetsSpy: jasmine.Spy = spyOn(image, "cacheAssets$");
        cacheAssetsSpy.and.returnValue(cacheAssets$);

        spyOn(graph, "getNode").and.returnValue(image);

        graphService.cacheImage$(image.id)
            .subscribe(
                (n: Image): void => {
                    expect(n).toBeDefined();
                });

        cacheFull$.next(graph);

        image.assetsCached = true;
        cacheAssets$.next(image);

        graphService.setFilter$(["==", "sequenceId", "skey"]).subscribe(() => { /*noop*/ });

        cacheTiles$[0].next(graph);

        expect(hasSpatialAreaSpy.calls.count()).toBe(0);
    });
});

describe("GraphService.uncache$", () => {
    it("should call graph uncache", () => {
        const api: APIWrapper = new APIWrapper(new DataProvider());
        const graph: Graph = new Graph(api);

        const uncacheSpy: jasmine.Spy = spyOn(graph, "uncache").and.stub();

        const graphService: GraphService = new GraphService(graph);

        graphService.uncache$(["nKey"], ["cKey"], "sKey").subscribe(() => { /*noop*/ });

        expect(uncacheSpy.calls.count()).toBe(1);
        expect(uncacheSpy.calls.first().args.length).toBe(3);
        expect(uncacheSpy.calls.first().args[0].length).toBe(1);
        expect(uncacheSpy.calls.first().args[0][0]).toBe("nKey");
        expect(uncacheSpy.calls.first().args[1].length).toBe(1);
        expect(uncacheSpy.calls.first().args[1][0]).toBe("cKey");
        expect(uncacheSpy.calls.first().args[2]).toBe("sKey");
    });
});
