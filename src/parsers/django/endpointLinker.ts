import { EndpointDefinition, HttpMethod } from '../../models/featureDocumentation';
import { ParsedView } from './viewsParser';
import { RawRoute } from './urlsParser';

const LIST_ACTIONS = new Set(['list', 'create']);
const DETAIL_ACTIONS = new Set(['retrieve', 'update', 'partial_update', 'destroy']);

/**
 * Joins urls.py's raw routes with views.py's parsed views into the final
 * endpoint list the API Endpoints section renders. A `router.register()`
 * entry expands into a list/collection endpoint (GET/POST), a detail
 * endpoint (GET/PUT/PATCH/DELETE), and one endpoint per custom @action —
 * matching how DRF's router actually generates URLs. A plain `path()` to a
 * ViewSet (no router) is left as a single combined-methods endpoint since
 * its dict-style `.as_view({...})` method mapping isn't parsed.
 */
export function linkEndpoints(routes: RawRoute[], views: ParsedView[]): EndpointDefinition[] {
  const viewsByName = new Map(views.map((v) => [v.name, v]));
  const endpoints: EndpointDefinition[] = [];

  for (const route of routes) {
    const view = viewsByName.get(route.viewName);
    if (!view) {
      endpoints.push({
        path: route.pattern,
        methods: [],
        handlerName: route.viewName,
        handlerType: 'Unknown',
        sourceFile: route.sourceFile,
      });
      continue;
    }

    if (route.kind === 'router' && view.kind === 'ViewSet') {
      const base = normalizePath(route.pattern);

      const listMethods = dedupe(view.actions.filter((a) => LIST_ACTIONS.has(a.name)).map((a) => a.httpMethod));
      if (listMethods.length) {
        endpoints.push(buildEndpoint(base, listMethods, view, `${view.name} (list/create)`, route.sourceFile));
      }

      const detailMethods = dedupe(view.actions.filter((a) => DETAIL_ACTIONS.has(a.name)).map((a) => a.httpMethod));
      if (detailMethods.length) {
        endpoints.push(
          buildEndpoint(`${base}{id}/`, detailMethods, view, `${view.name} (retrieve/update/destroy)`, route.sourceFile)
        );
      }

      const customActions = view.actions.filter((a) => !LIST_ACTIONS.has(a.name) && !DETAIL_ACTIONS.has(a.name));
      for (const action of customActions) {
        const segment = action.urlPath ?? action.name;
        const actionPath = action.detail ? `${base}{id}/${segment}/` : `${base}${segment}/`;
        endpoints.push(buildEndpoint(actionPath, [action.httpMethod], view, `${view.name}.${action.name}`, route.sourceFile));
      }
      continue;
    }

    const methods = dedupe(view.actions.map((a) => a.httpMethod));
    endpoints.push(buildEndpoint(route.pattern, methods, view, view.name, route.sourceFile));
  }

  return endpoints;
}

function buildEndpoint(
  path: string,
  methods: HttpMethod[],
  view: ParsedView,
  handlerName: string,
  sourceFile: string
): EndpointDefinition {
  return {
    path,
    methods,
    handlerName,
    handlerType: view.kind,
    viewName: view.name,
    serializerName: view.serializerName,
    sourceFile,
  };
}

function normalizePath(pattern: string): string {
  return pattern.endsWith('/') ? pattern : `${pattern}/`;
}

function dedupe(methods: HttpMethod[]): HttpMethod[] {
  return Array.from(new Set(methods));
}
