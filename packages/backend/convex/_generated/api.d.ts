/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as access from "../access.js";
import type * as health from "../health.js";
import type * as lib_openaiErrors from "../lib/openaiErrors.js";
import type * as lib_requireAccess from "../lib/requireAccess.js";
import type * as program from "../program.js";
import type * as sessions from "../sessions.js";
import type * as suggestions from "../suggestions.js";
import type * as suggestionsGenerate from "../suggestionsGenerate.js";
import type * as suggestionsInternals from "../suggestionsInternals.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  access: typeof access;
  health: typeof health;
  "lib/openaiErrors": typeof lib_openaiErrors;
  "lib/requireAccess": typeof lib_requireAccess;
  program: typeof program;
  sessions: typeof sessions;
  suggestions: typeof suggestions;
  suggestionsGenerate: typeof suggestionsGenerate;
  suggestionsInternals: typeof suggestionsInternals;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
