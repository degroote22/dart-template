"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var capitalize = function (s) {
    return (s[0] || "").toUpperCase() + s.slice(1, s.length);
};
var uncapitalize = function (s) {
    return (s[0] || "").toLowerCase() + s.slice(1, s.length);
};
var getFullName = function (op) {
    return capitalize(op.name) + capitalize(op.operationType);
};
var getArrayContent = function (_a) {
    var isNullableArray = _a.isNullableArray, _type = _a._type, name = _a.name, _data = _a._data, _mappedData = _a._mappedData;
    var content = "";
    if (isNullableArray) {
        content = "Option<" + _type + "> get " + name + " => option<" + _type + ">(" + _data + " != null, " + _mappedData + ");";
    }
    else {
        content = _type + " get " + name + " => " + _mappedData + ";";
    }
    return { content: content };
};
var mappedType = function (type) {
    var types = {
        String: "String",
        Int: "int",
        Float: "double",
        Boolean: "bool",
        ID: "String",
    };
    if (types[type]) {
        return types[type];
    }
    return "String";
};
var _ErrorLogged = /** @class */ (function (_super) {
    __extends(_ErrorLogged, _super);
    function _ErrorLogged(r) {
        var _this = this;
        console.error(r);
        _this = _super.call(this, r) || this;
        return _this;
    }
    return _ErrorLogged;
}(Error));
var ErrorLogged = function (r) { return new _ErrorLogged(r); };
var prepareComment = function (comment) {
    return comment
        .split("\n")
        .map(function (x) { return "/// " + x + "\n"; })
        .join("");
};
var getComment = function (context, type) {
    var typeData = context.types.find(function (x) { return x.name === type; });
    var comment = typeData && typeData.description
        ? prepareComment(typeData.description)
        : "";
    return comment;
};
var printLeaf = function (selection, context, parentType) {
    var isRequired = selection.isRequired, type = selection.type, name = selection.name, isArray = selection.isArray, isNullableArray = selection.isNullableArray;
    var content = "";
    if (isArray) {
        var fieldType = "" + capitalize(type);
        if (!isNullableArray) {
            var _type = "List<" + fieldType + ">";
            var _data = "this._d[\"" + name + "\"]";
            var _mapFn = "(dynamic " + uncapitalize(type) + ") => " + uncapitalize(type);
            var _mappedData = "(" + _data + " as List).map<" + fieldType + ">(" + _mapFn + ").toList()";
            var contentAndUsedOption = getArrayContent({
                isNullableArray: !isRequired,
                _type: _type,
                name: name,
                _data: _data,
                _mappedData: _mappedData,
            });
            content = contentAndUsedOption.content;
        }
        else {
            var _type = "List<Option<" + fieldType + ">>";
            var _data = "this._d[\"" + name + "\"]";
            var _mapFn = "(dynamic " + uncapitalize(type) + ") => option<" + fieldType + ">(" + uncapitalize(type) + "!=null, " + uncapitalize(type) + ")";
            var _mappedData = "(" + _data + " as List).map<Option<" + fieldType + ">>(" + _mapFn + ").toList()";
            var contentAndUsedOption = getArrayContent({
                isNullableArray: !isRequired,
                _type: _type,
                name: name,
                _data: _data,
                _mappedData: _mappedData,
            });
            content = contentAndUsedOption.content;
        }
    }
    else {
        var fixDouble = mappedType(type) == "double" ? ".toDouble()" : "";
        var fixDouble2 = mappedType(type) == "double" ? ".map((dynamic x) => x.toDouble())" : "";
        if (isRequired) {
            content = mappedType(type) + " get " + name + " => this._d[\"" + name + "\"]" + fixDouble + ";";
        }
        else {
            content = "Option<" + mappedType(type) + "> get " + name + " => option<" + mappedType(type) + ">(this._d[\"" + name + "\"]!=null, this._d[\"" + name + "\"])" + fixDouble2 + ";";
        }
    }
    var parentData = context.types.find(function (x) { return x.name === parentType; });
    var typeData = parentData
        ? parentData.fields.find(function (x) { return x.name === name; })
        : null;
    var comment = typeData && typeData.description
        ? prepareComment(typeData.description)
        : "";
    return { leaf: comment + content };
};
var printField = function (fields, name, context, type) {
    var processedSet = processSelectionSet(fields, name, context, type);
    var comment = getComment(context, type);
    var field = processedSet.topLevel + "\n" + comment + "class " + name + " {\n" + name + "(this._d);\n\nfinal Map<String, dynamic> _d;\n\n" + processedSet.content + "\n\ndynamic get rawData => this._d;\n\nString toString() {\n    return this._d.toString();\n}\n}\n";
    return {
        field: field,
    };
};
var processField = function (selection, parentName, context) {
    var isRequired = selection.isRequired, type = selection.type, name = selection.name, isArray = selection.isArray, isNullableArray = selection.isNullableArray;
    var fieldType = "" + parentName + capitalize(type);
    var content = "";
    if (isArray) {
        if (!isNullableArray) {
            var _type = "List<" + fieldType + ">";
            var _data = "this._d[\"" + name + "\"]";
            var _mapFn = "(dynamic " + uncapitalize(type) + ") => " + fieldType + "(" + uncapitalize(type) + ")";
            var _mappedData = "(" + _data + " as List).map<" + fieldType + ">(" + _mapFn + ").toList()";
            var contentAndUsedOption = getArrayContent({
                isNullableArray: !isRequired,
                _type: _type,
                name: name,
                _data: _data,
                _mappedData: _mappedData,
            });
            content = contentAndUsedOption.content;
        }
        else {
            var _type = "List<Option<" + fieldType + ">>";
            var _data = "this._d[\"" + name + "\"]";
            var _mapFn = "(dynamic " + uncapitalize(type) + ") => option<" + fieldType + ">(" + uncapitalize(type) + "!=null, " + fieldType + "(" + uncapitalize(type) + "))";
            var _mappedData = "(" + _data + " as List).map<Option<" + fieldType + ">>(" + _mapFn + ").toList()";
            content = getArrayContent({
                isNullableArray: !isRequired,
                _type: _type,
                name: name,
                _data: _data,
                _mappedData: _mappedData,
            }).content;
        }
    }
    else {
        if (isRequired) {
            content = fieldType + " get " + name + " => " + fieldType + "(this._d[\"" + name + "\"]);";
        }
        else {
            content = "Option<" + fieldType + "> get " + name + " => option<" + fieldType + ">(this._d[\"" + name + "\"]!=null, " + fieldType + "(this._d[\"" + name + "\"]));";
        }
    }
    var comment = getComment(context, type);
    return {
        content: comment + content,
        topLevel: printField(selection.selectionSet, fieldType, context, type)
            .field,
    };
};
var processSelectionSet = function (selectionSet, parentName, context, parentType) {
    var _topLevel = [];
    var content = selectionSet
        .map(function (selection) {
        var isSelectionSetFieldNode = function (s) {
            return typeof s.dimensionOfArray === "number";
        };
        if (selection.isLeaf && isSelectionSetFieldNode(selection)) {
            var leafAndUsedOption = printLeaf(selection, context, parentType);
            return leafAndUsedOption.leaf;
        }
        else if (selection.isField && isSelectionSetFieldNode(selection)) {
            var result = processField(selection, parentName, context);
            _topLevel.push(result.topLevel);
            return result.content;
        }
        throw ErrorLogged("processSelectionSet: Not implemented");
    })
        .join("\n");
    return { content: content, topLevel: _topLevel.join("\n") };
};
var makeVariablesClass = function (op) {
    if (op.hasVariables) {
        var argsList = op.variables
            .map(function (_a) {
            var name = _a.name, isRequired = _a.isRequired;
            return (isRequired ? "@required " : "") + " this." + name;
        })
            .join(", ");
        var varsList = op.variables
            .map(function (_a) {
            var type = _a.type, name = _a.name, isArray = _a.isArray;
            var t = mappedType(type);
            // if (!isRequired){
            //   t = `Option<${t}>`
            // }
            if (isArray) {
                t = "List<" + t + ">";
            }
            // if (isNullableArray) {
            //   t = `Option<${t}>`
            // }
            return "final " + t + " " + name + ";";
        })
            .join("\n");
        var body = op.variables
            .map(function (_a) {
            var name = _a.name;
            return "\"" + name + "\": " + name + ",";
        })
            .join("\n");
        var variableClasses = "\n      class " + capitalize(op.name) + "Variables {\n        " + capitalize(op.name) + "Variables({" + argsList + "});\n\n        " + varsList + "\n\n        Map<String, dynamic> vars() {\n          return <String, dynamic>{" + body + "};\n        }\n      }\n    ";
        return { variableClasses: variableClasses };
    }
    return { variableClasses: "" };
};
var processOperation = function (op, context) {
    var variableClasses = makeVariablesClass(op).variableClasses;
    var field = printField(op.selectionSet, capitalize(op.name), context, op.name).field;
    var IMPORT_REQUIRED = "import 'package:flutter/foundation.dart';";
    var IMPORT_OPTION = "import 'package:dartz/dartz.dart';";
    var usedRequired = variableClasses.includes("@required");
    var usedOption = field.includes("Option<");
    return (usedOption ? IMPORT_OPTION : "") + "\n" + (usedRequired ? IMPORT_REQUIRED : "") + "\n" + variableClasses + "\n" + field + "\n";
};
function default_1(templateContext, mergedDocuments, _settings) {
    // writeFileSync(
    //   "./src/test/calls/1.json",
    //   JSON.stringify({ templateContext, mergedDocuments, settings: _settings })
    // );
    // return [];
    return mergedDocuments.operations.map(function (op) {
        return {
            filename: getFullName(op) + ".dart",
            content: processOperation(op, templateContext),
        };
    });
}
exports.default = default_1;
