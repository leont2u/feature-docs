import { ModelDefinition } from '../../models/featureDocumentation';
import { DiagramResult, IDiagramGenerator } from './diagramGenerator';

/**
 * Renders an Entity Relationship Diagram as SVG from parsed Django models,
 * laying out entity boxes and drawing connectors for ForeignKey/OneToOne/
 * ManyToMany relationships.
 * TODO: implement box layout and connector routing once feature work begins.
 */
export class ErdDiagramGenerator implements IDiagramGenerator<ModelDefinition[]> {
  generate(_models: ModelDefinition[]): DiagramResult {
    return {
      svg: '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>',
      suggestedFileName: 'erd.svg',
    };
  }
}
