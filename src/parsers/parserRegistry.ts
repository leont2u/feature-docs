import { IFeatureParser } from './featureParser';

/**
 * Central lookup for framework parsers. New frameworks (FastAPI, Express.js,
 * NestJS, Laravel, Spring Boot, ...) register here without touching command
 * or generator code.
 */
export class ParserRegistry {
  private readonly parsers: IFeatureParser[] = [];

  register(parser: IFeatureParser): void {
    this.parsers.push(parser);
  }

  async detect(featureFolderPath: string): Promise<IFeatureParser | undefined> {
    for (const parser of this.parsers) {
      if (await parser.canParse(featureFolderPath)) {
        return parser;
      }
    }
    return undefined;
  }
}
