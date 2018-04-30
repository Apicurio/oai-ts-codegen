///<reference path="../../node_modules/@types/jasmine/index.d.ts"/>
///<reference path="../../tests/@types/karma-read-json/index.d.ts"/>

import {OasDocument, OasLibraryUtils, OasVisitorUtil} from "oai-ts-core";
import {InterfaceInfo, InterfacesVisitor} from "../../src/visitors/interfaces.visitor";
import {CodegenLibrary} from "../../src/library";
import {CodegenInfo} from "../../src/models/codegen-info.model";

/**
 * @license
 * Copyright 2018 JBoss Inc
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

describe("OpenApi2Codegen Visitor Test", () => {

    it("Beer API (3.0)", () => {
        let beerApiJs: any = readJSON("tests/_fixtures/3.0/beer-api.json");
        let library: OasLibraryUtils = new OasLibraryUtils();
        let doc: OasDocument = library.createDocument(beerApiJs);

        let cgLibrary: CodegenLibrary = new CodegenLibrary();
        let info: CodegenInfo = cgLibrary.generateJaxRsInfo(doc, "org.example.beer");

        let actual: any = info;
        let expected: any = readJSON("tests/_fixtures/oai2codegen/beer-api.codegen.json");

        // console.info(JSON.stringify(actual, null, 2));

        expect(actual).toEqual(expected);
    });

    it("Simple API (3.0)", () => {
        let beerApiJs: any = readJSON("tests/_fixtures/3.0/simple-api.json");
        let library: OasLibraryUtils = new OasLibraryUtils();
        let doc: OasDocument = library.createDocument(beerApiJs);

        let cgLibrary: CodegenLibrary = new CodegenLibrary();
        let info: CodegenInfo = cgLibrary.generateJaxRsInfo(doc, "io.openapi.simple");

        let actual: any = info;
        let expected: any = readJSON("tests/_fixtures/oai2codegen/simple-api.codegen.json");

        //console.info(JSON.stringify(actual, null, 2));

        expect(actual).toEqual(expected);
    });

    it("Gateway API (2.0)", () => {
        let beerApiJs: any = readJSON("tests/_fixtures/2.0/gateway-api.json");
        let library: OasLibraryUtils = new OasLibraryUtils();
        let doc: OasDocument = library.createDocument(beerApiJs);

        let cgLibrary: CodegenLibrary = new CodegenLibrary();
        let info: CodegenInfo = cgLibrary.generateJaxRsInfo(doc, "io.openapi.simple");

        let actual: any = info;
        let expected: any = readJSON("tests/_fixtures/oai2codegen/gateway-api.codegen.json");

        //console.info(JSON.stringify(actual, null, 2));

        expect(actual).toEqual(expected);
    });

});
