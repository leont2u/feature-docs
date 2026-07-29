import * as path from 'path';
import { IFeatureParser } from '../featureParser';
import {
  FeatureDocumentationData,
  FeatureFileInventory,
  ModelDefinition,
  SerializerDefinition,
  PermissionUsage,
  AuthenticationRequirement,
  ServiceDefinition,
  SignalDefinition,
  CeleryTaskDefinition,
  DependencyReference,
  WorkflowDefinition,
  AdminRegistration,
  TestSummary,
} from '../../models/featureDocumentation';
import { fileExists, joinFeaturePath, readIfExists } from '../../utils/fileSystem';
import { DJANGO_FEATURE_FILES } from './constants';
import { UrlsParser, RawRoute } from './urlsParser';
import { ViewsParser, ParsedView } from './viewsParser';
import { SerializersParser } from './serializersParser';
import { ModelsParser } from './modelsParser';
import { PermissionsParser } from './permissionsParser';
import { ServicesParser } from './servicesParser';
import { SignalsParser } from './signalsParser';
import { TasksParser } from './tasksParser';
import { AdminParser } from './adminParser';
import { TestsParser } from './testsParser';
import { ImportsParser } from './importsParser';
import { linkEndpoints } from './endpointLinker';

/**
 * Orchestrates the per-file Django sub-parsers and assembles their output
 * into the framework-agnostic FeatureDocumentationData contract.
 *
 * urls.py and views.py are parsed independently into raw, unlinked shapes
 * (RawRoute / ParsedView) and only combined into final EndpointDefinitions
 * once both are available (linkEndpoints), since a route's HTTP methods and
 * payload shape depend on the view it points to.
 */
export class DjangoFeatureParser implements IFeatureParser {
  readonly frameworkName = 'Django';

  private readonly urlsParser = new UrlsParser();
  private readonly viewsParser = new ViewsParser();
  private readonly serializersParser = new SerializersParser();
  private readonly modelsParser = new ModelsParser();
  private readonly permissionsParser = new PermissionsParser();
  private readonly servicesParser = new ServicesParser();
  private readonly signalsParser = new SignalsParser();
  private readonly tasksParser = new TasksParser();
  private readonly adminParser = new AdminParser();
  private readonly testsParser = new TestsParser();
  private readonly importsParser = new ImportsParser();

  async canParse(featureFolderPath: string): Promise<boolean> {
    const hasModels = await fileExists(joinFeaturePath(featureFolderPath, 'models.py'));
    const hasApps = await fileExists(joinFeaturePath(featureFolderPath, 'apps.py'));
    return hasModels || hasApps;
  }

  async parse(featureFolderPath: string, projectName: string): Promise<FeatureDocumentationData> {
    const fileInventory = await this.buildFileInventory(featureFolderPath);

    const routes: RawRoute[] = [];
    const views: ParsedView[] = [];
    const models: ModelDefinition[] = [];
    const serializers: SerializerDefinition[] = [];
    const permissions: PermissionUsage[] = [];
    const authentication: AuthenticationRequirement[] = [];
    const services: ServiceDefinition[] = [];
    const signals: SignalDefinition[] = [];
    const celeryTasks: CeleryTaskDefinition[] = [];
    const dependencies: DependencyReference[] = [];
    const adminRegistrations: AdminRegistration[] = [];
    let testSummary: TestSummary | undefined;

    for (const file of fileInventory) {
      if (!file.present) {
        continue;
      }
      const absolutePath = joinFeaturePath(featureFolderPath, file.fileName);
      const content = await readIfExists(absolutePath);
      if (content === undefined) {
        continue;
      }

      dependencies.push(...this.importsParser.parse(content, file.relativePath));

      switch (file.fileName) {
        case 'urls.py':
          routes.push(...this.urlsParser.parse(content, file.relativePath));
          break;
        case 'views.py': {
          const result = this.viewsParser.parse(content, file.relativePath);
          views.push(...result.views);
          permissions.push(...result.permissions);
          authentication.push(...result.authentication);
          break;
        }
        case 'serializers.py':
          serializers.push(...this.serializersParser.parse(content, file.relativePath));
          break;
        case 'models.py':
          models.push(...this.modelsParser.parse(content, file.relativePath));
          break;
        case 'permissions.py':
          permissions.push(...this.permissionsParser.parse(content, file.relativePath));
          break;
        case 'services.py':
          services.push(...this.servicesParser.parse(content, file.relativePath));
          break;
        case 'signals.py':
          signals.push(...this.signalsParser.parse(content, file.relativePath));
          break;
        case 'tasks.py':
          celeryTasks.push(...this.tasksParser.parse(content, file.relativePath));
          break;
        case 'admin.py':
          adminRegistrations.push(...this.adminParser.parse(content, file.relativePath));
          break;
        case 'tests.py':
          testSummary = this.testsParser.parse(content, file.relativePath);
          break;
      }
    }

    const endpoints = linkEndpoints(routes, views);
    const workflows: WorkflowDefinition[] = models
      .filter((model) => model.statusChoices && model.statusChoices.length > 0)
      .map((model) => ({ modelName: model.name, sourceFile: model.sourceFile, states: model.statusChoices! }));

    return {
      metadata: {
        featureName: path.basename(featureFolderPath),
        projectName,
        generatedAt: new Date(),
      },
      fileInventory,
      endpoints,
      models,
      serializers,
      permissions,
      authentication,
      services,
      signals,
      celeryTasks,
      dependencies,
      workflows,
      adminRegistrations,
      testSummary,
    };
  }

  private async buildFileInventory(featureFolderPath: string): Promise<FeatureFileInventory[]> {
    const inventory: FeatureFileInventory[] = [];
    for (const fileName of DJANGO_FEATURE_FILES) {
      const present = await fileExists(joinFeaturePath(featureFolderPath, fileName));
      inventory.push({ fileName, relativePath: fileName, present });
    }
    return inventory;
  }
}
