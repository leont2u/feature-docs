/**
 * Framework-agnostic data model describing a documented backend feature/module.
 *
 * Parsers (e.g. src/parsers/django) populate this shape via static analysis;
 * generators (e.g. src/generators/pdf, src/generators/diagrams) consume it to
 * produce the report. Neither side depends on the other, and neither depends
 * on which backend framework produced the data.
 */

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export type FieldRelationKind = 'ForeignKey' | 'OneToOne' | 'ManyToMany';

export interface ModelField {
  name: string;
  fieldType: string;
  required: boolean;
  isRelation: boolean;
  relation?: ModelRelation;
  options?: Record<string, string>;
}

export interface ModelRelation {
  kind: FieldRelationKind;
  targetModel: string;
  relatedName?: string;
  onDelete?: string;
}

export interface ModelDefinition {
  name: string;
  sourceFile: string;
  fields: ModelField[];
  baseClasses: string[];
  metaOptions?: Record<string, string>;
}

export interface EndpointDefinition {
  path: string;
  methods: HttpMethod[];
  handlerName: string;
  handlerType: 'ViewSet' | 'APIView' | 'FunctionView' | 'Unknown';
  viewName?: string;
  sourceFile: string;
}

export interface SerializerDefinition {
  name: string;
  sourceFile: string;
  modelName?: string;
  fields: string[];
  baseClasses: string[];
}

export interface PermissionUsage {
  className: string;
  appliedTo: string[];
  sourceFile: string;
}

export interface AuthenticationRequirement {
  className: string;
  appliedTo: string[];
  sourceFile: string;
}

export interface ServiceDefinition {
  name: string;
  sourceFile: string;
  description?: string;
}

export interface SignalDefinition {
  signalType: string;
  senderModel?: string;
  receiverName: string;
  sourceFile: string;
}

export interface CeleryTaskDefinition {
  name: string;
  sourceFile: string;
  isPeriodic: boolean;
}

export interface DependencyReference {
  module: string;
  imported: string[];
  isExternal: boolean;
  sourceFile: string;
}

export interface FeatureFileInventory {
  fileName: string;
  relativePath: string;
  present: boolean;
}

export interface FeatureMetadata {
  featureName: string;
  projectName: string;
  generatedAt: Date;
  purpose?: string;
}

/**
 * Aggregate result produced by a single framework parser for one feature/module.
 * This is the sole contract between parsers and generators.
 */
export interface FeatureDocumentationData {
  metadata: FeatureMetadata;
  fileInventory: FeatureFileInventory[];
  endpoints: EndpointDefinition[];
  models: ModelDefinition[];
  serializers: SerializerDefinition[];
  permissions: PermissionUsage[];
  authentication: AuthenticationRequirement[];
  services: ServiceDefinition[];
  signals: SignalDefinition[];
  celeryTasks: CeleryTaskDefinition[];
  dependencies: DependencyReference[];
}
