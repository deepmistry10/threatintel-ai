/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as ai from "../ai.js";
import type * as aiAnalysis from "../aiAnalysis.js";
import type * as aiInternal from "../aiInternal.js";
import type * as auth_emailOtp from "../auth/emailOtp.js";
import type * as auth from "../auth.js";
import type * as bulkImport from "../bulkImport.js";
import type * as correlations from "../correlations.js";
import type * as dashboard from "../dashboard.js";
import type * as http from "../http.js";
import type * as hunt from "../hunt.js";
import type * as incidents from "../incidents.js";
import type * as iocs from "../iocs.js";
import type * as logs from "../logs.js";
import type * as mitre from "../mitre.js";
import type * as sampleData from "../sampleData.js";
import type * as threatFeeds from "../threatFeeds.js";
import type * as threatLogs from "../threatLogs.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  ai: typeof ai;
  aiAnalysis: typeof aiAnalysis;
  aiInternal: typeof aiInternal;
  "auth/emailOtp": typeof auth_emailOtp;
  auth: typeof auth;
  bulkImport: typeof bulkImport;
  correlations: typeof correlations;
  dashboard: typeof dashboard;
  http: typeof http;
  hunt: typeof hunt;
  incidents: typeof incidents;
  iocs: typeof iocs;
  logs: typeof logs;
  mitre: typeof mitre;
  sampleData: typeof sampleData;
  threatFeeds: typeof threatFeeds;
  threatLogs: typeof threatLogs;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
