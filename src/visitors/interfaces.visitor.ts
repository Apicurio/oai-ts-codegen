import {OasCombinedVisitorAdapter, OasPathItem} from "oai-ts-core";

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

export interface InterfaceInfo {

    name: string;
    paths: string[];

}

/**
 * Visitor used to organize all of the paths into a set of interface names.
 *
 * TODO once everything is done, find all interfaces with only 1 path and pull them all into Root
 */
export class InterfacesVisitor extends OasCombinedVisitorAdapter {

    interfaces: any = {};

    public getInterfaces(): InterfaceInfo[] {
        let rval: InterfaceInfo[] = [];
        for (let name in this.interfaces) {
            rval.push(this.interfaces[name] as InterfaceInfo);
        }
        return rval;
    }

    /**
     * Visits a Path Item to produce
     * @param {OasPathItem} node
     */
    public visitPathItem(node: OasPathItem): void {
        let p: string = node.path();
        let split: string[] = p.split("/");
        if (split && split.length > 1) {
            let firstSegment: string = split[1];
            if (firstSegment && firstSegment !== "" && firstSegment.indexOf("{") === -1) {
                let iname: string = this.capitalize(firstSegment) + "Resource";
                this.addPathTo(p, iname);
                return;
            }
        }

        // Default.
        this.addPathTo(p, "RootResource");
    }

    /**
     * Adds a path to an interface.  Creates the interface mapping if it doesn't exist yet.
     * @param {string} path
     * @param {string} interfaceName
     */
    private addPathTo(path: string, interfaceName: string): void {
        let info: InterfaceInfo = this.interfaces[interfaceName];
        if (info === null || info === undefined) {
            info = {
                name: interfaceName,
                paths: []
            };
            this.interfaces[interfaceName] = info;
        }

        info.paths.push(path);
    }

    /**
     * Capitalizes a word.
     * @param {string} firstSegment
     * @return {string}
     */
    private capitalize(firstSegment: string) {
        return firstSegment.charAt(0).toUpperCase() + firstSegment.slice(1);
    }
}
