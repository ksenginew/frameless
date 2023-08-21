export { create_ssr_component } from "./ssr.js";
/**
 * @param {any} data
 */
export function html(data) {
    return ({ $$typeof: 'html', data: data + '' })
}