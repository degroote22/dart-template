import codegen from "../index";
import { readFileSync } from "fs";

describe("codegen", () => {
  it("works", () => {
    const args = JSON.parse(readFileSync("src/test/calls/1.json", "utf-8"));
    expect(
      codegen(args.templateContext, args.mergedDocuments, args.settings)
    ).toMatchSnapshot();
  });
});
