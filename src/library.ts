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
import {OasDocument, OasVisitorUtil} from "oai-ts-core";
import {CodegenInfo} from "./models/codegen-info.model";
import {InterfacesVisitor} from "./visitors/interfaces.visitor";
import {OpenApi2CodegenVisitor} from "./visitors/oai2codegen.visitor";

export class CodegenLibrary {

    /**
     * Called to generate a CodegenInfo from the given OAI document and Java package name.
     * @param {OasDocument} document
     * @param {string} javaPackage
     * @return {CodegenInfo}
     */
    public generateJaxRsInfo(document: OasDocument, javaPackage: string): CodegenInfo {
        // First, figure out the breakdown of the interfaces.
        let visitor: InterfacesVisitor = new InterfacesVisitor();
        OasVisitorUtil.visitTree(document, visitor);

        // Then generate the CodegenInfo object.
        let cgVisitor: OpenApi2CodegenVisitor = new OpenApi2CodegenVisitor(javaPackage, visitor.getInterfaces());
        OasVisitorUtil.visitTree(document, cgVisitor);

        return cgVisitor.getCodegenInfo();
    }

}