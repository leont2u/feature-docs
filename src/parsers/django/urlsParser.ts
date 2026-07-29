import { toLogicalLines } from './pythonSource';

/** A single URL registration before it's linked against views.py. */
export interface RawRoute {
  /** 'router' registrations imply the standard list/detail/custom-action endpoint set; 'path' is a single literal route. */
  kind: 'path' | 'router';
  /** Literal route string (path()/re_path()) or router prefix (router.register()). */
  pattern: string;
  /** Bare class/function name the route points at (module/import prefixes stripped). */
  viewName: string;
  sourceFile: string;
}

const PATH_CALL = /^(?:path|re_path)\(\s*["']([^"']*)["']\s*,\s*([\w.]+)/;
const ROUTER_REGISTER = /router\.register\(\s*r?["']([^"']*)["']\s*,\s*([\w.]+)/;

/**
 * Parses a Django `urls.py` into raw route registrations: `path()`/`re_path()`
 * calls and DRF router `.register()` calls. Deliberately does not resolve
 * HTTP methods or payload shape here — that requires cross-referencing
 * views.py and serializers.py, which happens in the orchestrator via
 * linkEndpoints(). Does not attempt to resolve nested `include()` urlconfs.
 */
export class UrlsParser {
  parse(fileContent: string, sourceFile: string): RawRoute[] {
    const lines = toLogicalLines(fileContent);
    const routes: RawRoute[] = [];

    for (const line of lines) {
      const text = line.text.trim();

      const pathMatch = PATH_CALL.exec(text);
      if (pathMatch) {
        routes.push({ kind: 'path', pattern: pathMatch[1], viewName: lastSegment(pathMatch[2]), sourceFile });
        continue;
      }

      const routerMatch = ROUTER_REGISTER.exec(text);
      if (routerMatch) {
        routes.push({ kind: 'router', pattern: routerMatch[1], viewName: lastSegment(routerMatch[2]), sourceFile });
      }
    }

    return routes;
  }
}

function lastSegment(dotted: string): string {
  const parts = dotted.split('.');
  return parts[parts.length - 1];
}
