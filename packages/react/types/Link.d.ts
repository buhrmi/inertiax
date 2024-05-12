import { FormDataConvertible, Method, PreserveStateOption, Progress } from '@inertiajs/core';
interface BaseInertiaLinkProps {
    as?: string;
    data?: Record<string, FormDataConvertible>;
    href: string;
    method?: Method;
    headers?: Record<string, string>;
    onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
    preserveScroll?: PreserveStateOption;
    preserveState?: PreserveStateOption;
    replace?: boolean;
    only?: string[];
    onCancelToken?: (cancelToken: import('axios').CancelTokenSource) => void;
    onBefore?: () => void;
    onStart?: () => void;
    onProgress?: (progress: Progress) => void;
    onFinish?: () => void;
    onCancel?: () => void;
    onSuccess?: () => void;
    onError?: () => void;
    queryStringArrayFormat?: 'indices' | 'brackets';
}
export type InertiaLinkProps = BaseInertiaLinkProps & Omit<React.HTMLAttributes<HTMLElement>, keyof BaseInertiaLinkProps> & Omit<React.AllHTMLAttributes<HTMLElement>, keyof BaseInertiaLinkProps>;
declare const Link: import("react").ForwardRefExoticComponent<BaseInertiaLinkProps & Omit<import("react").HTMLAttributes<HTMLElement>, keyof BaseInertiaLinkProps> & Omit<import("react").AllHTMLAttributes<HTMLElement>, keyof BaseInertiaLinkProps> & import("react").RefAttributes<unknown>>;
export default Link;
