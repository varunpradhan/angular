/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as ts from 'typescript';

import {createLanguageService} from '../src/language_service';
import {TypeScriptServiceHost} from '../src/typescript_host';

import {MockTypescriptHost} from './test_utils';

const TEST_TEMPLATE = '/app/test.ng';

describe('definitions', () => {
  const mockHost = new MockTypescriptHost(['/app/main.ts']);
  const service = ts.createLanguageService(mockHost);
  const ngHost = new TypeScriptServiceHost(mockHost, service);
  const ngService = createLanguageService(ngHost);

  beforeEach(() => { mockHost.reset(); });

  it('should be able to find field in an interpolation', () => {
    const fileName = mockHost.addCode(`
      @Component({
        template: '{{«name»}}'
      })
      export class MyComponent {
        «ᐱnameᐱ: string;»
      }`);

    const marker = mockHost.getReferenceMarkerFor(fileName, 'name');
    const result = ngService.getDefinitionAndBoundSpan(fileName, marker.start);
    expect(result).toBeDefined();
    const {textSpan, definitions} = result !;

    expect(textSpan).toEqual(marker);
    expect(definitions).toBeDefined();
    expect(definitions !.length).toBe(1);
    const def = definitions ![0];

    expect(def.fileName).toBe(fileName);
    expect(def.name).toBe('name');
    expect(def.kind).toBe('property');
    expect(def.textSpan).toEqual(mockHost.getDefinitionMarkerFor(fileName, 'name'));
  });

  it('should be able to find a field in a attribute reference', () => {
    const fileName = mockHost.addCode(`
      @Component({
        template: '<input [(ngModel)]="«name»">'
      })
      export class MyComponent {
        «ᐱnameᐱ: string;»
      }`);

    const marker = mockHost.getReferenceMarkerFor(fileName, 'name');
    const result = ngService.getDefinitionAndBoundSpan(fileName, marker.start);
    expect(result).toBeDefined();
    const {textSpan, definitions} = result !;

    expect(textSpan).toEqual(marker);
    expect(definitions).toBeDefined();
    expect(definitions !.length).toBe(1);
    const def = definitions ![0];

    expect(def.fileName).toBe(fileName);
    expect(def.name).toBe('name');
    expect(def.kind).toBe('property');
    expect(def.textSpan).toEqual(mockHost.getDefinitionMarkerFor(fileName, 'name'));
  });

  it('should be able to find a method from a call', () => {
    const fileName = mockHost.addCode(`
      @Component({
        template: '<div (click)="~{start-my}«myClick»()~{end-my};"></div>'
      })
      export class MyComponent {
        «ᐱmyClickᐱ() { }»
      }`);

    const marker = mockHost.getReferenceMarkerFor(fileName, 'myClick');
    const result = ngService.getDefinitionAndBoundSpan(fileName, marker.start);
    expect(result).toBeDefined();
    const {textSpan, definitions} = result !;

    expect(textSpan).toEqual(mockHost.getLocationMarkerFor(fileName, 'my'));
    expect(definitions).toBeDefined();
    expect(definitions !.length).toBe(1);
    const def = definitions ![0];

    expect(def.fileName).toBe(fileName);
    expect(def.name).toBe('myClick');
    expect(def.kind).toBe('method');
    expect(def.textSpan).toEqual(mockHost.getDefinitionMarkerFor(fileName, 'myClick'));
  });

  it('should be able to find a field reference in an *ngIf', () => {
    const fileName = mockHost.addCode(`
      @Component({
        template: '<div *ngIf="«include»"></div>'
      })
      export class MyComponent {
        «ᐱincludeᐱ = true;»
      }`);

    const marker = mockHost.getReferenceMarkerFor(fileName, 'include');
    const result = ngService.getDefinitionAndBoundSpan(fileName, marker.start);
    expect(result).toBeDefined();
    const {textSpan, definitions} = result !;

    expect(textSpan).toEqual(marker);
    expect(definitions).toBeDefined();
    expect(definitions !.length).toBe(1);
    const def = definitions ![0];

    expect(def.fileName).toBe(fileName);
    expect(def.name).toBe('include');
    expect(def.kind).toBe('property');
    expect(def.textSpan).toEqual(mockHost.getDefinitionMarkerFor(fileName, 'include'));
  });

  it('should be able to find a reference to a component', () => {
    const fileName = mockHost.addCode(`
      @Component({
        template: '~{start-my}<«test-comp»></test-comp>~{end-my}'
      })
      export class MyComponent { }`);

    // Get the marker for «test-comp» in the code added above.
    const marker = mockHost.getReferenceMarkerFor(fileName, 'test-comp');

    const result = ngService.getDefinitionAndBoundSpan(fileName, marker.start);
    expect(result).toBeDefined();
    const {textSpan, definitions} = result !;

    // Get the marker for bounded text in the code added above.
    const boundedText = mockHost.getLocationMarkerFor(fileName, 'my');
    expect(textSpan).toEqual(boundedText);

    // There should be exactly 1 definition
    expect(definitions).toBeDefined();
    expect(definitions !.length).toBe(1);
    const def = definitions ![0];

    const refFileName = '/app/parsing-cases.ts';
    expect(def.fileName).toBe(refFileName);
    expect(def.name).toBe('TestComponent');
    expect(def.kind).toBe('component');
    const content = mockHost.readFile(refFileName) !;
    const begin = '/*BeginTestComponent*/ ';
    const start = content.indexOf(begin) + begin.length;
    const end = content.indexOf(' /*EndTestComponent*/');
    expect(def.textSpan).toEqual({
      start,
      length: end - start,
    });
  });

  it('should be able to find an event provider', () => {
    const fileName = mockHost.addCode(`
      @Component({
        template: '<test-comp ~{start-my}(«test»)="myHandler()"~{end-my}></div>'
      })
      export class MyComponent { myHandler() {} }`);

    // Get the marker for «test» in the code added above.
    const marker = mockHost.getReferenceMarkerFor(fileName, 'test');

    const result = ngService.getDefinitionAndBoundSpan(fileName, marker.start);
    expect(result).toBeDefined();
    const {textSpan, definitions} = result !;

    // Get the marker for bounded text in the code added above
    const boundedText = mockHost.getLocationMarkerFor(fileName, 'my');
    expect(textSpan).toEqual(boundedText);

    // There should be exactly 1 definition
    expect(definitions).toBeDefined();
    expect(definitions !.length).toBe(1);
    const def = definitions ![0];

    const refFileName = '/app/parsing-cases.ts';
    expect(def.fileName).toBe(refFileName);
    expect(def.name).toBe('testEvent');
    expect(def.kind).toBe('event');
    const content = mockHost.readFile(refFileName) !;
    const ref = `@Output('test') testEvent = new EventEmitter();`;
    expect(def.textSpan).toEqual({
      start: content.indexOf(ref),
      length: ref.length,
    });
  });

  it('should be able to find an input provider', () => {
    const fileName = mockHost.addCode(`
      @Component({
        template: '<test-comp ~{start-my}[«tcName»]="name"~{end-my}></div>'
      })
      export class MyComponent {
        name = 'my name';
      }`);

    // Get the marker for «test» in the code added above.
    const marker = mockHost.getReferenceMarkerFor(fileName, 'tcName');

    const result = ngService.getDefinitionAndBoundSpan(fileName, marker.start);
    expect(result).toBeDefined();
    const {textSpan, definitions} = result !;

    // Get the marker for bounded text in the code added above
    const boundedText = mockHost.getLocationMarkerFor(fileName, 'my');
    expect(textSpan).toEqual(boundedText);

    // There should be exactly 1 definition
    expect(definitions).toBeDefined();
    expect(definitions !.length).toBe(1);
    const def = definitions ![0];

    const refFileName = '/app/parsing-cases.ts';
    expect(def.fileName).toBe(refFileName);
    expect(def.name).toBe('name');
    expect(def.kind).toBe('property');
    const content = mockHost.readFile(refFileName) !;
    const ref = `@Input('tcName') name = 'test';`;
    expect(def.textSpan).toEqual({
      start: content.indexOf(ref),
      length: ref.length,
    });
  });

  it('should be able to find a pipe', () => {
    const fileName = mockHost.addCode(`
      @Component({
        template: '<div *ngIf="~{start-my}input | «async»~{end-my}"></div>'
      })
      export class MyComponent {
        input: EventEmitter;
      }`);

    // Get the marker for «test» in the code added above.
    const marker = mockHost.getReferenceMarkerFor(fileName, 'async');

    const result = ngService.getDefinitionAndBoundSpan(fileName, marker.start);
    expect(result).toBeDefined();
    const {textSpan, definitions} = result !;

    // Get the marker for bounded text in the code added above
    const boundedText = mockHost.getLocationMarkerFor(fileName, 'my');
    expect(textSpan).toEqual(boundedText);

    expect(definitions).toBeDefined();
    expect(definitions !.length).toBe(4);

    const refFileName = '/node_modules/@angular/common/common.d.ts';
    for (const def of definitions !) {
      expect(def.fileName).toBe(refFileName);
      expect(def.name).toBe('async');
      expect(def.kind).toBe('pipe');
      // Not asserting the textSpan of definition because it's external file
    }
  });

  it('should be able to find a structural directive', () => {
    mockHost.override(TEST_TEMPLATE, `<div ~{start-my}*«ngIf»="true"~{end-my}></div>`);

    // Get the marker for ngIf in the code added above.
    const marker = mockHost.getReferenceMarkerFor(TEST_TEMPLATE, 'ngIf');

    const result = ngService.getDefinitionAndBoundSpan(TEST_TEMPLATE, marker.start);
    expect(result).toBeDefined();
    const {textSpan, definitions} = result !;

    // Get the marker for bounded text in the code added above
    const boundedText = mockHost.getLocationMarkerFor(TEST_TEMPLATE, 'my');
    expect(textSpan).toEqual(boundedText);

    expect(definitions).toBeDefined();
    expect(definitions !.length).toBe(1);

    const refFileName = '/node_modules/@angular/common/common.d.ts';
    const def = definitions ![0];
    expect(def.fileName).toBe(refFileName);
    expect(def.name).toBe('ngIf');
    expect(def.kind).toBe('property');
    // Not asserting the textSpan of definition because it's external file
  });

  it('should be able to find a two-way binding', () => {
    mockHost.override(
        TEST_TEMPLATE,
        `<test-comp string-model ~{start-my}[(«model»)]="title"~{end-my}></test-comp>`);
    // Get the marker for «model» in the code added above.
    const marker = mockHost.getReferenceMarkerFor(TEST_TEMPLATE, 'model');

    const result = ngService.getDefinitionAndBoundSpan(TEST_TEMPLATE, marker.start);
    expect(result).toBeDefined();
    const {textSpan, definitions} = result !;

    // Get the marker for bounded text in the code added above
    const boundedText = mockHost.getLocationMarkerFor(TEST_TEMPLATE, 'my');
    expect(textSpan).toEqual(boundedText);

    // There should be exactly 1 definition
    expect(definitions).toBeDefined();
    expect(definitions !.length).toBe(1);
    const def = definitions ![0];

    const refFileName = '/app/parsing-cases.ts';
    expect(def.fileName).toBe(refFileName);
    expect(def.name).toBe('model');
    expect(def.kind).toBe('property');
    const content = mockHost.readFile(refFileName) !;
    expect(content.substring(def.textSpan.start, def.textSpan.start + def.textSpan.length))
        .toEqual(`@Input() model: string = 'model';`);
  });

  it('should be able to find a template from a url', () => {
    const fileName = mockHost.addCode(`
	      @Component({
	        templateUrl: './«test».ng',
	      })
	      export class MyComponent {}`);

    const marker = mockHost.getReferenceMarkerFor(fileName, 'test');
    const result = ngService.getDefinitionAndBoundSpan(fileName, marker.start);

    expect(result).toBeDefined();
    const {textSpan, definitions} = result !;

    expect(textSpan).toEqual({start: marker.start - 2, length: 9});

    expect(definitions).toBeDefined();
    expect(definitions !.length).toBe(1);
    const [def] = definitions !;
    expect(def.fileName).toBe('/app/test.ng');
    expect(def.textSpan).toEqual({start: 0, length: 0});
  });

  it('should be able to find a stylesheet from a url', () => {
    const fileName = mockHost.addCode(`
	      @Component({
	        templateUrl: './test.ng',
                styleUrls: ['./«test».css'],
	      })
	      export class MyComponent {}`);

    const marker = mockHost.getReferenceMarkerFor(fileName, 'test');
    const result = ngService.getDefinitionAndBoundSpan(fileName, marker.start);

    expect(result).toBeDefined();
    const {textSpan, definitions} = result !;

    expect(textSpan).toEqual({start: marker.start - 2, length: 10});

    expect(definitions).toBeDefined();
    expect(definitions !.length).toBe(1);
    const [def] = definitions !;
    expect(def.fileName).toBe('/app/test.css');
    expect(def.textSpan).toEqual({start: 0, length: 0});
  });

  it('should not expand i18n templates', () => {
    const fileName = mockHost.addCode(`
      @Component({
        template: '<div i18n="@@el">{{«name»}}</div>'
      })
      export class MyComponent {
        «ᐱnameᐱ: string;»
      }`);

    const marker = mockHost.getReferenceMarkerFor(fileName, 'name');
    const result = ngService.getDefinitionAndBoundSpan(fileName, marker.start);
    expect(result).toBeDefined();
    const {textSpan, definitions} = result !;

    expect(textSpan).toEqual(marker);
    expect(definitions).toBeDefined();
    expect(definitions !.length).toBe(1);
    const def = definitions ![0];

    expect(def.fileName).toBe(fileName);
    expect(def.name).toBe('name');
    expect(def.kind).toBe('property');
    expect(def.textSpan).toEqual(mockHost.getDefinitionMarkerFor(fileName, 'name'));
  });
});
