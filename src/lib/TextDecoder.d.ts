/**
 * Shut up TypeScript
 *
 * @class TextDecoder
 */
declare class TextDecoder {
	public encoding: string;
	public fatal: boolean;
	public ignoreBOM: boolean;
	constructor(utfLabel?: string, options?: {
		fatal?: boolean;
		ignoreBOM?: boolean;
	})
	public decode(input?: ArrayBuffer, options?: {
		stream?: boolean;
	}): string;

}
