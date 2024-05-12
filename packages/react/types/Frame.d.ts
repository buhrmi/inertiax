declare const Frame: {
    ({ src, id, children }: {
        src: any;
        id?: number;
        children: any;
    }): import("react").ReactElement<{
        'data-inertia-frame-id': number;
    }, string | import("react").JSXElementConstructor<any>>;
    displayName: string;
};
export default Frame;
