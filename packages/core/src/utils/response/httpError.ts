export class HttpError extends Error {
    constructor(
        public statusCode: number,
        public message: string,
        public developerMessage?: string,
    ) {
        super(message);
    }
}
