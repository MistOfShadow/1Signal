declare const googleGemini: {
    readonly chat: {
        readonly completions: {
            readonly create: (opts: any) => Promise<AsyncGenerator<{
                choices: {
                    delta: {
                        content: any;
                    };
                }[];
            }, void, unknown>>;
        };
    };
};
export { googleGemini };
//# sourceMappingURL=client.d.ts.map