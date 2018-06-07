/**
 * @license
 * Copyright 2017 JBoss Inc
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import {
    Oas20Document,
    Oas20Operation, Oas20Parameter, Oas20Response, Oas30Parameter, Oas30RequestBody, Oas30Response,
    OasCombinedVisitorAdapter, OasInfo,
    OasLibraryUtils, OasNode,
    OasOperation,
    OasPathItem, OasResponse, OasSchema, OasVisitorUtil
} from "oai-ts-core";
import {Oas20SchemaDefinition} from "oai-ts-core/src/models/2.0/schema.model";
import {Oas30SchemaDefinition} from "oai-ts-core/src/models/3.0/schema.model";
import {CodegenInfo} from "../models/codegen-info.model";
import {InterfaceInfo} from "./interfaces.visitor";
import {CodegenJavaBean} from "../models/codegen-java-bean.model";
import {CodegenJavaInterface} from "../models/codegen-java-interface.model";
import {CodegenJavaMethod} from "../models/codegen-java-method.model";
import {CodegenJavaArgument} from "../models/codegen-java-argument.model";
import {CodegenJavaReturn} from "../models/codegen-java-return.model";
import {Oas30MediaType} from "oai-ts-core/src/models/3.0/media-type.model";

export class PathItemDetectionVisitor extends OasCombinedVisitorAdapter {
    isPathItem: boolean;

    public visitPathItem(node: OasPathItem): void {
        this.isPathItem = true;
    }

}

/**
 * Visitor used to create a Codegen Info object from a OpenAPI document.
 */
export class OpenApi2CodegenVisitor extends OasCombinedVisitorAdapter {

    private packageName: string;
    private interfacesIndex: any = {};
    private codegenInfo: CodegenInfo = {
        name: "Wildfly Swarm API",
        version: "1.0.0",
        interfaces: [],
        beans: []
    };
    private _library: OasLibraryUtils = new OasLibraryUtils();

    private _currentInterface: CodegenJavaInterface;
    private _currentMethod: CodegenJavaMethod;
    private _currentArgument: CodegenJavaArgument;

    private _methodCounter: number = 1;

    private _processPathItemParams: boolean = false;

    /**
     * C'tor.
     * @param {string} packageName
     * @param {InterfaceInfo[]} interfaces
     */
    constructor(packageName: string, interfaces: InterfaceInfo[]) {
        super();
        this.packageName = packageName;
        for (let iface of interfaces) {
            for (let path of iface.paths) {
                this.interfacesIndex[path] = iface.name;
            }
        }
    }

    /**
     * Gets the CodegenInfo object that was created by the visitor.
     * @return {CodegenInfo}
     */
    public getCodegenInfo(): CodegenInfo {
        return this.codegenInfo;
    }

    /**
     * Visits the info model to extract some meta data.
     * @param {OasInfo} node
     */
    public visitInfo(node: OasInfo): void {
        this.codegenInfo.name = node.title;
        if (node.description) {
            this.codegenInfo.description = node.description;
        }
        this.codegenInfo.version = node.version;
    }

    /**
     * Visits an operation to produce a CodegenJavaInterface.
     * @param {OasPathItem} node
     */
    public visitPathItem(node: OasPathItem): void {
        let p: string = node.path();
        let cgInterface: CodegenJavaInterface = this.getOrCreateInterface(p);
        this._currentInterface = cgInterface;
    }

    /**
     * Visits an operation to produce a CodegenJavaMethod.
     * @param {OasOperation} node
     */
    public visitOperation(node: OasOperation): void {
        let method: CodegenJavaMethod = {
            name: this.methodName(node),
            path: this.methodPath(node),
            method: node.method(),
            produces: [],
            consumes: [],
            arguments: []
        };
        if (node.description) { method.description = node.description; }

        // Handle 2.0 "produces"
        if (node.ownerDocument().is2xDocument()) {
            let produces: string[] = (node as Oas20Operation).produces;
            if (produces === null || produces === undefined) {
                produces = (node.ownerDocument() as Oas20Document).produces;
            }
            if (produces) {
                method.produces = produces;
            }
        }
        // Handle 2.0 "consumes"
        if (node.ownerDocument().is2xDocument()) {
            let consumes: string[] = (node as Oas20Operation).consumes
            if (consumes === null || consumes === undefined) {
                consumes = (node.ownerDocument() as Oas20Document).consumes;
            }
            if (consumes) {
                method.consumes = consumes;
            }
        }

        this._currentMethod = method;
        this._currentInterface.methods.push(method);

        // Be sure to process path and query parameters found on the parent!
        this._processPathItemParams = true;
        let parentParams: any[] = (node.parent() as OasPathItem).parameters;
        if (parentParams && parentParams.length > 0) {
            for (let parentParam of parentParams) {
                OasVisitorUtil.visitNode(parentParam, this);
            }
        }
        this._processPathItemParams = false;
    }

    /**
     * Visits a parameter to produce a CodegenJavaArgument.
     * @param {Oas20Parameter | Oas30Parameter} node
     */
    public visitParameter(node: Oas20Parameter | Oas30Parameter): void {
        // Skip processing of the parameter if it is defined at the path level.
        if (!this._processPathItemParams && this.isPathItem(node.parent())) {
            return;
        }

        let cgArgument: CodegenJavaArgument = {
            name: node.name,
            in: node.in,
            required: true
        };
        this._currentMethod.arguments.push(cgArgument);
        this._currentArgument = cgArgument;

        if (node.required !== undefined && node.required !== null) {
            cgArgument.required = node.required;
        }

        if (node.ownerDocument().is2xDocument()) {
            this.visit20Parameter(node as Oas20Parameter);
        }
        if (node.ownerDocument().is3xDocument()) {
            this.visit30Parameter(node as Oas30Parameter);
        }
    }
    private visit20Parameter(node: Oas20Parameter): void {
        let cgReturn: CodegenJavaReturn = this.returnFromSchema(node.schema);
        if (cgReturn) {
            if (cgReturn.collection) { this._currentArgument.collection = cgReturn.collection; }
            if (cgReturn.type) { this._currentArgument.type = cgReturn.type; }
            if (cgReturn.format) { this._currentArgument.format = cgReturn.format; }
        }
    }
    private visit30Parameter(node: Oas30Parameter): void {
        if (node.getMediaTypes().length > 0) {
            let mediaTypes: Oas30MediaType[] = node.getMediaTypes();
            if (mediaTypes && mediaTypes.length > 0) {
                let mediaType: Oas30MediaType = mediaTypes[0];
                let cgReturn: CodegenJavaReturn = this.returnFromSchema(mediaType.schema);
                if (cgReturn) {
                    if (cgReturn.collection) { this._currentArgument.collection = cgReturn.collection; }
                    if (cgReturn.type) { this._currentArgument.type = cgReturn.type; }
                    if (cgReturn.format) { this._currentArgument.format = cgReturn.format; }
                }
            }
        } else if (node.schema) {
            this.visit20Parameter(node as any);
        }
    }

    /**
     * Visits a requesty body to produce a CodegenJavaArgument with in === "body".
     * @param {Oas30RequestBody} node
     */
    public visitRequestBody(node: Oas30RequestBody): void {
        let mediaTypes: Oas30MediaType[] = node.getMediaTypes();
        if (mediaTypes && mediaTypes.length > 0) {
            let mediaType: Oas30MediaType = mediaTypes[0];
            let cgArgument: CodegenJavaArgument = {
                name: "data",
                in: "body",
                required: true
            };
            let cgReturn: CodegenJavaReturn = this.returnFromSchema(mediaType.schema);
            if (cgReturn) {
                if (cgReturn.collection) { cgArgument.collection = cgReturn.collection; }
                if (cgReturn.type) { cgArgument.type = cgReturn.type; }
                if (cgReturn.format) { cgArgument.format = cgReturn.format; }
            }
            this._currentArgument = cgArgument;
            this._currentMethod.arguments.push(cgArgument);
        }
        // Push all of the media types onto the "consumes" array for the method.
        for (let mt of mediaTypes) {
            this._currentMethod.consumes.push(mt.name());
        }
    }

    /**
     * Visits a response to produce a CodegenJavaReturn for a method.
     * @param {OasResponse} node
     */
    public visitResponse(node: Oas20Response | Oas30Response): void {
        // Note: if there are multiple 2xx responses, only the first one will
        // become the method return value.
        if (node.statusCode() && node.statusCode().indexOf("2") === 0 && !this._currentMethod.return) {
            if (node.ownerDocument().is2xDocument()) {
                this.visit20Response(node as Oas20Response);
            }
            if (node.ownerDocument().is3xDocument()) {
                this.visit30Response(node as Oas30Response);
            }
        }
    }
    private visit20Response(node: Oas20Response): void {
        if (node.statusCode() && node.statusCode().indexOf("2") === 0) {
            this._currentMethod.return = this.returnFromSchema(node.schema);
        }
    }
    private visit30Response(node: Oas30Response): void {
        let mediaTypes: Oas30MediaType[] = node.getMediaTypes();
        if (mediaTypes && mediaTypes.length > 0) {
            let mediaType: Oas30MediaType = mediaTypes[0];
            this._currentMethod.return = this.returnFromSchema(mediaType.schema);
        }
        // Push all of the media types onto the "produces" array for the method.
        for (let mt of mediaTypes) {
            this._currentMethod.produces.push(mt.name());
        }
    }

    /**
     * Visits a schema definition to produce a CodegenJavaBean.
     * @param {Oas20SchemaDefinition | Oas30SchemaDefinition} node
     */
    public visitSchemaDefinition(node: Oas20SchemaDefinition | Oas30SchemaDefinition): void {
        let name: string = null;
        if (node.ownerDocument().is2xDocument()) {
            name = (node as Oas20SchemaDefinition).definitionName();
        } else if (node.ownerDocument().is3xDocument()) {
            name = (node as Oas30SchemaDefinition).name();
        }
        let bean: CodegenJavaBean = {
            name: name,
            package: this.packageName + ".beans",
            $schema: this._library.writeNode(node)
        };
        this.codegenInfo.beans.push(bean);
    }

    private getOrCreateInterface(path: string): CodegenJavaInterface {
        let interfaceName: string = this.interfacesIndex[path];
        for (let cgInterface of this.codegenInfo.interfaces) {
            if (cgInterface.name === interfaceName) {
                return cgInterface;
            }
        }
        let ifacePath: string = "/";
        if (interfaceName !== "Root") {
            ifacePath = "/" + path.split("/")[1];
        }
        let cgInterface: CodegenJavaInterface = {
            name: interfaceName,
            package: this.packageName,
            path: ifacePath,
            methods: []
        };
        this.codegenInfo.interfaces.push(cgInterface);
        return cgInterface;
    }

    private methodName(operation: OasOperation): string {
        if (operation.operationId !== null && operation.operationId !== undefined && operation.operationId.length > 0) {
            return operation.operationId;
        }
        if (operation.summary !== null && operation.summary !== undefined && operation.summary.length > 0) {
            let nameSegments: string [] = operation.summary.split(" ");
            return this.decapitalize(nameSegments.map( segment => {
                return this.capitalize(segment.replace(/\W/g, ''));
            }).join(''));
        }
        return "generatedMethod" + this._methodCounter++;
    }

    private methodPath(operation: OasOperation): string {
        let path: string = (operation.parent() as OasPathItem).path();
        if (path === this._currentInterface.path) {
            return null;
        }
        path = path.substring(this._currentInterface.path.length);
        if (path === "/") {
            return null;
        }
        return path;
    }

    private returnFromSchema(schema: OasSchema): CodegenJavaReturn {
        if (schema === null || schema === undefined) {
            return null;
        }
        let cgReturn: CodegenJavaReturn = {
            type: null
        };
        if (schema.$ref) {
            cgReturn.type = this.typeFromSchemaRef(schema.$ref);
        } else if (schema.type === "array") {
            cgReturn.collection = "list";
            let items: OasSchema = schema.items as OasSchema;
            let subReturn: CodegenJavaReturn = this.returnFromSchema(items);
            if (subReturn && subReturn.type) {
                cgReturn.type = subReturn.type;
            }
            if (subReturn && subReturn.format) {
                cgReturn.format = subReturn.format;
            }
        } else {
            if (schema.type) {
                cgReturn.type = schema.type;
            }
            if (schema.format) {
                cgReturn.format = schema.format;
            }
        }
        return cgReturn;
    }

    private typeFromSchemaRef(schemaRef: string): string {
        if (schemaRef && schemaRef.indexOf("#/components/schemas/") === 0) {
            return this.packageName + ".beans." + schemaRef.substring(21);
        }
        if (schemaRef && schemaRef.indexOf("#/definitions/") === 0) {
            return this.packageName + ".beans." + schemaRef.substring(14);
        }
        return null;
    }

    private isPathItem(node: OasNode): boolean {
        let viz: PathItemDetectionVisitor = new PathItemDetectionVisitor();
        OasVisitorUtil.visitNode(node, viz);
        return viz.isPathItem;
    }

    /**
     * Capitalizes a word.
     * @param {string} word
     * @return {string}
     */
    private capitalize(word: string) {
        return word.charAt(0).toUpperCase() + word.slice(1);
    }

    /**
     * De-capitalizes a word.
     * @param {string} word
     * @return {string}
     */
    private decapitalize(word: string) {
        return word.charAt(0).toLowerCase() + word.slice(1);
    }

}
