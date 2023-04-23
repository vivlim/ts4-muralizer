import { OutputImage } from "./CropCanvas";
import { AccumulatingAwaitableEvent } from "./CustomAwaitableEvent";

export const ExportCropsEvent = new AccumulatingAwaitableEvent<OutputImage>("exportCropsRequested");
