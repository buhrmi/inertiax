import { InertiaAppResponse, Page } from './types';
type AppCallback = (page: Page) => InertiaAppResponse;
declare const _default: (render: AppCallback, port?: number) => void;
export default _default;
