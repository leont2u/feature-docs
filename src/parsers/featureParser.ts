import { FeatureDocumentationData } from '../models/featureDocumentation';

/**
 * Contract every framework-specific parser must implement.
 * A parser turns the contents of a single feature/module folder (e.g. a
 * Django app, a NestJS module, a Laravel module) into framework-agnostic
 * FeatureDocumentationData that generators can render without knowing
 * which backend framework produced it.
 */
export interface IFeatureParser {
  /** Human-readable identifier, e.g. "Django", "FastAPI", "NestJS". */
  readonly frameworkName: string;

  /**
   * Returns true if this parser recognizes the folder as a feature module
   * for its framework (e.g. presence of models.py/apps.py for Django).
   */
  canParse(featureFolderPath: string): Promise<boolean>;

  /** Performs static analysis over the folder and returns the aggregate result. */
  parse(featureFolderPath: string, projectName: string): Promise<FeatureDocumentationData>;
}
