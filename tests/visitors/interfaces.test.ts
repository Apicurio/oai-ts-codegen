///<reference path="../../node_modules/@types/jasmine/index.d.ts"/>
///<reference path="../../tests/@types/karma-read-json/index.d.ts"/>

import {OasDocument, OasLibraryUtils, OasVisitorUtil} from "oai-ts-core";
import {InterfaceInfo, InterfacesVisitor} from "../../src/visitors/interfaces.visitor";

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

describe("Interfaces Visitor Test", () => {

    it("Interfaces (3.0)", () => {
        let beerApiJs: any = readJSON("tests/_fixtures/3.0/beer-api.json");
        let library: OasLibraryUtils = new OasLibraryUtils();
        let doc: OasDocument = library.createDocument(beerApiJs);

        let visitor: InterfacesVisitor = new InterfacesVisitor();
        OasVisitorUtil.visitTree(doc, visitor);

        let actual: InterfaceInfo[] = visitor.getInterfaces();
        let expected: InterfaceInfo[] = [
            {
                name: "Beers",
                paths: [ "/beers/{beerId}", "/beers" ]
            },
            {
                name: "Breweries",
                paths: [ "/breweries", "/breweries/{breweryId}", "/breweries/{breweryId}/beers" ]
            }
        ];

        expect(actual).toEqual(expected);
    });

});
