import { AuthenticationRequirement, HttpMethod, PermissionUsage } from '../../models/featureDocumentation';
import { directMemberIndent, findBlockEnd, LogicalLine, toLogicalLines } from './pythonSource';

export interface ParsedViewAction {
  name: string;
  httpMethod: HttpMethod;
  /** Only meaningful for @action-decorated methods: whether it routes under the detail (id-scoped) or collection path. */
  detail?: boolean;
  /** Overrides `name` as the URL path segment when @action(url_path=...) is set. */
  urlPath?: string;
}

export interface ParsedView {
  name: string;
  kind: 'ViewSet' | 'APIView' | 'FunctionView';
  serializerName?: string;
  actions: ParsedViewAction[];
}

export interface ViewsParseResult {
  views: ParsedView[];
  permissions: PermissionUsage[];
  authentication: AuthenticationRequirement[];
}

const CLASS_HEADER = /^class\s+(\w+)\s*(?:\(([^)]*)\))?\s*:/;
const DEF_HEADER = /^def\s+(\w+)\s*\(/;
const SERIALIZER_CLASS_ATTR = /^serializer_class\s*=\s*(\w+)/;
const PERMISSION_CLASSES_ATTR = /^permission_classes\s*=\s*\[([\s\S]*)\]/;
const AUTHENTICATION_CLASSES_ATTR = /^authentication_classes\s*=\s*\[([\s\S]*)\]/;
const HTTP_METHOD_NAMES_ATTR = /^http_method_names\s*=\s*\[([\s\S]*)\]/;
const ACTION_DECORATOR = /^@action\(([\s\S]*)\)/;
const API_VIEW_DECORATOR = /^@api_view\(\s*\[([\s\S]*)\]\s*\)/;

const VIEWSET_ACTION_METHODS: Partial<Record<string, HttpMethod>> = {
  list: 'GET',
  create: 'POST',
  retrieve: 'GET',
  update: 'PUT',
  partial_update: 'PATCH',
  destroy: 'DELETE',
};

const HTTP_METHOD_NAMES = new Set<HttpMethod>(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']);

interface ClassInfo {
  name: string;
  baseClasses: string[];
  bodyStart: number;
  bodyEnd: number;
}

interface OwnAttributes {
  serializerName?: string;
  permissionClassNames: string[];
  authenticationClassNames: string[];
  allowedHttpMethods?: Set<HttpMethod>;
  actions: ParsedViewAction[];
}

/**
 * Parses a Django `views.py` for DRF ViewSet/APIView subclasses and
 * @api_view-decorated function views.
 *
 * Real codebases routinely factor a shared abstract base
 * (`class _AppBaseViewSet(viewsets.ModelViewSet): permission_classes = [...]`)
 * and thin mixins (`class CommentableMixin:` with an @action method) that
 * concrete ViewSets inherit from rather than redeclaring everything. This
 * parser resolves one level of local (same-file) base-class inheritance so
 * a subclass picks up its base's implicit CRUD actions, serializer_class,
 * permission/authentication classes, and any @action methods defined on a
 * mixin — not just what's declared directly on the leaf class. It also
 * honors `http_method_names` as a restriction on the final action set.
 * Does not resolve dynamic overrides like get_serializer_class()/get_permissions().
 */
export class ViewsParser {
  parse(fileContent: string, sourceFile: string): ViewsParseResult {
    const lines = toLogicalLines(fileContent);
    const classInfo = this.collectClasses(lines);
    const views: ParsedView[] = [];
    const permissions: PermissionUsage[] = [];
    const authentication: AuthenticationRequirement[] = [];

    for (const info of classInfo.values()) {
      const chain = this.flattenBaseChain(info.name, classInfo);
      const isReadOnlyModelViewSet = chain.some((b) => b.endsWith('ReadOnlyModelViewSet'));
      const isModelViewSet = !isReadOnlyModelViewSet && chain.some((b) => b.endsWith('ModelViewSet'));
      const isViewSet = isModelViewSet || isReadOnlyModelViewSet || chain.some((b) => b.endsWith('ViewSet'));
      const isApiView = !isViewSet && chain.some((b) => b.endsWith('APIView'));
      if (!isViewSet && !isApiView) {
        continue;
      }

      const attrs = this.gatherAttributes(info.name, classInfo, lines);
      let actions = [...attrs.actions];
      if (isReadOnlyModelViewSet) {
        actions.push({ name: 'list', httpMethod: 'GET' }, { name: 'retrieve', httpMethod: 'GET' });
      } else if (isModelViewSet) {
        actions.push(
          { name: 'list', httpMethod: 'GET' },
          { name: 'create', httpMethod: 'POST' },
          { name: 'retrieve', httpMethod: 'GET' },
          { name: 'update', httpMethod: 'PUT' },
          { name: 'partial_update', httpMethod: 'PATCH' },
          { name: 'destroy', httpMethod: 'DELETE' }
        );
      }
      if (attrs.allowedHttpMethods) {
        actions = actions.filter((a) => attrs.allowedHttpMethods!.has(a.httpMethod));
      }

      views.push({ name: info.name, kind: isViewSet ? 'ViewSet' : 'APIView', serializerName: attrs.serializerName, actions });
      if (attrs.permissionClassNames.length) {
        permissions.push({ className: attrs.permissionClassNames.join(', '), appliedTo: [info.name], sourceFile });
      }
      if (attrs.authenticationClassNames.length) {
        authentication.push({ className: attrs.authenticationClassNames.join(', '), appliedTo: [info.name], sourceFile });
      }
    }

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].indent !== 0) {
        continue;
      }
      const defMatch = DEF_HEADER.exec(lines[i].text.trim());
      if (!defMatch) {
        continue;
      }
      const decoratorText = i > 0 ? lines[i - 1].text.trim() : '';
      const apiViewDecorator = API_VIEW_DECORATOR.exec(decoratorText);
      if (!apiViewDecorator) {
        continue;
      }
      const httpMethods = Array.from(apiViewDecorator[1].matchAll(/["'](\w+)["']/g)).map(
        (m) => m[1].toUpperCase() as HttpMethod
      );
      views.push({
        name: defMatch[1],
        kind: 'FunctionView',
        actions: httpMethods.map((httpMethod) => ({ name: defMatch[1], httpMethod })),
      });
    }

    return { views, permissions, authentication };
  }

  private collectClasses(lines: LogicalLine[]): Map<string, ClassInfo> {
    const map = new Map<string, ClassInfo>();
    for (let i = 0; i < lines.length; i++) {
      const headerMatch = CLASS_HEADER.exec(lines[i].text.trim());
      if (!headerMatch) {
        continue;
      }
      const [, className, basesRaw] = headerMatch;
      const baseClasses = basesRaw
        ? basesRaw
            .split(',')
            .map((b) => b.trim())
            .filter(Boolean)
        : [];
      const bodyEnd = findBlockEnd(lines, i + 1, lines[i].indent);
      map.set(className, { name: className, baseClasses, bodyStart: i + 1, bodyEnd });
    }
    return map;
  }

  private flattenBaseChain(name: string, classInfo: Map<string, ClassInfo>, visited: Set<string> = new Set()): string[] {
    if (visited.has(name)) {
      return [];
    }
    visited.add(name);
    const info = classInfo.get(name);
    if (!info) {
      return [];
    }
    const chain = [...info.baseClasses];
    for (const base of info.baseClasses) {
      if (classInfo.has(base)) {
        chain.push(...this.flattenBaseChain(base, classInfo, visited));
      }
    }
    return chain;
  }

  private gatherAttributes(
    name: string,
    classInfo: Map<string, ClassInfo>,
    lines: LogicalLine[],
    visited: Set<string> = new Set()
  ): OwnAttributes {
    if (visited.has(name)) {
      return { permissionClassNames: [], authenticationClassNames: [], actions: [] };
    }
    visited.add(name);
    const info = classInfo.get(name);
    if (!info) {
      return { permissionClassNames: [], authenticationClassNames: [], actions: [] };
    }

    const own = this.scanOwnBody(info, lines);

    for (const base of info.baseClasses) {
      if (!classInfo.has(base)) {
        continue;
      }
      const inherited = this.gatherAttributes(base, classInfo, lines, visited);
      own.serializerName = own.serializerName ?? inherited.serializerName;
      if (own.permissionClassNames.length === 0) {
        own.permissionClassNames = inherited.permissionClassNames;
      }
      if (own.authenticationClassNames.length === 0) {
        own.authenticationClassNames = inherited.authenticationClassNames;
      }
      own.allowedHttpMethods = own.allowedHttpMethods ?? inherited.allowedHttpMethods;
      own.actions.push(...inherited.actions);
    }

    return own;
  }

  private scanOwnBody(info: ClassInfo, lines: LogicalLine[]): OwnAttributes {
    const bodyIndent = directMemberIndent(lines, info.bodyStart, info.bodyEnd);
    let serializerName: string | undefined;
    let permissionClassNames: string[] = [];
    let authenticationClassNames: string[] = [];
    let allowedHttpMethods: Set<HttpMethod> | undefined;
    const actions: ParsedViewAction[] = [];

    for (let j = info.bodyStart; j < info.bodyEnd; j++) {
      if (lines[j].indent !== bodyIndent) {
        continue;
      }
      const text = lines[j].text.trim();

      const serializerMatch = SERIALIZER_CLASS_ATTR.exec(text);
      if (serializerMatch) {
        serializerName = serializerMatch[1];
        continue;
      }
      const permMatch = PERMISSION_CLASSES_ATTR.exec(text);
      if (permMatch) {
        permissionClassNames = extractIdentifiers(permMatch[1]);
        continue;
      }
      const authMatch = AUTHENTICATION_CLASSES_ATTR.exec(text);
      if (authMatch) {
        authenticationClassNames = extractIdentifiers(authMatch[1]);
        continue;
      }
      const methodNamesMatch = HTTP_METHOD_NAMES_ATTR.exec(text);
      if (methodNamesMatch) {
        allowedHttpMethods = new Set(
          Array.from(methodNamesMatch[1].matchAll(/["'](\w+)["']/g)).map((m) => m[1].toUpperCase() as HttpMethod)
        );
        continue;
      }

      const defMatch = DEF_HEADER.exec(text);
      if (!defMatch) {
        continue;
      }
      const methodName = defMatch[1];

      const decoratorText = j > 0 ? lines[j - 1].text.trim() : '';
      const actionDecorator = ACTION_DECORATOR.exec(decoratorText);
      if (actionDecorator) {
        const methodsKwarg = /methods\s*=\s*\[([\s\S]*?)\]/.exec(actionDecorator[1]);
        const httpMethods = methodsKwarg
          ? Array.from(methodsKwarg[1].matchAll(/["'](\w+)["']/g)).map((m) => m[1].toUpperCase() as HttpMethod)
          : (['GET'] as HttpMethod[]);
        const detailKwarg = /detail\s*=\s*(True|False)/.exec(actionDecorator[1]);
        const detail = detailKwarg ? detailKwarg[1] === 'True' : true;
        const urlPathKwarg = /url_path\s*=\s*["']([^"']+)["']/.exec(actionDecorator[1]);
        for (const httpMethod of httpMethods) {
          actions.push({ name: methodName, httpMethod, detail, urlPath: urlPathKwarg?.[1] });
        }
        continue;
      }

      if (VIEWSET_ACTION_METHODS[methodName]) {
        actions.push({ name: methodName, httpMethod: VIEWSET_ACTION_METHODS[methodName]! });
        continue;
      }

      const upper = methodName.toUpperCase() as HttpMethod;
      if (HTTP_METHOD_NAMES.has(upper)) {
        actions.push({ name: methodName, httpMethod: upper });
      }
    }

    return { serializerName, permissionClassNames, authenticationClassNames, allowedHttpMethods, actions };
  }
}

function extractIdentifiers(text: string): string[] {
  return Array.from(text.matchAll(/[\w.]+/g))
    .map((m) => m[0].split('.').pop()!)
    .filter(Boolean);
}
