import {
  SchemaTemplateContext,
  FileOutput,
  Document,
  Operation,
  SelectionSetFieldNode,
  SelectionSetItem,
} from "graphql-codegen-core/dist/types";

const capitalize = (s: string) =>
  (s[0] || "").toUpperCase() + s.slice(1, s.length);

const uncapitalize = (s: string) =>
  (s[0] || "").toLowerCase() + s.slice(1, s.length);

const getFullName = (op: Operation) =>
  capitalize(op.name) + capitalize(op.operationType);

const getArrayContent = ({
  isNullableArray,
  _type,
  name,
  _data,
  _mappedData,
}: {
  isNullableArray: boolean;
  _type: string;
  name: string;
  _data: string;
  _mappedData: string;
}): { content: string } => {
  let content = "";
  if (isNullableArray) {
    content = `Option<${_type}> get ${name} => option<${_type}>(${_data} != null, ${_mappedData});`;
  } else {
    content = `${_type} get ${name} => ${_mappedData};`;
  }
  return { content };
};

const mappedType = (type: string) => {
  const types = {
    String: "String",
    Int: "int",
    Float: "double",
    Boolean: "bool",
    ID: "String",
  };

  if ((types as { [key: string]: string })[type]) {
    return (types as { [key: string]: string })[type];
  }
  return "String";
};

class _ErrorLogged extends Error {
  constructor(r: string) {
    console.error(r);
    super(r);
  }
}
const ErrorLogged = (r: string) => new _ErrorLogged(r);

const prepareComment = (comment: string) =>
  comment
    .split("\n")
    .map(x => `/// ${x}\n`)
    .join("");
const getComment = (context: SchemaTemplateContext, type: string) => {
  const typeData = context.types.find(x => x.name === type);
  const comment =
    typeData && typeData.description
      ? prepareComment(typeData.description)
      : "";
  return comment;
};

const printLeaf = (
  selection: SelectionSetFieldNode,
  context: SchemaTemplateContext,
  parentType: string,
): { leaf: string } => {
  const { isRequired, type, name, isArray, isNullableArray } = selection;
  let content = "";
  if (isArray) {
    const fieldType = `${capitalize(type)}`;

    if (!isNullableArray) {
      const _type = `List<${fieldType}>`;
      const _data = `this._d["${name}"]`;
      const _mapFn = `(dynamic ${uncapitalize(type)}) => ${uncapitalize(type)}`;
      const _mappedData = `(${_data} as List).map<${fieldType}>(${_mapFn}).toList()`;
      const contentAndUsedOption = getArrayContent({
        isNullableArray: !isRequired,
        _type,
        name,
        _data,
        _mappedData,
      });
      content = contentAndUsedOption.content;
    } else {
      const _type = `List<Option<${fieldType}>>`;
      const _data = `this._d["${name}"]`;
      const _mapFn = `(dynamic ${uncapitalize(
        type,
      )}) => option<${fieldType}>(${uncapitalize(type)}!=null, ${uncapitalize(
        type,
      )})`;
      const _mappedData = `(${_data} as List).map<Option<${fieldType}>>(${_mapFn}).toList()`;
      const contentAndUsedOption = getArrayContent({
        isNullableArray: !isRequired,
        _type,
        name,
        _data,
        _mappedData,
      });
      content = contentAndUsedOption.content;
    }
  } else {
    const fixDouble = mappedType(type) == "double" ? ".toDouble()" : "";
    const fixDouble2 =
      mappedType(type) == "double" ? ".map((dynamic x) => x.toDouble())" : "";
    if (isRequired) {
      content = `${mappedType(
        type,
      )} get ${name} => this._d["${name}"]${fixDouble};`;
    } else {
      content = `Option<${mappedType(type)}> get ${name} => option<${mappedType(
        type,
      )}>(this._d["${name}"]!=null, this._d["${name}"])${fixDouble2};`;
    }
  }
  const parentData = context.types.find(x => x.name === parentType);
  const typeData = parentData
    ? parentData.fields.find(x => x.name === name)
    : null;
  const comment =
    typeData && typeData.description
      ? prepareComment(typeData.description)
      : "";
  return { leaf: comment + content };
};

const printField = (
  fields: SelectionSetItem[],
  name: string,
  context: SchemaTemplateContext,
  type: string,
): { field: string } => {
  const processedSet = processSelectionSet(fields, name, context, type);

  const comment = getComment(context, type);

  const field = `${processedSet.topLevel}
${comment}class ${name} {
${name}(this._d);

final Map<String, dynamic> _d;

${processedSet.content}

dynamic get rawData => this._d;

String toString() {
    return this._d.toString();
}
}
`;
  return {
    field,
  };
};

const processField = (
  selection: SelectionSetFieldNode,
  parentName: string,
  context: SchemaTemplateContext,
): { content: string; topLevel: string } => {
  const { isRequired, type, name, isArray, isNullableArray } = selection;
  const fieldType = `${parentName}${capitalize(type)}`;
  let content = "";

  if (isArray) {
    if (!isNullableArray) {
      const _type = `List<${fieldType}>`;
      const _data = `this._d["${name}"]`;
      const _mapFn = `(dynamic ${uncapitalize(
        type,
      )}) => ${fieldType}(${uncapitalize(type)})`;
      const _mappedData = `(${_data} as List).map<${fieldType}>(${_mapFn}).toList()`;
      const contentAndUsedOption = getArrayContent({
        isNullableArray: !isRequired,
        _type,
        name,
        _data,
        _mappedData,
      });
      content = contentAndUsedOption.content;
    } else {
      const _type = `List<Option<${fieldType}>>`;
      const _data = `this._d["${name}"]`;
      const _mapFn = `(dynamic ${uncapitalize(
        type,
      )}) => option<${fieldType}>(${uncapitalize(
        type,
      )}!=null, ${fieldType}(${uncapitalize(type)}))`;
      const _mappedData = `(${_data} as List).map<Option<${fieldType}>>(${_mapFn}).toList()`;

      content = getArrayContent({
        isNullableArray: !isRequired,
        _type,
        name,
        _data,
        _mappedData,
      }).content;
    }
  } else {
    if (isRequired) {
      content = `${fieldType} get ${name} => ${fieldType}(this._d["${name}"]);`;
    } else {
      content = `Option<${fieldType}> get ${name} => option<${fieldType}>(this._d["${name}"]!=null, ${fieldType}(this._d["${name}"]));`;
    }
  }

  const comment = getComment(context, type);

  return {
    content: comment + content,
    topLevel: printField(selection.selectionSet, fieldType, context, type)
      .field,
  };
};

const processSelectionSet = (
  selectionSet: SelectionSetItem[],
  parentName: string,
  context: SchemaTemplateContext,
  parentType: string,
): { content: string; topLevel: string } => {
  const _topLevel: string[] = [];

  const content = selectionSet
    .map(
      (selection): string => {
        const isSelectionSetFieldNode = (s: any): s is SelectionSetFieldNode =>
          typeof s.dimensionOfArray === "number";
        if (selection.isLeaf && isSelectionSetFieldNode(selection)) {
          const leafAndUsedOption = printLeaf(selection, context, parentType);
          return leafAndUsedOption.leaf;
        } else if (selection.isField && isSelectionSetFieldNode(selection)) {
          const result = processField(selection, parentName, context);
          _topLevel.push(result.topLevel);
          return result.content;
        }
        throw ErrorLogged("processSelectionSet: Not implemented");
      },
    )
    .join("\n");
  return { content, topLevel: _topLevel.join("\n") };
};

const makeVariablesClass = (op: Operation) => {
  if (op.hasVariables) {
    const argsList = op.variables
      .map(({ name, isRequired }) => {
        return `${isRequired ? "@required " : ""} this.${name}`;
      })
      .join(", ");

    const varsList = op.variables
      .map(({ type, name, isArray }) => {
        let t = mappedType(type);

        // if (!isRequired){
        //   t = `Option<${t}>`
        // }

        if (isArray) {
          t = `List<${t}>`;
        }

        // if (isNullableArray) {
        //   t = `Option<${t}>`
        // }

        return `final ${t} ${name};`;
      })
      .join("\n");

    const body = op.variables
      .map(({ name }) => {
        return `"${name}": ${name},`;
      })
      .join("\n");

    const variableClasses = `
      class ${capitalize(op.name)}Variables {
        ${capitalize(op.name)}Variables({${argsList}});

        ${varsList}

        Map<String, dynamic> vars() {
          return <String, dynamic>{${body}};
        }
      }
    `;
    return { variableClasses };
  }

  return { variableClasses: "" };
};

const processOperation = (
  op: Operation,
  context: SchemaTemplateContext,
): string => {
  const { variableClasses } = makeVariablesClass(op);
  const { field } = printField(
    op.selectionSet,
    capitalize(op.name),
    context,
    op.name,
  );
  const IMPORT_REQUIRED = "import 'package:flutter/foundation.dart';";
  const IMPORT_OPTION = "import 'package:dartz/dartz.dart';";
  const usedRequired = variableClasses.includes("@required");
  const usedOption = field.includes("Option<");

  return `\
${usedOption ? IMPORT_OPTION : ""}
${usedRequired ? IMPORT_REQUIRED : ""}
${variableClasses}
${field}
`;
};
export default function(
  templateContext: SchemaTemplateContext,
  mergedDocuments: Document,
  _settings: any,
): FileOutput[] | Promise<FileOutput[]> {
  // writeFileSync(
  //   "./src/test/calls/1.json",
  //   JSON.stringify({ templateContext, mergedDocuments, settings: _settings })
  // );
  // return [];
  return mergedDocuments.operations.map(op => {
    return {
      filename: getFullName(op) + ".dart",
      content: processOperation(op, templateContext),
    };
  });
}
