
interface SingleEventListener<T extends Event> extends EventListener {
    (evt: T): void;
}

export class CustomEvent {
    private name: string;

    constructor(name: string){
        this.name = name;
    }

    public addEventListener(listener: EventListenerOrEventListenerObject): void {
        document.addEventListener(this.name, listener);
    }

    public removeEventListener(listener: EventListenerOrEventListenerObject): void {
        document.removeEventListener(this.name, listener);
    }

    public dispatchEvent() {
        document.dispatchEvent(new Event(this.name))
    }
}

interface EventProcessor<TResult>{
    (): Promise<TResult[]>
}

interface ProcessorState<TResult> {
    listener: EventListener | undefined,
    result: Promise<TResult[]> | undefined,
}

export class InvertedPromise<T> {
    private _inner: Promise<T> | null;
    private _resolve: ((value: T) => void) | null;
    private _reject: ((reason?: any) => void) | null;
    private _constructionFinished: Promise<void>;

    public constructor() {
        this._resolve = null;
        this._reject = null;
        this._inner = null;
        this._constructionFinished = new Promise((constructionResolve) => {
            this._inner = new Promise((resolve, reject) => {
                this._resolve = resolve;
                this._reject = reject;
                constructionResolve();
            });
        });

    }

    public async inner(): Promise<T> {
        await this._constructionFinished;
        if (!this._inner){
            throw new Error("InvertedPromise._inner is null");
        }
        return await this._inner;
    }

    public async resolve(value: T): Promise<void> {
        await this._constructionFinished;

        if (!this._resolve){
            throw new Error("InvertedPromise._resolve is null");
        }

        this._resolve(value);
    }

    public async reject(value: T): Promise<void> {
        await this._constructionFinished;

        if (!this._reject){
            throw new Error("InvertedPromise._reject is null");
        }

        this._reject(value);
    }
}

export class AccumulatingAwaitableEvent<TResult>{
    private processorMap: Map<EventProcessor<TResult>, ProcessorState<TResult>> = new Map();
    protected results: TResult[] = [];

    private event: CustomEvent;

    private resultCompletionPromise: InvertedPromise<TResult[]>;

    constructor(name: string){
        this.event = new CustomEvent(name);
        this.resultCompletionPromise = new InvertedPromise<TResult[]>();
    }


    public addEventProcessor(processor: EventProcessor<TResult>): void {
        var state: ProcessorState<TResult> = {
            listener: undefined,
            result: undefined,
        };

        if (this.processorMap.has(processor)) {
            throw new Error("This processor is already registered");
        }

        const listener = () => {
            const result = processor();
            state.result = result;
            this.onResultPosted();
        }

        state.listener = listener as EventListener;

        this.event.addEventListener(listener as EventListener);

        this.processorMap.set(processor, state);
    }

    public removeEventProcessor(processor: EventProcessor<TResult>): void {
        const state = this.processorMap.get(processor);

        if (!state) {
            throw new Error("This processor was not registered");
        }

        if (!state.listener){
            throw new Error("This processor's state is not set");
        }

        this.event.removeEventListener(state.listener);

        // Remove cyclical reference so the state & listener can be gc'd :)
        state.listener = undefined;

        this.processorMap.delete(processor);
    }

    private async onResultPosted(): Promise<void> {
        // check if all processors have posted a result promise
        const resultsFound = [];
        for (const p of this.processorMap){
            if (p[1].result) {
                resultsFound.push(p[1].result);
            }
        }

        if (resultsFound.length == this.processorMap.size) {
            // Await all of them.
            const awaitedResultLists = await Promise.all(resultsFound);
            const results = awaitedResultLists.flat();
            
            // we have all our results. switch out the resultCompletionPromise for a fresh one, and clear the results.
            const oldResultCompletionPromise = this.resultCompletionPromise; // Anyone awaiting from here forward should await the next batch of results.
            this.resultCompletionPromise = new InvertedPromise();
            for (const p of this.processorMap){
                p[1].result = undefined;
            }

            if (oldResultCompletionPromise){
                oldResultCompletionPromise.resolve(results);
            }
        }
    }

    public signalAllProcessors(): void {
        this.event.dispatchEvent();
    }

    public waitForAllProcessors(): Promise<TResult[]> {
        return this.resultCompletionPromise.inner();
    }

    public signalAndWaitForAllProcessors(): Promise<TResult[]> {
        this.signalAllProcessors();
        return this.waitForAllProcessors();
    }
}